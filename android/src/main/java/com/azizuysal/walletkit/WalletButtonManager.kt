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
    // Inflate the official Google Wallet button layout
    val inflater = LayoutInflater.from(reactContext)
    
    // Use the R class directly to ensure proper resource resolution including localization
    val button = try {
      inflater.inflate(R.layout.add_to_googlewallet_button, null) as RelativeLayout
    } catch (e: Exception) {
      // Fallback: Try to find the resource dynamically
      val resourceId = reactContext.resources.getIdentifier(
        "add_to_googlewallet_button",
        "layout",
        reactContext.packageName
      )
      
      if (resourceId != 0) {
        inflater.inflate(resourceId, null) as RelativeLayout
      } else {
        // Final fallback to a simple RelativeLayout if resources not found
        RelativeLayout(reactContext)
      }
    }
    
    // Apply default style
    applyButtonStyle(button, 0)
    
    return button
  }

  @ReactProp(name = "addPassButtonStyle")
  fun setButtonStyle(view: RelativeLayout, style: Int) {
    applyButtonStyle(view, style)
  }
  
  private fun applyButtonStyle(button: RelativeLayout, style: Int) {
    // The Google Wallet button assets handle their own styling
    // We can adjust the button appearance based on the style parameter if needed
    when (style) {
      0 -> { // dark (primary) - default style
        // The default assets are already dark themed
      }
      1 -> { // light (secondary)
        // Could potentially swap to light themed assets if available
        // For now, keep the default
      }
      2 -> { // outline
        // Could potentially swap to outline style assets if available
        // For now, keep the default
      }
    }
    
    // Ensure the button has the correct layout params
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
    
    // Make the button focusable and clickable
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