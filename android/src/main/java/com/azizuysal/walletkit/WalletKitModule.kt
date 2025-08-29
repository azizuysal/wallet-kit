package com.azizuysal.walletkit

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.pay.Pay
import com.google.android.gms.pay.PayApiAvailabilityStatus
import com.google.android.gms.pay.PayClient

class WalletKitModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var listenerCount = 0
  private lateinit var payClient: PayClient
  private var addToGoogleWalletPromise: Promise? = null

  private val activityEventListener: ActivityEventListener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
      if (requestCode == ADD_TO_GOOGLE_WALLET_REQUEST_CODE) {
        handleAddToWalletResult(resultCode)
      }
    }
  }

  init {
    reactContext.addActivityEventListener(activityEventListener)
  }

  override fun getName(): String {
    return NAME
  }

  companion object {
    const val NAME = "WalletKit"
    private const val ERR_WALLET_NOT_AVAILABLE = "ERR_WALLET_NOT_AVAILABLE"
    private const val ERR_WALLET_CANCELLED = "ERR_WALLET_CANCELLED"
    private const val ERR_WALLET_UNKNOWN = "ERR_WALLET_UNKNOWN"
    private const val ERR_WALLET_ACTIVITY_NULL = "ERR_WALLET_ACTIVITY_NULL"
    private const val ADD_TO_GOOGLE_WALLET_REQUEST_CODE = 1000
  }

  @ReactMethod
  fun canAddPasses(promise: Promise) {
    payClient = Pay.getClient(reactApplicationContext)
    
    payClient
      .getPayApiAvailabilityStatus(PayClient.RequestType.SAVE_PASSES)
      .addOnSuccessListener { status ->
        val canAdd = status == PayApiAvailabilityStatus.AVAILABLE
        promise.resolve(canAdd)
      }
      .addOnFailureListener {
        promise.resolve(false)
      }
  }

  @ReactMethod
  fun addPass(passData: String?, promise: Promise) {
    if (passData == null || passData.isEmpty()) {
      promise.reject(ERR_WALLET_UNKNOWN, "Pass data is required")
      return
    }

    val activity = currentActivity
    if (activity == null) {
      promise.reject(ERR_WALLET_ACTIVITY_NULL, "Activity is null")
      return
    }

    payClient = Pay.getClient(activity)
    addToGoogleWalletPromise = promise

    payClient
      .getPayApiAvailabilityStatus(PayClient.RequestType.SAVE_PASSES)
      .addOnSuccessListener { status ->
        if (status == PayApiAvailabilityStatus.AVAILABLE) {
          // Remove any whitespace and newlines from JWT
          val jwt = passData.trim()
          payClient.savePassesJwt(jwt, activity, ADD_TO_GOOGLE_WALLET_REQUEST_CODE)
        } else {
          promise.reject(ERR_WALLET_NOT_AVAILABLE, "Google Wallet is not available on this device")
          addToGoogleWalletPromise = null
        }
      }
      .addOnFailureListener { exception ->
        promise.reject(ERR_WALLET_UNKNOWN, "Failed to check Google Wallet availability: ${exception.message}")
        addToGoogleWalletPromise = null
      }
  }

  @ReactMethod
  fun addPasses(passDataArray: ReadableArray?, promise: Promise) {
    if (passDataArray == null || passDataArray.size() == 0) {
      promise.reject(ERR_WALLET_UNKNOWN, "Pass data array is required")
      return
    }

    val activity = currentActivity
    if (activity == null) {
      promise.reject(ERR_WALLET_ACTIVITY_NULL, "Activity is null")
      return
    }

    payClient = Pay.getClient(activity)
    addToGoogleWalletPromise = promise

    payClient
      .getPayApiAvailabilityStatus(PayClient.RequestType.SAVE_PASSES)
      .addOnSuccessListener { status ->
        if (status == PayApiAvailabilityStatus.AVAILABLE) {
          // Google Wallet API currently only supports adding one JWT at a time
          // If we have multiple separate JWTs, we'll use the first one
          // In production, you should either:
          // 1. Combine multiple passes into a single JWT on the server side
          // 2. Show multiple "Add to Wallet" buttons for each pass
          // 3. Implement a custom flow to add passes sequentially
          
          if (passDataArray.size() > 0) {
            val firstJwt = passDataArray.getString(0)?.trim()
            if (firstJwt != null) {
              // Log warning if multiple passes were provided
              if (passDataArray.size() > 1) {
                // Note: In a production app, you might want to handle this differently
                // For now, we'll just add the first pass
                android.util.Log.w(NAME, "Multiple passes provided but only the first will be added. " +
                  "Google Wallet API requires passes to be combined in a single JWT.")
              }
              payClient.savePassesJwt(firstJwt, activity, ADD_TO_GOOGLE_WALLET_REQUEST_CODE)
            } else {
              promise.reject(ERR_WALLET_UNKNOWN, "Invalid pass data")
              addToGoogleWalletPromise = null
            }
          } else {
            promise.reject(ERR_WALLET_UNKNOWN, "No pass data provided")
            addToGoogleWalletPromise = null
          }
        } else {
          promise.reject(ERR_WALLET_NOT_AVAILABLE, "Google Wallet is not available on this device")
          addToGoogleWalletPromise = null
        }
      }
      .addOnFailureListener { exception ->
        promise.reject(ERR_WALLET_UNKNOWN, "Failed to check Google Wallet availability: ${exception.message}")
        addToGoogleWalletPromise = null
      }
  }

  private fun handleAddToWalletResult(resultCode: Int) {
    val promise = addToGoogleWalletPromise ?: return

    when (resultCode) {
      Activity.RESULT_OK -> {
        // Pass saved successfully
        promise.resolve(null)
        sendAddPassCompletedEvent(true)
      }
      Activity.RESULT_CANCELED -> {
        // User cancelled the operation
        promise.reject(ERR_WALLET_CANCELLED, "User cancelled adding pass to wallet")
        sendAddPassCompletedEvent(false)
      }
      else -> {
        // Unknown error
        promise.reject(ERR_WALLET_UNKNOWN, "Unknown error occurred while adding pass")
        sendAddPassCompletedEvent(false)
      }
    }
    
    addToGoogleWalletPromise = null
  }

  private fun sendAddPassCompletedEvent(success: Boolean) {
    if (listenerCount > 0) {
      // Send event in the same format as iOS (boolean directly)
      sendEvent(reactApplicationContext, "AddPassCompleted", success)
    }
  }

  @ReactMethod
  fun addListener(eventName: String?) {
    listenerCount += 1
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    listenerCount -= count
  }

  private fun sendEvent(
    reactContext: ReactContext,
    eventName: String,
    params: WritableMap?
  ) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }
}