package com.kitabunativeapp

import android.speech.tts.TextToSpeech
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.Locale

class KitabuSpeechModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), TextToSpeech.OnInitListener {

  private var textToSpeech: TextToSpeech? = null
  private var isReady = false

  override fun getName(): String = "KitabuSpeech"

  override fun initialize() {
    super.initialize()
    if (textToSpeech == null) {
      textToSpeech = TextToSpeech(reactContext, this)
    }
  }

  override fun onInit(status: Int) {
    isReady = status == TextToSpeech.SUCCESS
    if (isReady) {
      textToSpeech?.language = Locale.US
    }
  }

  @ReactMethod
  fun speak(text: String, promise: Promise) {
    if (!isReady || textToSpeech == null) {
      promise.reject("speech_not_ready", "Text to speech engine is not ready.")
      return
    }

    textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "kitabu-reader")
    promise.resolve(true)
  }

  @ReactMethod
  fun stop(promise: Promise) {
    textToSpeech?.stop()
    promise.resolve(true)
  }

  @ReactMethod
  fun getStatus(promise: Promise) {
    promise.resolve(if (isReady) "android_native" else "simulated")
  }

  override fun invalidate() {
    textToSpeech?.stop()
    textToSpeech?.shutdown()
    textToSpeech = null
    isReady = false
    super.invalidate()
  }
}
