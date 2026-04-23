package com.azizuysal.walletkit

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.util.Log
import com.google.android.gms.pay.Pay
import com.google.android.gms.pay.PayApiAvailabilityStatus
import com.google.android.gms.pay.PayClient
import java.util.concurrent.atomic.AtomicInteger

class WalletKitModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext),
  LifecycleEventListener {

  private val listenerCount = AtomicInteger(0)
  private val payClient: PayClient = Pay.getClient(reactContext)

  private var pendingPromise: Promise? = null

  private val activityEventListener: ActivityEventListener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
      if (requestCode == ADD_TO_GOOGLE_WALLET_REQUEST_CODE) {
        handleAddToWalletResult(resultCode)
      }
    }
  }

  init {
    reactContext.addActivityEventListener(activityEventListener)
    reactContext.addLifecycleEventListener(this)
  }

  override fun getName(): String = NAME

  companion object {
    const val NAME = "WalletKit"
    private const val INVALID_PASS = "INVALID_PASS"
    private const val ERR_WALLET_NOT_AVAILABLE = "ERR_WALLET_NOT_AVAILABLE"
    private const val ERR_WALLET_UNKNOWN = "ERR_WALLET_UNKNOWN"
    private const val ERR_WALLET_ACTIVITY_NULL = "ERR_WALLET_ACTIVITY_NULL"
    private const val ERR_WALLET_MULTIPLE_NOT_SUPPORTED = "ERR_WALLET_MULTIPLE_NOT_SUPPORTED"
    private const val ERR_WALLET_IN_PROGRESS = "ERR_WALLET_IN_PROGRESS"
    private const val ADD_TO_GOOGLE_WALLET_REQUEST_CODE = 1000
  }

  @ReactMethod
  fun canAddPasses(promise: Promise) {
    payClient
      .getPayApiAvailabilityStatus(PayClient.RequestType.SAVE_PASSES)
      .addOnSuccessListener { status ->
        promise.resolve(status == PayApiAvailabilityStatus.AVAILABLE)
      }
      .addOnFailureListener { exception ->
        promise.reject(
          ERR_WALLET_UNKNOWN,
          "Failed to check Google Wallet availability: ${exception.message}",
          exception
        )
      }
  }

  @ReactMethod
  fun addPass(passData: String?, promise: Promise) {
    if (passData.isNullOrEmpty()) {
      promise.reject(INVALID_PASS, "Pass data must be a non-empty JWT string")
      return
    }

    val activity = currentActivity
    if (activity == null) {
      promise.reject(ERR_WALLET_ACTIVITY_NULL, "Activity is null")
      return
    }

    if (!claimPendingPromise(promise)) {
      return
    }

    val jwt = passData.trim()
    checkAvailabilityAndSave(jwt, activity)
  }

  @ReactMethod
  fun addPasses(passDataArray: ReadableArray?, promise: Promise) {
    if (passDataArray == null || passDataArray.size() == 0) {
      promise.reject(INVALID_PASS, "Pass data array must be a non-empty array of pass strings")
      return
    }

    if (passDataArray.size() > 1) {
      promise.reject(
        ERR_WALLET_MULTIPLE_NOT_SUPPORTED,
        "Google Wallet requires multiple passes to be combined into a single JWT. Call addPass with one combined JWT instead."
      )
      return
    }

    val firstJwt = passDataArray.getString(0)?.trim()
    if (firstJwt.isNullOrEmpty()) {
      promise.reject(INVALID_PASS, "Pass data at index 0 must be a non-empty JWT string")
      return
    }

    val activity = currentActivity
    if (activity == null) {
      promise.reject(ERR_WALLET_ACTIVITY_NULL, "Activity is null")
      return
    }

    if (!claimPendingPromise(promise)) {
      return
    }

    checkAvailabilityAndSave(firstJwt, activity)
  }

  @Synchronized
  private fun claimPendingPromise(promise: Promise): Boolean {
    if (pendingPromise != null) {
      promise.reject(
        ERR_WALLET_IN_PROGRESS,
        "Another add-pass call is already in flight. Wait for it to resolve or reject before issuing another."
      )
      return false
    }
    pendingPromise = promise
    return true
  }

  @Synchronized
  private fun releasePendingPromise(): Promise? {
    val promise = pendingPromise
    pendingPromise = null
    return promise
  }

  @Synchronized
  private fun hasPendingPromise(): Boolean = pendingPromise != null

  private fun checkAvailabilityAndSave(jwt: String, activity: Activity) {
    payClient
      .getPayApiAvailabilityStatus(PayClient.RequestType.SAVE_PASSES)
      .addOnSuccessListener { status ->
        // The host activity or the React Native module may be torn down
        // while this availability check is in flight. If the pending
        // promise is already gone, there is no consumer left to notify,
        // so skip the native call entirely rather than risk an exception
        // on a destroyed activity.
        if (!hasPendingPromise()) {
          return@addOnSuccessListener
        }

        if (status == PayApiAvailabilityStatus.AVAILABLE) {
          try {
            payClient.savePassesJwt(jwt, activity, ADD_TO_GOOGLE_WALLET_REQUEST_CODE)
          } catch (exception: Exception) {
            val promise = releasePendingPromise()
            if (promise != null) {
              promise.reject(
                ERR_WALLET_UNKNOWN,
                "Failed to launch Google Wallet: ${exception.message}",
                exception
              )
            } else {
              // Lifecycle destruction raced with savePassesJwt after our
              // hasPendingPromise() check. No consumer left to reject, so
              // surface the exception to logcat as an error so it is not
              // completely lost.
              Log.e(NAME, "savePassesJwt threw after promise was released", exception)
            }
          }
        } else {
          releasePendingPromise()?.reject(
            ERR_WALLET_NOT_AVAILABLE,
            "Google Wallet is not available on this device"
          )
        }
      }
      .addOnFailureListener { exception ->
        releasePendingPromise()?.reject(
          ERR_WALLET_UNKNOWN,
          "Failed to check Google Wallet availability: ${exception.message}",
          exception
        )
      }
  }

  private fun handleAddToWalletResult(resultCode: Int) {
    val promise = releasePendingPromise() ?: return

    when (resultCode) {
      Activity.RESULT_OK -> {
        promise.resolve(null)
        sendAddPassCompletedEvent(true)
      }
      Activity.RESULT_CANCELED -> {
        promise.resolve(null)
        sendAddPassCompletedEvent(false)
      }
      else -> {
        promise.reject(ERR_WALLET_UNKNOWN, "Unexpected result code from Google Wallet: $resultCode")
        sendAddPassCompletedEvent(false)
      }
    }
  }

  private fun sendAddPassCompletedEvent(success: Boolean) {
    if (listenerCount.get() > 0) {
      sendEvent(reactApplicationContext, "AddPassCompleted", success)
    }
  }

  @ReactMethod
  fun addListener(eventName: String?) {
    listenerCount.incrementAndGet()
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    listenerCount.updateAndGet { current ->
      val next = current - count
      if (next < 0) 0 else next
    }
  }

  private fun sendEvent(
    reactContext: ReactContext,
    eventName: String,
    params: Any?
  ) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }

  override fun onHostResume() {
    // no-op
  }

  override fun onHostPause() {
    // no-op
  }

  override fun onHostDestroy() {
    releasePendingPromise()?.reject(
      ERR_WALLET_UNKNOWN,
      "Host activity was destroyed before the Google Wallet result was received"
    )
  }

  override fun invalidate() {
    super.invalidate()
    releasePendingPromise()?.reject(
      ERR_WALLET_UNKNOWN,
      "WalletKit module was invalidated before the Google Wallet result was received"
    )
    reactApplicationContext.removeActivityEventListener(activityEventListener)
    reactApplicationContext.removeLifecycleEventListener(this)
  }
}
