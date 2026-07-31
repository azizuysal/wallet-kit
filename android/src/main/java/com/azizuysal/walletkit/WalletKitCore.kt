package com.azizuysal.walletkit

import android.app.Activity
import com.google.android.gms.pay.PayApiAvailabilityStatus
import com.google.android.gms.pay.PayClient
import java.util.concurrent.atomic.AtomicInteger

internal interface WalletPromise {
  fun resolve(value: Boolean)

  fun reject(code: String, message: String, error: Throwable? = null)
}

internal interface WalletActivity

internal class AndroidWalletActivity(val activity: Activity) : WalletActivity

internal interface WalletPayClient {
  fun checkAvailability(onSuccess: (Int) -> Unit, onFailure: (Exception) -> Unit)

  fun savePassesJwt(jwt: String, activity: WalletActivity, requestCode: Int)
}

internal class GoogleWalletPayClient(private val client: PayClient) : WalletPayClient {
  override fun checkAvailability(onSuccess: (Int) -> Unit, onFailure: (Exception) -> Unit) {
    client
      .getPayApiAvailabilityStatus(PayClient.RequestType.SAVE_PASSES)
      .addOnSuccessListener(onSuccess)
      .addOnFailureListener(onFailure)
  }

  override fun savePassesJwt(jwt: String, activity: WalletActivity, requestCode: Int) {
    client.savePassesJwt(jwt, (activity as AndroidWalletActivity).activity, requestCode)
  }
}

internal class WalletKitCore(
  private val currentActivity: () -> WalletActivity?,
  private val payClient: WalletPayClient,
  private val emitCompletion: (Boolean) -> Unit,
) {
  private val listenerCount = AtomicInteger(0)
  private var pendingPromise: WalletPromise? = null

  fun canAddPasses(promise: WalletPromise) {
    payClient.checkAvailability(
      onSuccess = { status -> promise.resolve(status == PayApiAvailabilityStatus.AVAILABLE) },
      onFailure = { error ->
        promise.reject(
          ERR_WALLET_UNKNOWN,
          "Failed to check Google Wallet availability: ${error.message}",
          error,
        )
      },
    )
  }

  fun addPass(passData: String?, promise: WalletPromise) {
    val jwt = passData?.trim()
    if (jwt.isNullOrEmpty()) {
      promise.reject(INVALID_PASS, "Pass data must be a non-empty JWT string")
      return
    }

    startAddOperation(jwt, promise)
  }

  fun addPasses(passData: List<String?>?, promise: WalletPromise) {
    if (passData.isNullOrEmpty()) {
      promise.reject(INVALID_PASS, "Pass data array must be a non-empty array of pass strings")
      return
    }

    if (passData.size > 1) {
      promise.reject(
        ERR_WALLET_MULTIPLE_NOT_SUPPORTED,
        "Google Wallet requires multiple passes to be combined into a single JWT. Call addPass with one combined JWT instead.",
      )
      return
    }

    val jwt = passData.single()?.trim()
    if (jwt.isNullOrEmpty()) {
      promise.reject(INVALID_PASS, "Pass data at index 0 must be a non-empty JWT string")
      return
    }

    startAddOperation(jwt, promise)
  }

  private fun startAddOperation(jwt: String, promise: WalletPromise) {
    if (!claimPendingPromise(promise)) {
      return
    }

    val activity = currentActivity()
    if (activity == null) {
      rejectPending(ERR_WALLET_ACTIVITY_NULL, "Activity is null")
      return
    }

    payClient.checkAvailability(
      onSuccess = { status ->
        if (!hasPendingPromise()) {
          return@checkAvailability
        }

        if (status != PayApiAvailabilityStatus.AVAILABLE) {
          rejectPending(
            ERR_WALLET_NOT_AVAILABLE,
            "Google Wallet is not available on this device",
          )
          return@checkAvailability
        }

        try {
          payClient.savePassesJwt(jwt, activity, ADD_TO_GOOGLE_WALLET_REQUEST_CODE)
        } catch (error: Exception) {
          rejectPending(
            ERR_WALLET_UNKNOWN,
            "Failed to launch Google Wallet: ${error.message}",
            error,
          )
        }
      },
      onFailure = { error ->
        rejectPending(
          ERR_WALLET_UNKNOWN,
          "Failed to check Google Wallet availability: ${error.message}",
          error,
        )
      },
    )
  }

  fun handleActivityResult(requestCode: Int, resultCode: Int) {
    if (requestCode != ADD_TO_GOOGLE_WALLET_REQUEST_CODE) {
      return
    }

    val promise = releasePendingPromise() ?: return
    when (resultCode) {
      Activity.RESULT_OK -> {
        promise.resolve(true)
        sendCompletionEvent(true)
      }
      Activity.RESULT_CANCELED -> {
        promise.resolve(false)
        sendCompletionEvent(false)
      }
      else -> {
        promise.reject(
          ERR_WALLET_UNKNOWN,
          "Unexpected result code from Google Wallet: $resultCode",
        )
        sendCompletionEvent(false)
      }
    }
  }

  fun addListener() {
    listenerCount.incrementAndGet()
  }

  fun removeListeners(count: Double) {
    val requested = if (count.isFinite() && count > 0) count.toInt() else 0
    listenerCount.updateAndGet { current -> (current - requested).coerceAtLeast(0) }
  }

  fun destroy(message: String) {
    rejectPending(ERR_WALLET_UNKNOWN, message)
  }

  internal fun activeListenerCount(): Int = listenerCount.get()

  @Synchronized
  private fun claimPendingPromise(promise: WalletPromise): Boolean {
    if (pendingPromise != null) {
      promise.reject(
        ERR_WALLET_IN_PROGRESS,
        "Another add-pass call is already in flight. Wait for it to resolve or reject before issuing another.",
      )
      return false
    }
    pendingPromise = promise
    return true
  }

  @Synchronized
  private fun releasePendingPromise(): WalletPromise? {
    val promise = pendingPromise
    pendingPromise = null
    return promise
  }

  @Synchronized
  private fun hasPendingPromise(): Boolean = pendingPromise != null

  private fun rejectPending(code: String, message: String, error: Throwable? = null) {
    releasePendingPromise()?.reject(code, message, error)
  }

  private fun sendCompletionEvent(success: Boolean) {
    if (listenerCount.get() > 0) {
      emitCompletion(success)
    }
  }

  internal companion object {
    const val INVALID_PASS = "INVALID_PASS"
    const val ERR_WALLET_NOT_AVAILABLE = "ERR_WALLET_NOT_AVAILABLE"
    const val ERR_WALLET_UNKNOWN = "ERR_WALLET_UNKNOWN"
    const val ERR_WALLET_ACTIVITY_NULL = "ERR_WALLET_ACTIVITY_NULL"
    const val ERR_WALLET_MULTIPLE_NOT_SUPPORTED = "ERR_WALLET_MULTIPLE_NOT_SUPPORTED"
    const val ERR_WALLET_IN_PROGRESS = "ERR_WALLET_IN_PROGRESS"
    const val ADD_TO_GOOGLE_WALLET_REQUEST_CODE = 1000
  }
}
