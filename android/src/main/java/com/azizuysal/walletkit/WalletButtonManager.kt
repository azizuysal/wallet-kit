package com.azizuysal.walletkit

import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.widget.Button
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class WalletButtonManager : SimpleViewManager<Button>() {
  
  override fun getName(): String {
    return "WalletButton"
  }

  override fun createViewInstance(reactContext: ThemedReactContext): Button {
    val button = Button(reactContext)
    
    // Set default text - Google Wallet branding guidelines
    button.text = "Add to Google Wallet"
    button.isAllCaps = false
    
    // Set default padding
    val paddingHorizontal = dpToPx(24f, reactContext).toInt()
    val paddingVertical = dpToPx(12f, reactContext).toInt()
    button.setPadding(paddingHorizontal, paddingVertical, paddingHorizontal, paddingVertical)
    
    // Set text size
    button.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
    
    // Apply default dark style
    applyButtonStyle(button, 0)
    
    return button
  }

  @ReactProp(name = "addPassButtonStyle")
  fun setButtonStyle(view: Button, style: Int) {
    applyButtonStyle(view, style)
  }
  
  private fun applyButtonStyle(button: Button, style: Int) {
    val drawable = GradientDrawable()
    drawable.cornerRadius = dpToPx(4f, button.context)
    
    when (style) {
      0 -> { // dark (primary)
        drawable.setColor(Color.BLACK)
        button.setTextColor(Color.WHITE)
        button.background = drawable
      }
      1 -> { // light (secondary)
        drawable.setColor(Color.WHITE)
        drawable.setStroke(dpToPx(1f, button.context).toInt(), Color.parseColor("#DADCE0"))
        button.setTextColor(Color.parseColor("#3C4043"))
        button.background = drawable
      }
      2 -> { // outline
        drawable.setColor(Color.TRANSPARENT)
        drawable.setStroke(dpToPx(1f, button.context).toInt(), Color.parseColor("#DADCE0"))
        button.setTextColor(Color.parseColor("#3C4043"))
        button.background = drawable
      }
      else -> {
        // Default to dark
        drawable.setColor(Color.BLACK)
        button.setTextColor(Color.WHITE)
        button.background = drawable
      }
    }
    
    // Set gravity to center
    button.gravity = Gravity.CENTER
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
  
  override fun addEventEmitters(reactContext: ThemedReactContext, view: Button) {
    view.setOnClickListener {
      reactContext.getJSModule(com.facebook.react.uimanager.events.RCTEventEmitter::class.java)
        .receiveEvent(view.id, "topPress", null)
    }
  }
  
  private fun dpToPx(dp: Float, context: android.content.Context): Float {
    return TypedValue.applyDimension(
      TypedValue.COMPLEX_UNIT_DIP,
      dp,
      context.resources.displayMetrics
    )
  }
}