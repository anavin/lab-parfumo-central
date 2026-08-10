# Keep the SUNMI printer SDK
-keep class com.sunmi.peripheral.printer.** { *; }
-keep class woyou.aidlservice.jiuiv5.** { *; }
# Keep the JS bridge exposed to the WebView
-keepclassmembers class com.labparfumo.pos.MainActivity$Bridge {
    @android.webkit.JavascriptInterface <methods>;
}
