package com.labparfumo.pos

import android.graphics.Bitmap
import java.io.ByteArrayOutputStream

/** Convert a (already black-and-white) bitmap to ESC/POS raster bytes (GS v 0),
 *  ready to stream to any generic ESC/POS thermal printer. Width must be a
 *  multiple of 8 dots (58mm head = 384). */
fun escposRaster(bmp: Bitmap): ByteArray {
    val w = bmp.width
    val h = bmp.height
    val bytesPerRow = (w + 7) / 8
    val out = ByteArrayOutputStream()

    out.write(byteArrayOf(0x1B, 0x40))                       // ESC @  — init
    out.write(byteArrayOf(0x1B, 0x61, 0x00))                // ESC a 0 — align left

    // print raster bit image:  GS v 0  m=0  xL xH yL yH
    out.write(byteArrayOf(0x1D, 0x76, 0x30, 0x00))
    out.write(byteArrayOf((bytesPerRow and 0xFF).toByte(), ((bytesPerRow shr 8) and 0xFF).toByte(),
        (h and 0xFF).toByte(), ((h shr 8) and 0xFF).toByte()))

    val px = IntArray(w * h)
    bmp.getPixels(px, 0, w, 0, 0, w, h)
    val row = ByteArray(bytesPerRow)
    for (y in 0 until h) {
        row.fill(0)
        val base = y * w
        for (x in 0 until w) {
            val c = px[base + x]
            val a = (c ushr 24) and 0xFF
            val lum = if (a < 128) 255 else {
                val r = (c shr 16) and 0xFF; val g = (c shr 8) and 0xFF; val b = c and 0xFF
                (r * 77 + g * 150 + b * 29) shr 8
            }
            if (lum < 128) row[x / 8] = (row[x / 8].toInt() or (0x80 shr (x % 8))).toByte()  // black dot
        }
        out.write(row)
    }

    out.write(byteArrayOf(0x1B, 0x64, 0x04))                // ESC d 4 — feed 4 lines
    return out.toByteArray()
}
