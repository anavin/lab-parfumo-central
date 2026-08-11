package com.labparfumo.pos

import android.Manifest
import android.annotation.SuppressLint
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import org.json.JSONObject
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

    // <input type=file capture> support — lets the "ถ่ายรูป" scanner open the camera app
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private lateinit var fileChooser: ActivityResultLauncher<Intent>

    // native barcode scanner (for WebViews that can't reach the camera, e.g. SUNMI V3)
    private lateinit var scanLauncher: ActivityResultLauncher<Intent>

    // built-in SUNMI laser scan engine (SS1104) in Broadcast output mode → the code
    // arrives here; we inject it into the web as a 'sunmi-hw-scan' event.
    private val scanReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val code = intent?.getStringExtra("data")
                ?: intent?.getStringExtra("code")
                ?: intent?.getStringExtra("barcode")
                ?: intent?.getStringExtra("SCAN_BARCODE1")
                ?: return
            if (code.isBlank()) return
            val js = "window.dispatchEvent(new CustomEvent('sunmi-hw-scan',{detail:" + JSONObject.quote(code) + "}))"
            runOnUiThread { if (::webView.isInitialized) webView.evaluateJavascript(js, null) }
        }
    }

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

        // connect to the built-in printer service (SUNMI only; silent on phones without it)
        try { InnerPrinterManager.getInstance().bindService(this, printerCallback) }
        catch (e: Exception) { /* no SUNMI printer on this device — ignore */ }

        // runtime permissions: camera (barcode) + Bluetooth (BLE printer on Android 12+)
        val needPerms = mutableListOf<String>()
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) needPerms.add(Manifest.permission.CAMERA)
        if (android.os.Build.VERSION.SDK_INT >= 31) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) needPerms.add(Manifest.permission.BLUETOOTH_CONNECT)
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN) != PackageManager.PERMISSION_GRANTED) needPerms.add(Manifest.permission.BLUETOOTH_SCAN)
        }
        if (needPerms.isNotEmpty()) ActivityCompat.requestPermissions(this, needPerms.toTypedArray(), 1)

        // let a computer inspect this WebView at chrome://inspect (diagnose JS errors)
        WebView.setWebContentsDebuggingEnabled(true)

        // receives the photo picked by the camera app for <input type=file capture>
        fileChooser = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            val cb = filePathCallback
            filePathCallback = null
            cb?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data))
        }

        // receives a scanned code from the native scanner → hand it to the web page
        scanLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            if (result.resultCode == RESULT_OK) {
                val code = result.data?.getStringExtra("code")
                if (!code.isNullOrBlank()) {
                    val js = "window.dispatchEvent(new CustomEvent('sunmi-scan',{detail:" + JSONObject.quote(code) + "}))"
                    webView.evaluateJavascript(js, null)
                }
            }
        }

        setContentView(R.layout.activity_main)
        webView = findViewById(R.id.webview)
        val splash = findViewById<android.view.View>(R.id.splash)

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
            override fun onShowFileChooser(view: WebView?, callback: ValueCallback<Array<Uri>>?, params: FileChooserParams?): Boolean {
                filePathCallback?.onReceiveValue(null)
                filePathCallback = callback
                return try { fileChooser.launch(params?.createIntent()); true }
                catch (e: Exception) { filePathCallback = null; false }
            }
        }
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) { splash.visibility = android.view.View.GONE }
        }
        webView.addJavascriptInterface(Bridge(), "SunmiBridge")
        webView.loadUrl(BuildConfig.APP_URL)

        // listen for the SUNMI scan engine's broadcast (its default output mode)
        val filter = IntentFilter("com.sunmi.scanner.ACTION_DATA_CODE_RECEIVED")
        ContextCompat.registerReceiver(this, scanReceiver, filter, ContextCompat.RECEIVER_EXPORTED)
    }

    /** Exposed to the web page as window.SunmiBridge.* */
    inner class Bridge {
        @JavascriptInterface
        fun isReady(): Boolean = printer != null

        /** True on SUNMI hardware — the WebView camera doesn't work there, but a
         *  built-in laser scan engine does, so the web should skip the camera popup
         *  and just let laser broadcasts feed the bill continuously. */
        @JavascriptInterface
        fun hasScanEngine(): Boolean = android.os.Build.MANUFACTURER.equals("SUNMI", ignoreCase = true)

        /** Open the native barcode scanner; the result comes back via a
         *  'sunmi-scan' window event carrying the decoded code. */
        @JavascriptInterface
        fun scanBarcode() {
            runOnUiThread {
                try { scanLauncher.launch(Intent(this@MainActivity, ScannerActivity::class.java)) } catch (_: Exception) {}
            }
        }

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

        /** Print the receipt image to a Bluetooth ESC/POS printer (paired externally).
         *  Classic SPP (e.g. MP210, pairs with a PIN) is tried first; if no classic
         *  printer is paired, we fall back to a BLE-GATT printer. */
        @JavascriptInterface
        fun printBluetooth(base64Png: String) {
            Thread {
                try {
                    val bytes = Base64.decode(base64Png, Base64.DEFAULT)
                    var bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                        ?: run { runOnUiThread { toast("รูปสลิปไม่ถูกต้อง") }; return@Thread }
                    if (bmp.width != printWidth) {
                        val h = (bmp.height.toFloat() * printWidth / bmp.width).toInt()
                        bmp = Bitmap.createScaledBitmap(bmp, printWidth, h, true)
                    }
                    val escpos = escposRaster(bmp)
                    runOnUiThread { toast("กำลังส่งไปเครื่องพิมพ์…") }
                    val result = { ok: Boolean, log: String ->
                        runOnUiThread {
                            if (ok) toast("พิมพ์แล้ว ✓")
                            else showLog("พิมพ์บลูทูธไม่สำเร็จ", log)   // screenshot-able diagnostics
                        }
                    }
                    // classic SPP printer paired? use it. otherwise BLE.
                    if (SppPrinter.hasPairedPrinter(this@MainActivity)) SppPrinter.print(this@MainActivity, escpos, result)
                    else BlePrinter.print(this@MainActivity, escpos, result)
                } catch (e: Exception) { runOnUiThread { toast("ผิดพลาด: ${e.message}") } }
            }.start()
        }
    }

    /** Show a long diagnostic message in a dismissable dialog the user can screenshot. */
    private fun showLog(title: String, body: String) {
        try {
            androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle(title)
                .setMessage(body)
                .setPositiveButton("ปิด", null)
                .show()
        } catch (e: Exception) { toast("$title: $body") }
    }

    private fun toast(msg: String) = Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()

    override fun onDestroy() {
        try { InnerPrinterManager.getInstance().unBindService(this, printerCallback) } catch (_: Exception) {}
        try { unregisterReceiver(scanReceiver) } catch (_: Exception) {}
        super.onDestroy()
    }

    // let the hardware Back button navigate the web history instead of closing the app
    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (this::webView.isInitialized && webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }
}
