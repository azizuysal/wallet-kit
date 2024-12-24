package com.azizuysal.walletkit

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class WalletKitModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var listenerCount = 0

  override fun getName(): String {
    return NAME
  }

  companion object {
    const val NAME = "WalletKit"
    private const val ERR_WALLET_NOT_IMPLEMENTED = "ERR_WALLET_NOT_IMPLEMENTED"
  }

  @ReactMethod
  fun canAddPasses(promise: Promise) {
    promise.reject(ERR_WALLET_NOT_IMPLEMENTED, "Not Implemented")
  }

  @ReactMethod
  fun addPass(passData: String?, promise: Promise) {
    promise.reject(ERR_WALLET_NOT_IMPLEMENTED, "Not Implemented")
  }

  @ReactMethod
  fun addPasses(passDataArray: ReadableArray?, promise: Promise) {
    promise.reject(ERR_WALLET_NOT_IMPLEMENTED, "Not Implemented")
  }

  @ReactMethod
  fun addListener(eventName: String?) {
    listenerCount += 1
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    listenerCount -= count
  }

  private fun sendEvent(
    reactContext: ReactContext,
    eventName: String,
    params: WritableMap?
  ) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }
}
