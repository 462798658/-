package com.xuexi.checkin;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView.setWebContentsDebuggingEnabled(true);
        Log.i("StudyCheckin", "=== App onCreate ===");
        Log.i("StudyCheckin", "=== Android SDK: " + android.os.Build.VERSION.SDK_INT +
            " Model: " + android.os.Build.MODEL);
    }
}
