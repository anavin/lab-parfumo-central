package com.labparfumo.pos

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import java.util.UUID

/**
 * Prints ESC/POS bytes to a Bluetooth **Classic (SPP / RFCOMM)** thermal printer.
 * This is the right transport for printers that pair with a PIN (e.g. MP210, PIN 0000) —
 * they speak Serial Port Profile, not BLE GATT. The printer must be paired once in the
 * Android Bluetooth settings; after that we connect to the bonded device by name.
 */
@SuppressLint("MissingPermission")
object SppPrinter {
    private val SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    // printer-ish bonded names — MP210 and common portable thermal printers
    private val NAME = Regex("(mp\\d|mpt|print|pos|thermal|rpp|goojprt|kprint|58|80|tp\\d|bt.?power)", RegexOption.IGNORE_CASE)

    /** @return true if a paired classic printer exists (so the caller can decide to fall back to BLE). */
    fun hasPairedPrinter(ctx: Context): Boolean = findPrinter(ctx) != null

    private fun findPrinter(ctx: Context): BluetoothDevice? {
        val adapter = (ctx.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager)?.adapter ?: return null
        val bonded = try { adapter.bondedDevices } catch (e: Exception) { return null } ?: return null
        // prefer a name match; if exactly one device is paired, just use it
        return bonded.firstOrNull { NAME.containsMatchIn(it.name ?: "") }
            ?: bonded.singleOrNull()
    }

    fun print(ctx: Context, data: ByteArray, onResult: (Boolean, String) -> Unit) {
        val log = StringBuilder()
        val add: (String) -> Unit = { log.append(it).append('\n') }
        val done: (Boolean, String) -> Unit = { ok, msg -> add(if (ok) "✓ $msg" else "✗ $msg"); onResult(ok, log.toString().trim()) }

        val adapter = (ctx.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager)?.adapter
            ?: return done(false, "อุปกรณ์ไม่มี Bluetooth")
        if (!adapter.isEnabled) return done(false, "กรุณาเปิด Bluetooth")

        val dev = findPrinter(ctx)
            ?: return done(false, "ยังไม่ได้จับคู่เครื่องพิมพ์\nไปที่ ตั้งค่า > Bluetooth แล้วจับคู่ MP210 (PIN 0000) ก่อน")
        add("SPP → ${dev.name} ${dev.address}")

        Thread {
            var socket: BluetoothSocket? = null
            try {
                try { adapter.cancelDiscovery() } catch (_: Exception) {}
                socket = dev.createRfcommSocketToServiceRecord(SPP_UUID)
                try {
                    socket.connect()
                } catch (e: Exception) {
                    // some printers need the reflection fallback (insecure / fixed channel 1)
                    add("secure connect failed (${e.message}); trying fallback")
                    try { socket?.close() } catch (_: Exception) {}
                    socket = try {
                        val m = dev.javaClass.getMethod("createRfcommSocket", Int::class.javaPrimitiveType)
                        (m.invoke(dev, 1) as BluetoothSocket).also { it.connect() }
                    } catch (e2: Exception) {
                        return@Thread done(false, "ต่อเครื่องพิมพ์ไม่ได้: ${e2.message}")
                    }
                }
                add("connected; sending ${data.size} bytes")
                val out = socket!!.outputStream
                // stream in modest chunks so the printer buffer doesn't overflow
                var i = 0
                while (i < data.size) {
                    val e = minOf(i + 1024, data.size)
                    out.write(data, i, e - i)
                    out.flush()
                    i = e
                    try { Thread.sleep(20) } catch (_: Exception) {}
                }
                out.flush()
                try { Thread.sleep(400) } catch (_: Exception) {}   // let the head finish before we close
                done(true, "พิมพ์แล้ว")
            } catch (e: Exception) {
                done(false, "พิมพ์ผิดพลาด: ${e.message}")
            } finally {
                try { socket?.close() } catch (_: Exception) {}
            }
        }.start()
    }
}
