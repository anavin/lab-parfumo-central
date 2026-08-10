package com.labparfumo.pos

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import java.util.concurrent.Executors

/**
 * Native camera barcode scanner (CameraX + bundled ML Kit) — for devices whose
 * WebView can't reach the camera via getUserMedia (e.g. SUNMI V3). Returns the
 * first decoded code to the caller via setResult(extra "code").
 */
class ScannerActivity : AppCompatActivity() {
    private val exec = Executors.newSingleThreadExecutor()
    @Volatile private var done = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_scanner)
        findViewById<android.view.View>(R.id.scan_close).setOnClickListener { finish() }
        val previewView = findViewById<PreviewView>(R.id.scan_preview)

        val opts = BarcodeScannerOptions.Builder()
            .setBarcodeFormats(
                Barcode.FORMAT_EAN_13, Barcode.FORMAT_EAN_8,
                Barcode.FORMAT_UPC_A, Barcode.FORMAT_UPC_E, Barcode.FORMAT_CODE_128,
            ).build()
        val scanner = BarcodeScanning.getClient(opts)

        val future = ProcessCameraProvider.getInstance(this)
        future.addListener({
            try {
                val provider = future.get()
                val preview = Preview.Builder().build()
                    .also { it.setSurfaceProvider(previewView.surfaceProvider) }
                val analysis = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST).build()
                analysis.setAnalyzer(exec) { proxy ->
                    val media = proxy.image
                    if (media == null || done) { proxy.close(); return@setAnalyzer }
                    val img = InputImage.fromMediaImage(media, proxy.imageInfo.rotationDegrees)
                    scanner.process(img)
                        .addOnSuccessListener { list ->
                            val code = list.firstOrNull { !it.rawValue.isNullOrBlank() }?.rawValue
                            if (!code.isNullOrBlank() && !done) { done = true; returnCode(code) }
                        }
                        .addOnCompleteListener { proxy.close() }
                }
                provider.unbindAll()
                // most devices use the back camera; fall back to front (some SUNMI units)
                val selector = try {
                    if (provider.hasCamera(CameraSelector.DEFAULT_BACK_CAMERA)) CameraSelector.DEFAULT_BACK_CAMERA
                    else CameraSelector.DEFAULT_FRONT_CAMERA
                } catch (e: Exception) { CameraSelector.DEFAULT_BACK_CAMERA }
                provider.bindToLifecycle(this, selector, preview, analysis)
            } catch (e: Exception) {
                Toast.makeText(this, "เปิดกล้องไม่ได้: ${e.message}", Toast.LENGTH_LONG).show()
                finish()
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun returnCode(code: String) = runOnUiThread {
        setResult(RESULT_OK, Intent().putExtra("code", code))
        finish()
    }

    override fun onDestroy() { super.onDestroy(); exec.shutdown() }
}
