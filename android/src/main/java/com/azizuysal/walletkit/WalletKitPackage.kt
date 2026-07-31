package com.azizuysal.walletkit

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

class WalletKitPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == MODULE_NAME) WalletKitModule(reactContext) else null

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return listOf(WalletButtonManager())
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
      MODULE_NAME to ReactModuleInfo(
        MODULE_NAME,
        WalletKitModule::class.java.name,
        false,
        false,
        false,
        ReactModuleInfo.classIsTurboModule(WalletKitModule::class.java),
      ),
    )
  }

  private companion object {
    const val MODULE_NAME = "WalletKit"
  }
}
