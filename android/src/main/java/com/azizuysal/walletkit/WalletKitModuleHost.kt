package com.azizuysal.walletkit

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.pay.Pay

internal class WalletKitModuleHost(private val reactContext: ReactApplicationContext) :
  LifecycleEventListener {
  private val core = WalletKitCore(
    currentActivity = { reactContext.currentActivity?.let(::AndroidWalletActivity) },
    payClient = GoogleWalletPayClient(Pay.getClient(reactContext)),
    emitCompletion = { success -> sendEvent(reactContext, ADD_PASS_COMPLETED, success) },
  )

  private val activityEventListener = object : BaseActivityEventListener() {
    override fun onActivityResult(
      activity: Activity,
      requestCode: Int,
      resultCode: Int,
      data: Intent?,
    ) {
      core.handleActivityResult(requestCode, resultCode)
    }
  }

  init {
    reactContext.addActivityEventListener(activityEventListener)
    reactContext.addLifecycleEventListener(this)
  }

  fun canAddPasses(promise: Promise) = core.canAddPasses(promise.asWalletPromise())

  fun addPass(passData: String?, promise: Promise) =
    core.addPass(passData, promise.asWalletPromise())

  fun addPasses(passDataArray: ReadableArray?, promise: Promise) {
    val values = passDataArray?.let { array ->
      List(array.size()) { index ->
        if (array.isNull(index)) null else array.getString(index)
      }
    }
    core.addPasses(values, promise.asWalletPromise())
  }

  fun addListener(eventName: String?) {
    if (eventName == ADD_PASS_COMPLETED) {
      core.addListener()
    }
  }

  fun removeListeners(count: Double) = core.removeListeners(count)

  override fun onHostResume() = Unit

  override fun onHostPause() = Unit

  override fun onHostDestroy() {
    core.destroy("Host activity was destroyed before the Google Wallet result was received")
  }

  fun invalidate() {
    core.destroy("WalletKit module was invalidated before the Google Wallet result was received")
    reactContext.removeActivityEventListener(activityEventListener)
    reactContext.removeLifecycleEventListener(this)
  }

  private fun Promise.asWalletPromise(): WalletPromise = object : WalletPromise {
    override fun resolve(value: Boolean) {
      this@asWalletPromise.resolve(value)
    }

    override fun reject(code: String, message: String, error: Throwable?) {
      if (error == null) {
        this@asWalletPromise.reject(code, message)
      } else {
        this@asWalletPromise.reject(code, message, error)
      }
    }
  }

  private fun sendEvent(reactContext: ReactContext, eventName: String, value: Boolean) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, value)
  }

  private companion object {
    const val ADD_PASS_COMPLETED = "AddPassCompleted"
  }
}
