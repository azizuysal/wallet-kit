package com.azizuysal.walletkit

import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.annotations.ReactProp

class WalletButtonManager : SimpleViewManager<WalletButtonView>() {
  override fun getName(): String = NAME

  override fun createViewInstance(reactContext: ThemedReactContext): WalletButtonView =
    WalletButtonView(reactContext)

  @ReactProp(name = "addPassButtonStyle")
  fun setButtonStyle(view: WalletButtonView, style: Int) = view.applyStyle(style)

  override fun addEventEmitters(reactContext: ThemedReactContext, view: WalletButtonView) {
    view.installPressHandler {
      UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)?.dispatchEvent(
        WalletButtonPressEvent(UIManagerHelper.getSurfaceId(view), view.id),
      )
    }
  }

  override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any> =
    mapOf(
      "topPress" to mapOf(
        "phasedRegistrationNames" to mapOf("bubbled" to "onPress"),
      ),
    )

  private companion object {
    const val NAME = "WalletButton"
  }
}
