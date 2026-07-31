package com.azizuysal.walletkit

import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.WalletButtonManagerDelegate
import com.facebook.react.viewmanagers.WalletButtonManagerInterface

class WalletButtonManager : SimpleViewManager<WalletButtonView>(),
  WalletButtonManagerInterface<WalletButtonView> {
  private val delegate: ViewManagerDelegate<WalletButtonView> = WalletButtonManagerDelegate(this)

  override fun getName(): String = NAME

  override fun getDelegate(): ViewManagerDelegate<WalletButtonView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext): WalletButtonView =
    WalletButtonView(reactContext)

  override fun setAddPassButtonStyle(view: WalletButtonView, value: Int) = view.applyStyle(value)

  override fun addEventEmitters(reactContext: ThemedReactContext, view: WalletButtonView) {
    view.installPressHandler {
      UIManagerHelper.getEventDispatcher(reactContext)?.dispatchEvent(
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
