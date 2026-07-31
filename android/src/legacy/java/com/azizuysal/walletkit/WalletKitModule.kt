package com.azizuysal.walletkit

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray

class WalletKitModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  private val host = WalletKitModuleHost(reactContext)

  override fun getName(): String = NAME

  @ReactMethod
  fun canAddPasses(promise: Promise) = host.canAddPasses(promise)

  @ReactMethod
  fun addPass(passData: String?, promise: Promise) = host.addPass(passData, promise)

  @ReactMethod
  fun addPasses(passDataArray: ReadableArray?, promise: Promise) =
    host.addPasses(passDataArray, promise)

  @ReactMethod
  fun addListener(eventName: String?) = host.addListener(eventName)

  @ReactMethod
  fun removeListeners(count: Double) = host.removeListeners(count)

  override fun invalidate() {
    host.invalidate()
    super.invalidate()
  }

  private companion object {
    const val NAME = "WalletKit"
  }
}
