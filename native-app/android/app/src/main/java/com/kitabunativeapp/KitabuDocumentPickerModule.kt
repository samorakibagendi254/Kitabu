package com.kitabunativeapp

import android.app.Activity
import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class KitabuDocumentPickerModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var pickerPromise: Promise? = null
  private val requestCode = 4421

  private val activityEventListener: ActivityEventListener =
    object : BaseActivityEventListener() {
      override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?,
      ) {
        if (requestCode != this@KitabuDocumentPickerModule.requestCode) {
          return
        }

        val promise = pickerPromise ?: return
        pickerPromise = null

        if (resultCode != Activity.RESULT_OK || data?.data == null) {
          promise.reject("picker_cancelled", "No PDF was selected.")
          return
        }

        val uri: Uri = data.data ?: run {
          promise.reject("picker_error", "Missing PDF URI.")
          return
        }

        try {
          activity.contentResolver.takePersistableUriPermission(
            uri,
            Intent.FLAG_GRANT_READ_URI_PERMISSION,
          )
        } catch (_: SecurityException) {
        }

        val result = Arguments.createMap().apply {
          putString("uri", uri.toString())
          putString("name", uri.lastPathSegment ?: "selected.pdf")
        }

        promise.resolve(result)
      }
    }

  init {
    reactContext.addActivityEventListener(activityEventListener)
  }

  override fun getName(): String = "KitabuDocumentPicker"

  @ReactMethod
  fun pickPdf(promise: Promise) {
    if (reactApplicationContext.currentActivity == null) {
      promise.reject("picker_unavailable", "Current activity is not available.")
      return
    }

    pickerPromise = promise

    val intent =
      Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
        addCategory(Intent.CATEGORY_OPENABLE)
        type = "application/pdf"
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)
      }

    val didStart = reactApplicationContext.startActivityForResult(intent, requestCode, null)
    if (!didStart) {
      pickerPromise = null
      promise.reject("picker_unavailable", "Could not launch the Android document picker.")
    }
  }

  @ReactMethod
  fun getStatus(promise: Promise) {
    promise.resolve("android_native")
  }
}
