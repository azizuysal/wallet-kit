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
    val container = RelativeLayout(reactContext)
    val inflater = LayoutInflater.from(reactContext)
    val standardButton = try {
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
    
    val badgeButton = try {
      inflater.inflate(R.layout.add_to_googlewallet_badge, null) as RelativeLayout
    } catch (e: Exception) {
      val resourceId = reactContext.resources.getIdentifier(
        "add_to_googlewallet_badge",
        "layout",
        reactContext.packageName
      )
      
      if (resourceId != 0) {
        inflater.inflate(resourceId, null) as RelativeLayout
      } else {
        null
      }
    }
    
    standardButton.tag = "standard"
    container.addView(standardButton)
    
    if (badgeButton != null) {
      badgeButton.tag = "badge"
      badgeButton.visibility = View.GONE
      container.addView(badgeButton)
    }
    
    container.tag = 0
    applyButtonStyle(container, 0)
    
    return container
  }

  @ReactProp(name = "addPassButtonStyle")
  fun setButtonStyle(view: RelativeLayout, style: Int) {
    view.tag = style
    applyButtonStyle(view, style)
    
    ensureClickListeners(view)
  }
  
  private fun applyButtonStyle(container: RelativeLayout, style: Int) {
    val standardButton = container.findViewWithTag<View>("standard")
    val badgeButton = container.findViewWithTag<View>("badge")
    
    when (style) {
      0 -> {
        standardButton?.visibility = View.VISIBLE
        badgeButton?.visibility = View.GONE
        
        if (container.layoutParams == null) {
          container.layoutParams = RelativeLayout.LayoutParams(
            RelativeLayout.LayoutParams.MATCH_PARENT,
            dpToPx(48f, container.context).toInt()
          )
        } else {
          container.layoutParams.height = dpToPx(48f, container.context).toInt()
        }
      }
      1, 2 -> {
        if (badgeButton != null) {
          standardButton?.visibility = View.GONE
          badgeButton.visibility = View.VISIBLE
          
          if (container.layoutParams == null) {
            container.layoutParams = RelativeLayout.LayoutParams(
              RelativeLayout.LayoutParams.MATCH_PARENT,
              dpToPx(53f, container.context).toInt()
            )
          } else {
            container.layoutParams.height = dpToPx(53f, container.context).toInt()
          }
        } else {
          standardButton?.visibility = View.VISIBLE
          
          if (container.layoutParams == null) {
            container.layoutParams = RelativeLayout.LayoutParams(
              RelativeLayout.LayoutParams.MATCH_PARENT,
              dpToPx(48f, container.context).toInt()
            )
          } else {
            container.layoutParams.height = dpToPx(48f, container.context).toInt()
          }
        }
      }
      else -> {
        standardButton?.visibility = View.VISIBLE
        badgeButton?.visibility = View.GONE
        
        if (container.layoutParams == null) {
          container.layoutParams = RelativeLayout.LayoutParams(
            RelativeLayout.LayoutParams.MATCH_PARENT,
            dpToPx(48f, container.context).toInt()
          )
        } else {
          container.layoutParams.height = dpToPx(48f, container.context).toInt()
        }
      }
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
    val clickListener = View.OnClickListener {
      reactContext.getJSModule(com.facebook.react.uimanager.events.RCTEventEmitter::class.java)
        .receiveEvent(view.id, "topPress", null)
    }
    
    view.setTag(R.id.click_listener_tag, clickListener)
    
    view.setOnClickListener(clickListener)
    view.isClickable = true
    view.isFocusable = true
    
    val standardButton = view.findViewWithTag<View>("standard")
    val badgeButton = view.findViewWithTag<View>("badge")
    
    standardButton?.setOnClickListener(clickListener)
    badgeButton?.setOnClickListener(clickListener)
  }
  
  private fun ensureClickListeners(view: RelativeLayout) {
    val clickListener = view.getTag(R.id.click_listener_tag) as? View.OnClickListener
    
    if (clickListener != null) {
      val standardButton = view.findViewWithTag<View>("standard")
      val badgeButton = view.findViewWithTag<View>("badge")
      
      standardButton?.setOnClickListener(clickListener)
      badgeButton?.setOnClickListener(clickListener)
    }
  }
  
  private fun dpToPx(dp: Float, context: android.content.Context): Float {
    return android.util.TypedValue.applyDimension(
      android.util.TypedValue.COMPLEX_UNIT_DIP,
      dp,
      context.resources.displayMetrics
    )
  }
}