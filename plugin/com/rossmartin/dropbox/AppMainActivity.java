package com.rossmartin.dropbox;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import org.apache.cordova.*;
import android.util.Log;

public class AppMainActivity extends DroidGap
{
    private static final String TAG = "AppMainActivity";
    static final int REQUEST_LINK_TO_DBX = 1337;  // This value is up to you, must be the same as in your plugin though

    @Override
    public void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        // Set by <content src="index.html" /> in config.xml
        super.loadUrl(Config.getStartUrl());
        //super.loadUrl("file:///android_asset/www/index.html")
    }
	
    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQUEST_LINK_TO_DBX) {
            if (resultCode == Activity.RESULT_OK) {
                // ... You can now start using Dropbox Sync API.
                super.loadUrl("javascript:dropbox_linked();");
            } else {
                // ... Link failed or was cancelled by the user.
                Log.v(TAG, "Dropbox link failed or was cancelled by the user.");
            }
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }
}
