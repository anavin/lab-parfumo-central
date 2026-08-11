package com.labparfumo.pos

import android.annotation.SuppressLint
import android.bluetooth.*
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.content.Context
import android.os.Handler
import android.os.Looper
import java.util.ArrayDeque

/**
 * Prints ESC/POS bytes to a generic Bluetooth-LE thermal printer over GATT.
 * Resolves the printer once (cached MAC → bonded → BLE scan by printer-ish name),
 * negotiates MTU, auto-detects a writable characteristic, and streams the data in
 * flow-controlled chunks. All BLE quirks live here so the web only calls printBluetooth().
 */
@SuppressLint("MissingPermission")
object BlePrinter {
    private const val PREFS = "lp_ble"
    private const val KEY_MAC = "printer_mac"
    private val NAME = Regex("(print|pos|mtp|thermal|\\bbt\\b|power|iq|rpp|goojprt|kprint|blue|tp\\d)", RegexOption.IGNORE_CASE)

    fun print(ctx: Context, data: ByteArray, onResult: (Boolean, String) -> Unit) {
        val adapter = (ctx.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager)?.adapter
            ?: return onResult(false, "อุปกรณ์ไม่มี Bluetooth")
        if (!adapter.isEnabled) return onResult(false, "กรุณาเปิด Bluetooth")
        val prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val cachedFail = { prefs.edit().remove(KEY_MAC).apply() }

        prefs.getString(KEY_MAC, null)?.let { mac ->
            try { GattJob(ctx, adapter.getRemoteDevice(mac), data) { ok, m -> if (!ok) cachedFail(); if (ok) onResult(true, m) else resolveFresh(ctx, adapter, prefs, data, onResult, m) }.start(); return }
            catch (_: Exception) { cachedFail() }
        }
        resolveFresh(ctx, adapter, prefs, data, onResult, "")
    }

    private fun resolveFresh(ctx: Context, adapter: BluetoothAdapter, prefs: android.content.SharedPreferences, data: ByteArray, onResult: (Boolean, String) -> Unit, prevErr: String) {
        val bonded = try { adapter.bondedDevices } catch (e: Exception) { null }
        bonded?.firstOrNull { NAME.containsMatchIn(it.name ?: "") }?.let { dev ->
            prefs.edit().putString(KEY_MAC, dev.address).apply()
            GattJob(ctx, dev, data) { ok, m -> onResult(ok, m) }.start(); return
        }
        scanForPrinter(ctx, adapter) { dev ->
            if (dev == null) onResult(false, if (prevErr.isNotEmpty()) prevErr else "หาเครื่องพิมพ์ BLE ไม่เจอ (เปิดเครื่อง + อยู่ใกล้ + Bluetooth เปิด)")
            else { prefs.edit().putString(KEY_MAC, dev.address).apply(); GattJob(ctx, dev, data) { ok, m -> onResult(ok, m) }.start() }
        }
    }

    private fun scanForPrinter(ctx: Context, adapter: BluetoothAdapter, cb: (BluetoothDevice?) -> Unit) {
        val scanner = adapter.bluetoothLeScanner ?: return cb(null)
        val handler = Handler(Looper.getMainLooper())
        var done = false
        val sc = object : ScanCallback() {
            override fun onScanResult(type: Int, r: ScanResult) {
                val name = (r.device.name ?: r.scanRecord?.deviceName ?: "")
                if (name.isNotBlank() && NAME.containsMatchIn(name) && !done) {
                    done = true
                    try { scanner.stopScan(this) } catch (_: Exception) {}
                    handler.removeCallbacksAndMessages(null); cb(r.device)
                }
            }
        }
        try { scanner.startScan(sc) } catch (e: Exception) { cb(null); return }
        handler.postDelayed({ if (!done) { done = true; try { scanner.stopScan(sc) } catch (_: Exception) {}; cb(null) } }, 9000)
    }

    @SuppressLint("MissingPermission")
    private class GattJob(val ctx: Context, val device: BluetoothDevice, val data: ByteArray, val onResult: (Boolean, String) -> Unit) {
        private val handler = Handler(Looper.getMainLooper())
        private var gatt: BluetoothGatt? = null
        private var writeChar: BluetoothGattCharacteristic? = null
        private val chunks = ArrayDeque<ByteArray>()
        private var mtu = 20
        private var finished = false
        private val timeout = Runnable { finish(false, "เชื่อมต่อเครื่องพิมพ์ไม่ทัน (timeout)") }

        fun start() { handler.postDelayed(timeout, 18000); gatt = device.connectGatt(ctx, false, cb, BluetoothDevice.TRANSPORT_LE) }

        private fun finish(ok: Boolean, msg: String) {
            if (finished) return; finished = true
            handler.removeCallbacks(timeout)
            handler.post { try { gatt?.disconnect(); gatt?.close() } catch (_: Exception) {}; onResult(ok, msg) }
        }

        private val cb = object : BluetoothGattCallback() {
            override fun onConnectionStateChange(g: BluetoothGatt, status: Int, newState: Int) {
                if (newState == BluetoothProfile.STATE_CONNECTED) g.requestMtu(247)
                else if (newState == BluetoothProfile.STATE_DISCONNECTED && !finished) finish(false, "การเชื่อมต่อหลุด")
            }
            override fun onMtuChanged(g: BluetoothGatt, m: Int, status: Int) { mtu = m; g.discoverServices() }
            override fun onServicesDiscovered(g: BluetoothGatt, status: Int) {
                var ch: BluetoothGattCharacteristic? = null
                loop@ for (s in g.services) for (c in s.characteristics) {
                    val p = c.properties
                    if (p and BluetoothGattCharacteristic.PROPERTY_WRITE != 0) { ch = c; break@loop }         // prefer write-with-response
                    if (p and BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE != 0 && ch == null) ch = c
                }
                if (ch == null) { finish(false, "ไม่พบช่องเขียนข้อมูลของเครื่องพิมพ์"); return }
                writeChar = ch
                @Suppress("DEPRECATION")
                ch.writeType = if (ch.properties and BluetoothGattCharacteristic.PROPERTY_WRITE != 0)
                    BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT else BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE
                val size = (mtu - 5).coerceIn(20, 500)
                var i = 0; while (i < data.size) { val e = minOf(i + size, data.size); chunks.add(data.copyOfRange(i, e)); i = e }
                writeNext(g)
            }
            override fun onCharacteristicWrite(g: BluetoothGatt, c: BluetoothGattCharacteristic, status: Int) {
                if (writeChar?.writeType == BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT) {
                    if (status != BluetoothGatt.GATT_SUCCESS) finish(false, "เขียนข้อมูลผิดพลาด ($status)") else writeNext(g)
                }
            }
        }

        @Suppress("DEPRECATION")
        private fun writeNext(g: BluetoothGatt) {
            if (finished) return
            val next = chunks.poll() ?: run { handler.postDelayed({ finish(true, "") }, 600); return }  // drain, then done
            val ch = writeChar!!
            ch.value = next
            if (!g.writeCharacteristic(ch)) { finish(false, "ส่งข้อมูลไม่สำเร็จ"); return }
            if (ch.writeType == BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE) handler.postDelayed({ writeNext(g) }, 22)  // pace: no callback
        }
    }
}
