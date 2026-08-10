package com.labparfumo.pos

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Bundle
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.sunmi.peripheral.printer.InnerPrinterCallback
import com.sunmi.peripheral.printer.InnerPrinterManager
import com.sunmi.peripheral.printer.SunmiPrinterService

/**
 * Thin WebView wrapper around the Lab Parfumo web app. Its only extra job is to
 * expose window.SunmiBridge.printImage(base64) to the web so the receipt page can
 * print straight to the SUNMI built-in thermal printer.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var printer: SunmiPrinterService? = null

    // Printable width in dots for a 58mm head (SUNMI V2/V3 = 384). An 80mm head = 576.
    private val printWidth = 384

    private val printerCallback = object : InnerPrinterCallback() {
        override fun onConnected(service: SunmiPrinterService) {
            printer = service
            try { service.printerInit(null) } catch (_: Exception) {}
        }
        override fun onDisconnected() { printer = null }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // connect to the built-in printer service
        try { InnerPrinterManager.getInstance().bindService(this, printerCallback) }
        catch (e: Exception) { toast("เชื่อมต่อเครื่องพิมพ์ไม่ได้: ${e.message}") }

        // camera runtime permission (barcode scanner in the WebView)
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA), 1)
        }

        // let a computer inspect this WebView at chrome://inspect (diagnose JS errors)
        WebView.setWebContentsDebuggingEnabled(true)

        webView = WebView(this)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            useWideViewPort = true
            loadWithOverviewMode = true
            mediaPlaybackRequiresUserGesture = false
        }
        // camera (barcode scanner) permission inside the WebView
        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) { request.grant(request.resources) }
        }
        webView.webViewClient = WebViewClient()
        webView.addJavascriptInterface(Bridge(), "SunmiBridge")
        webView.loadUrl(BuildConfig.APP_URL)
    }

    /** Exposed to the web page as window.SunmiBridge.* */
    inner class Bridge {
        @JavascriptInterface
        fun isReady(): Boolean = printer != null

        @JavascriptInterface
        fun printImage(base64Png: String) {
            val service = printer
            if (service == null) {
                // try to (re)connect for next time, and let the user know
                try { InnerPrinterManager.getInstance().bindService(this@MainActivity, printerCallback) } catch (_: Exception) {}
                runOnUiThread { toast("ยังไม่พร้อมพิมพ์ — ลองอีกครั้ง") }
                return
            }
            try {
                val bytes = Base64.decode(base64Png, Base64.DEFAULT)
                var bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                    ?: run { runOnUiThread { toast("รูปสลิปไม่ถูกต้อง") }; return }
                if (bmp.width != printWidth) {
                    val h = (bmp.height.toFloat() * printWidth / bmp.width).toInt()
                    bmp = Bitmap.createScaledBitmap(bmp, printWidth, h, true)
                }
                service.printBitmap(bmp, null)
                service.lineWrap(3, null)
                try { service.cutPaper(null) } catch (_: Exception) { /* models without a cutter */ }
            } catch (e: Exception) {
                runOnUiThread { toast("พิมพ์ไม่สำเร็จ: ${e.message}") }
            }
        }
    }

    private fun toast(msg: String) = Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()

    override fun onDestroy() {
        try { InnerPrinterManager.getInstance().unBindService(this, printerCallback) } catch (_: Exception) {}
        super.onDestroy()
    }

    // let the hardware Back button navigate the web history instead of closing the app
    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (this::webView.isInitialized && webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }
}
