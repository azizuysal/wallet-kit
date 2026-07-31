package com.azizuysal.walletkit

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray

class WalletKitModule(reactContext: ReactApplicationContext) : NativeWalletKitSpec(reactContext) {
  private val host = WalletKitModuleHost(reactContext)

  override fun canAddPasses(promise: Promise) = host.canAddPasses(promise)

  override fun addPass(passData: String, promise: Promise) = host.addPass(passData, promise)

  override fun addPasses(passDataArray: ReadableArray, promise: Promise) =
    host.addPasses(passDataArray, promise)

  override fun addListener(eventName: String) = host.addListener(eventName)

  override fun removeListeners(count: Double) = host.removeListeners(count)

  override fun invalidate() {
    host.invalidate()
    super.invalidate()
  }
}
