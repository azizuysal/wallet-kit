package com.azizuysal.walletkit

import android.view.LayoutInflater
import android.view.View
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.RelativeLayout
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.Event

class WalletButtonView(private val reactContext: ThemedReactContext) :
  RelativeLayout(reactContext) {
  private val standardButton = inflateButton(R.layout.add_to_googlewallet_button, STANDARD_TAG)
  private val condensedButton = inflateButton(R.layout.add_to_googlewallet_badge, CONDENSED_TAG)

  init {
    isClickable = true
    isFocusable = true
    importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
    contentDescription = resources.getString(R.string.add_to_googlewallet_button_content_description)
    addView(standardButton)
    addView(condensedButton)
    applyStyle(PRIMARY_STYLE)
  }

  fun applyStyle(style: Int) {
    val useCondensed = style == SECONDARY_STYLE || style == OUTLINE_COMPATIBILITY_STYLE
    standardButton.visibility = if (useCondensed) View.GONE else View.VISIBLE
    condensedButton.visibility = if (useCondensed) View.VISIBLE else View.GONE
    minimumHeight = dpToPixels(if (useCondensed) CONDENSED_HEIGHT_DP else STANDARD_HEIGHT_DP)
  }

  fun installPressHandler(onPress: () -> Unit) = setOnClickListener { onPress() }

  override fun onInitializeAccessibilityNodeInfo(info: AccessibilityNodeInfo?) {
    super.onInitializeAccessibilityNodeInfo(info)
    info?.className = "android.widget.Button"
  }

  private fun inflateButton(layoutId: Int, viewTag: String): View {
    val view = LayoutInflater.from(context).inflate(layoutId, this, false)
    view.tag = viewTag
    view.isClickable = false
    view.isFocusable = false
    view.importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS
    view.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    return view
  }

  private fun dpToPixels(dp: Int): Int = (dp * resources.displayMetrics.density).toInt()

  private companion object {
    const val PRIMARY_STYLE = 0
    const val SECONDARY_STYLE = 1
    const val OUTLINE_COMPATIBILITY_STYLE = 2
    const val STANDARD_HEIGHT_DP = 48
    const val CONDENSED_HEIGHT_DP = 53
    const val STANDARD_TAG = "standard"
    const val CONDENSED_TAG = "condensed"
  }
}

internal class WalletButtonPressEvent(surfaceId: Int, viewId: Int) :
  Event<WalletButtonPressEvent>(surfaceId, viewId) {
  override fun getEventName(): String = EVENT_NAME

  override fun canCoalesce(): Boolean = false

  override fun getEventData(): WritableMap = Arguments.createMap().apply {
    putInt("target", viewTag)
  }

  private companion object {
    const val EVENT_NAME = "topPress"
  }
}
