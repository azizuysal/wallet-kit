package com.azizuysal.walletkit

import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper

internal object WalletButtonEventDispatcher {
  fun dispatch(reactContext: ThemedReactContext, view: WalletButtonView) {
    UIManagerHelper.getEventDispatcher(reactContext)?.dispatchEvent(
      WalletButtonPressEvent(UIManagerHelper.getSurfaceId(view), view.id),
    )
  }
}
