package com.azizuysal.walletkit

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WalletKitModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return NAME
  }

  companion object {
    const val NAME = "WalletKit"
  }

  @ReactMethod
  fun canAddPasses(promise: Promise) {
    promise.reject("Not Implemented")
  }

  @ReactMethod
  fun addPass(passData: String?, promise: Promise) {
    promise.reject("Not Implemented")
  }

  @ReactMethod
  fun addPasses(passDataArray: ReadableArray?, promise: Promise) {
    promise.reject("Not Implemented")
  }

  @ReactMethod
  fun addListener(eventName: String?) {
    listenerCount += 1
  }

  @ReactMethod
  fun removeListeners(count: Integer) {
    listenerCount -= count
  }

  private fun sendEvent(
    reactContext: ReactContext,
    eventName: String,
    @Nullable params: WritableMap
  ) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }
}
