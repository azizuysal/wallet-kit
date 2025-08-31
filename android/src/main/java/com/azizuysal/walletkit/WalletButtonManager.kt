package com.azizuysal.walletkit

import android.view.LayoutInflater
import android.view.View
import android.widget.RelativeLayout
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class WalletButtonManager : SimpleViewManager<RelativeLayout>() {
  
  override fun getName(): String {
    return "WalletButton"
  }

  override fun createViewInstance(reactContext: ThemedReactContext): RelativeLayout {
    val inflater = LayoutInflater.from(reactContext)
    
    val button = try {
      inflater.inflate(R.layout.add_to_googlewallet_button, null) as RelativeLayout
    } catch (e: Exception) {
      val resourceId = reactContext.resources.getIdentifier(
        "add_to_googlewallet_button",
        "layout",
        reactContext.packageName
      )
      
      if (resourceId != 0) {
        inflater.inflate(resourceId, null) as RelativeLayout
      } else {
        RelativeLayout(reactContext)
      }
    }
    
    applyButtonStyle(button, 0)
    
    return button
  }

  @ReactProp(name = "addPassButtonStyle")
  fun setButtonStyle(view: RelativeLayout, style: Int) {
    applyButtonStyle(view, style)
  }
  
  private fun applyButtonStyle(button: RelativeLayout, style: Int) {
    when (style) {
      0 -> {}
      1 -> {}
      2 -> {}
    }
    
    if (button.layoutParams == null) {
      button.layoutParams = RelativeLayout.LayoutParams(
        RelativeLayout.LayoutParams.MATCH_PARENT,
        dpToPx(48f, button.context).toInt()
      )
    }
  }

  override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any> {
    return MapBuilder.builder<String, Any>()
      .put(
        "topPress",
        MapBuilder.of(
          "phasedRegistrationNames",
          MapBuilder.of("bubbled", "onPress")
        )
      )
      .build()
  }
  
  override fun addEventEmitters(reactContext: ThemedReactContext, view: RelativeLayout) {
    view.setOnClickListener {
      reactContext.getJSModule(com.facebook.react.uimanager.events.RCTEventEmitter::class.java)
        .receiveEvent(view.id, "topPress", null)
    }
    
    view.isClickable = true
    view.isFocusable = true
  }
  
  private fun dpToPx(dp: Float, context: android.content.Context): Float {
    return android.util.TypedValue.applyDimension(
      android.util.TypedValue.COMPLEX_UNIT_DIP,
      dp,
      context.resources.displayMetrics
    )
  }
}