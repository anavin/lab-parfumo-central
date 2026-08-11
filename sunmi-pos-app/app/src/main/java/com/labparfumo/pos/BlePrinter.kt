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
 *
 * Every step appends to a shared diagnostic log; the log is returned in onResult so
 * the app can show it (screenshot-able) when something goes wrong.
 */
@SuppressLint("MissingPermission")
object BlePrinter {
    private const val PREFS = "lp_ble"
    private const val KEY_MAC = "printer_mac"
    private val NAME = Regex("(print|pos|mtp|thermal|\\bbt\\b|power|iq|rpp|goojprt|kprint|blue|tp\\d)", RegexOption.IGNORE_CASE)

    fun print(ctx: Context, data: ByteArray, onResult: (Boolean, String) -> Unit) {
        val log = StringBuilder()
        val add: (String) -> Unit = { log.append(it).append('\n') }
        val done: (Boolean, String) -> Unit = { ok, msg -> add(if (ok) "✓ $msg" else "✗ $msg"); onResult(ok, log.toString().trim()) }

        val adapter = (ctx.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager)?.adapter
            ?: return done(false, "อุปกรณ์ไม่มี Bluetooth")
        if (!adapter.isEnabled) return done(false, "กรุณาเปิด Bluetooth")
        add("bytes=${data.size}")
        val prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val cachedFail = { prefs.edit().remove(KEY_MAC).apply() }

        prefs.getString(KEY_MAC, null)?.let { mac ->
            add("cached MAC=$mac")
            try { GattJob(ctx, adapter.getRemoteDevice(mac), data, add) { ok, m -> if (ok) done(true, m) else { cachedFail(); add("cached failed → rescan"); resolveFresh(ctx, adapter, prefs, data, add, done, m) } }.start(); return }
            catch (_: Exception) { cachedFail() }
        }
        resolveFresh(ctx, adapter, prefs, data, add, done, "")
    }

    private fun resolveFresh(ctx: Context, adapter: BluetoothAdapter, prefs: android.content.SharedPreferences, data: ByteArray, add: (String) -> Unit, done: (Boolean, String) -> Unit, prevErr: String) {
        val bonded = try { adapter.bondedDevices } catch (e: Exception) { null }
        add("bonded=" + (bonded?.joinToString { "${it.name}" } ?: "-"))
        bonded?.firstOrNull { NAME.containsMatchIn(it.name ?: "") }?.let { dev ->
            add("use bonded: ${dev.name} ${dev.address}")
            prefs.edit().putString(KEY_MAC, dev.address).apply()
            GattJob(ctx, dev, data, add) { ok, m -> done(ok, m) }.start(); return
        }
        add("scanning…")
        scanForPrinter(ctx, adapter, add) { dev ->
            if (dev == null) done(false, if (prevErr.isNotEmpty()) prevErr else "หาเครื่องพิมพ์ BLE ไม่เจอ (เปิดเครื่อง + อยู่ใกล้ + Bluetooth เปิด)")
            else { add("scan found: ${dev.name} ${dev.address}"); prefs.edit().putString(KEY_MAC, dev.address).apply(); GattJob(ctx, dev, data, add) { ok, m -> done(ok, m) }.start() }
        }
    }

    private fun scanForPrinter(ctx: Context, adapter: BluetoothAdapter, add: (String) -> Unit, cb: (BluetoothDevice?) -> Unit) {
        val scanner = adapter.bluetoothLeScanner ?: return cb(null)
        val handler = Handler(Looper.getMainLooper())
        var done = false
        val sc = object : ScanCallback() {
            override fun onScanResult(type: Int, r: ScanResult) {
                val name = (r.device.name ?: r.scanRecord?.deviceName ?: "")
                if (name.isNotBlank()) add("  saw: $name")
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
    private class GattJob(val ctx: Context, val device: BluetoothDevice, val data: ByteArray, val add: (String) -> Unit, val onResult: (Boolean, String) -> Unit) {
        private val handler = Handler(Looper.getMainLooper())
        private var gatt: BluetoothGatt? = null
        private var writeChar: BluetoothGattCharacteristic? = null
        private val chunks = ArrayDeque<ByteArray>()
        private var mtu = 20
        private var finished = false
        private var writeRetries = 0
        private var discovered = false
        private var retriedConn = false
        private val timeout = Runnable { finish(false, "timeout (ต่อไม่ทัน)") }

        fun start() { add("connect ${device.address}…"); handler.postDelayed(timeout, 22000); connect() }

        private fun connect() { gatt = device.connectGatt(ctx, false, cb, BluetoothDevice.TRANSPORT_LE) }

        // one-shot service discovery, guarded so MTU-callback and the fallback timer can't double-fire
        private fun startDiscover(g: BluetoothGatt) {
            if (finished || discovered) return
            discovered = true
            handler.postDelayed({ if (!finished) try { g.discoverServices() } catch (_: Exception) {} }, 200)
        }

        private fun finish(ok: Boolean, msg: String) {
            if (finished) return; finished = true
            handler.removeCallbacks(timeout)
            handler.post { try { gatt?.disconnect(); gatt?.close() } catch (_: Exception) {}; onResult(ok, msg) }
        }

        private val cb = object : BluetoothGattCallback() {
            override fun onConnectionStateChange(g: BluetoothGatt, status: Int, newState: Int) {
                add("conn state=$newState status=$status")
                if (newState == BluetoothProfile.STATE_CONNECTED) {
                    // settle, then negotiate MTU; if MTU never comes back, discover anyway
                    handler.postDelayed({ if (!finished && !g.requestMtu(247)) startDiscover(g) }, 300)
                    handler.postDelayed({ startDiscover(g) }, 1800)
                } else if (newState == BluetoothProfile.STATE_DISCONNECTED && !finished) {
                    // GATT 133 / early drop before we got anywhere → close and retry once
                    if (!discovered && !retriedConn) {
                        retriedConn = true
                        add("early drop → retry connect")
                        try { g.close() } catch (_: Exception) {}
                        handler.postDelayed({ if (!finished) connect() }, 600)
                    } else finish(false, "การเชื่อมต่อหลุด (status=$status)")
                }
            }
            override fun onMtuChanged(g: BluetoothGatt, m: Int, status: Int) { if (status == BluetoothGatt.GATT_SUCCESS) mtu = m; add("mtu=$mtu"); startDiscover(g) }
            override fun onServicesDiscovered(g: BluetoothGatt, status: Int) {
                add("services discovered status=$status:")
                var ch: BluetoothGattCharacteristic? = null
                for (s in g.services) {
                    add("  svc ${short(s.uuid)}")
                    for (c in s.characteristics) {
                        add("    chr ${short(c.uuid)} ${props(c.properties)}")
                        val p = c.properties
                        if (p and BluetoothGattCharacteristic.PROPERTY_WRITE != 0) { if (ch == null || ch!!.properties and BluetoothGattCharacteristic.PROPERTY_WRITE == 0) ch = c }
                        else if (p and BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE != 0 && ch == null) ch = c
                    }
                }
                if (ch == null) { finish(false, "ไม่พบช่องเขียนข้อมูล (ไม่มี characteristic ที่เขียนได้)"); return }
                writeChar = ch
                add("→ write to ${short(ch!!.uuid)}")
                @Suppress("DEPRECATION")
                ch!!.writeType = if (ch!!.properties and BluetoothGattCharacteristic.PROPERTY_WRITE != 0)
                    BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT else BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE
                val size = (mtu - 5).coerceIn(20, 500)
                var i = 0; while (i < data.size) { val e = minOf(i + size, data.size); chunks.add(data.copyOfRange(i, e)); i = e }
                add("chunks=${chunks.size} size=$size")
                // let the stack settle after service discovery before the first write
                handler.postDelayed({ writeNext(g) }, 150)
            }
            override fun onCharacteristicWrite(g: BluetoothGatt, c: BluetoothGattCharacteristic, status: Int) {
                if (writeChar?.writeType == BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT) {
                    if (status != BluetoothGatt.GATT_SUCCESS) finish(false, "เขียนข้อมูลผิดพลาด (status=$status)") else writeNext(g)
                }
            }
        }

        @Suppress("DEPRECATION")
        private fun writeNext(g: BluetoothGatt) {
            if (finished) return
            val next = chunks.peek() ?: run { add("all chunks sent"); handler.postDelayed({ finish(true, "พิมพ์แล้ว") }, 600); return }  // drain, then done
            val ch = writeChar!!
            ch.value = next
            if (g.writeCharacteristic(ch)) {
                writeRetries = 0
                chunks.poll()                                   // enqueued — remove from queue
                // WITH-response: wait for onCharacteristicWrite. NO-response: pace manually.
                if (ch.writeType == BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE) handler.postDelayed({ writeNext(g) }, 22)
            } else {
                // GATT queue still busy — back off and retry the SAME chunk instead of failing
                if (++writeRetries > 60) { finish(false, "ส่งข้อมูลไม่สำเร็จ (คิวไม่ว่าง)"); return }
                handler.postDelayed({ writeNext(g) }, 30)
            }
        }

        private fun short(u: java.util.UUID): String {
            val s = u.toString()
            return if (s.startsWith("0000") && s.endsWith("-0000-1000-8000-00805f9b34fb")) "0x" + s.substring(4, 8) else s
        }
        private fun props(p: Int): String {
            val sb = StringBuilder()
            if (p and BluetoothGattCharacteristic.PROPERTY_WRITE != 0) sb.append("W")
            if (p and BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE != 0) sb.append("w")
            if (p and BluetoothGattCharacteristic.PROPERTY_READ != 0) sb.append("R")
            if (p and BluetoothGattCharacteristic.PROPERTY_NOTIFY != 0) sb.append("N")
            if (p and BluetoothGattCharacteristic.PROPERTY_INDICATE != 0) sb.append("I")
            return "[$sb]"
        }
    }
}
