package com.azizuysal.walletkit

import android.app.Activity
import com.google.android.gms.pay.PayApiAvailabilityStatus
import com.google.android.gms.pay.PayClient
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test

class WalletKitCoreTest {
  private val activity = object : WalletActivity {}

  @Test
  fun `availability resolves true only for available status`() {
    val client = FakePayClient()
    val promise = FakePromise()
    val core = newCore(client)

    core.canAddPasses(promise)
    client.succeedAvailability(PayApiAvailabilityStatus.AVAILABLE)

    assertEquals(true, promise.resolved)
  }

  @Test
  fun `availability failure rejects with stable error`() {
    val client = FakePayClient()
    val promise = FakePromise()
    val core = newCore(client)
    val cause = IllegalStateException("services failed")

    core.canAddPasses(promise)
    client.failAvailability(cause)

    assertEquals(WalletKitCore.ERR_WALLET_UNKNOWN, promise.rejectedCode)
    assertSame(cause, promise.rejectedError)
  }

  @Test
  fun `null activity rejects and releases the operation`() {
    val client = FakePayClient()
    val first = FakePromise()
    val second = FakePromise()
    val core = newCore(client, currentActivity = { null })

    core.addPass(VALID_JWT, first)
    core.addPass(VALID_JWT, second)

    assertEquals(WalletKitCore.ERR_WALLET_ACTIVITY_NULL, first.rejectedCode)
    assertEquals(WalletKitCore.ERR_WALLET_ACTIVITY_NULL, second.rejectedCode)
  }

  @Test
  fun `concurrent operation is rejected without replacing the first promise`() {
    val client = FakePayClient()
    val first = FakePromise()
    val second = FakePromise()
    val core = newCore(client)

    core.addPass(VALID_JWT, first)
    core.addPass(VALID_JWT, second)
    client.succeedAvailability(PayApiAvailabilityStatus.AVAILABLE)
    core.handleActivityResult(WalletKitCore.ADD_TO_GOOGLE_WALLET_REQUEST_CODE, Activity.RESULT_OK)

    assertEquals(WalletKitCore.ERR_WALLET_IN_PROGRESS, second.rejectedCode)
    assertEquals(true, first.resolved)
  }

  @Test
  fun `unavailable wallet rejects before launch`() {
    val client = FakePayClient()
    val promise = FakePromise()
    val core = newCore(client)

    core.addPass(VALID_JWT, promise)
    client.succeedAvailability(-1)

    assertEquals(WalletKitCore.ERR_WALLET_NOT_AVAILABLE, promise.rejectedCode)
    assertNull(client.savedJwt)
  }

  @Test
  fun `launch exception rejects and releases the operation`() {
    val cause = IllegalArgumentException("bad activity")
    val client = FakePayClient(saveError = cause)
    val promise = FakePromise()
    val core = newCore(client)

    core.addPass(VALID_JWT, promise)
    client.succeedAvailability(PayApiAvailabilityStatus.AVAILABLE)

    assertEquals(WalletKitCore.ERR_WALLET_UNKNOWN, promise.rejectedCode)
    assertSame(cause, promise.rejectedError)
  }

  @Test
  fun `success and cancellation resolve final outcomes`() {
    val successClient = FakePayClient()
    val success = FakePromise()
    val successCore = newCore(successClient)
    successCore.addPass(VALID_JWT, success)
    successClient.succeedAvailability(PayApiAvailabilityStatus.AVAILABLE)
    successCore.handleActivityResult(
      WalletKitCore.ADD_TO_GOOGLE_WALLET_REQUEST_CODE,
      Activity.RESULT_OK,
    )

    val cancelClient = FakePayClient()
    val cancelled = FakePromise()
    val cancelCore = newCore(cancelClient)
    cancelCore.addPass(VALID_JWT, cancelled)
    cancelClient.succeedAvailability(PayApiAvailabilityStatus.AVAILABLE)
    cancelCore.handleActivityResult(
      WalletKitCore.ADD_TO_GOOGLE_WALLET_REQUEST_CODE,
      Activity.RESULT_CANCELED,
    )

    assertEquals(true, success.resolved)
    assertEquals(false, cancelled.resolved)
  }

  @Test
  fun `unexpected result rejects and settles once`() {
    val client = FakePayClient()
    val promise = FakePromise()
    val core = newCore(client)

    core.addPass(VALID_JWT, promise)
    client.succeedAvailability(PayApiAvailabilityStatus.AVAILABLE)
    core.handleActivityResult(WalletKitCore.ADD_TO_GOOGLE_WALLET_REQUEST_CODE, 42)
    core.handleActivityResult(WalletKitCore.ADD_TO_GOOGLE_WALLET_REQUEST_CODE, Activity.RESULT_OK)

    assertEquals(WalletKitCore.ERR_WALLET_UNKNOWN, promise.rejectedCode)
    assertEquals(1, promise.settlementCount)
  }

  @Test
  fun `wallet result errors use stable codes and preserve save details`() {
    val unavailableClient = FakePayClient()
    val unavailable = FakePromise()
    val unavailableCore = newCore(unavailableClient)
    unavailableCore.addPass(VALID_JWT, unavailable)
    unavailableClient.succeedAvailability(PayApiAvailabilityStatus.AVAILABLE)
    unavailableCore.handleActivityResult(
      WalletKitCore.ADD_TO_GOOGLE_WALLET_REQUEST_CODE,
      PayClient.SavePassesResult.API_UNAVAILABLE,
    )

    val saveClient = FakePayClient()
    val saveError = FakePromise()
    val saveCore = newCore(saveClient)
    saveCore.addPass(VALID_JWT, saveError)
    saveClient.succeedAvailability(PayApiAvailabilityStatus.AVAILABLE)
    saveCore.handleActivityResult(
      WalletKitCore.ADD_TO_GOOGLE_WALLET_REQUEST_CODE,
      PayClient.SavePassesResult.SAVE_ERROR,
      "Invalid pass object",
    )

    val internalClient = FakePayClient()
    val internal = FakePromise()
    val internalCore = newCore(internalClient)
    internalCore.addPass(VALID_JWT, internal)
    internalClient.succeedAvailability(PayApiAvailabilityStatus.AVAILABLE)
    internalCore.handleActivityResult(
      WalletKitCore.ADD_TO_GOOGLE_WALLET_REQUEST_CODE,
      PayClient.SavePassesResult.INTERNAL_ERROR,
    )

    assertEquals(
      WalletKitCore.ERR_WALLET_NOT_AVAILABLE,
      unavailable.rejectedCode,
    )
    assertEquals(
      "Google Wallet could not save the pass: Invalid pass object",
      saveError.rejectedMessage,
    )
    assertEquals(WalletKitCore.ERR_WALLET_UNKNOWN, internal.rejectedCode)
  }

  @Test
  fun `host resume rejects an abandoned wallet flow and permits retry`() {
    val events = mutableListOf<Boolean>()
    val client = FakePayClient()
    val abandoned = FakePromise()
    val retry = FakePromise()
    val core = newCore(client, emitCompletion = events::add)
    core.addListener()

    core.addPass(VALID_JWT, abandoned)
    client.succeedAvailability(PayApiAvailabilityStatus.AVAILABLE)
    core.handleHostResume()
    core.addPass(VALID_JWT, retry)
    client.succeedAvailability(PayApiAvailabilityStatus.AVAILABLE)
    core.handleActivityResult(
      WalletKitCore.ADD_TO_GOOGLE_WALLET_REQUEST_CODE,
      Activity.RESULT_CANCELED,
    )

    assertEquals(WalletKitCore.ERR_WALLET_UNKNOWN, abandoned.rejectedCode)
    assertEquals(1, abandoned.settlementCount)
    assertEquals(false, retry.resolved)
    assertEquals(listOf(false, false), events)
  }

  @Test
  fun `host resume after an activity result does not settle twice`() {
    val events = mutableListOf<Boolean>()
    val client = FakePayClient()
    val promise = FakePromise()
    val core = newCore(client, emitCompletion = events::add)
    core.addListener()

    core.addPass(VALID_JWT, promise)
    client.succeedAvailability(PayApiAvailabilityStatus.AVAILABLE)
    core.handleActivityResult(
      WalletKitCore.ADD_TO_GOOGLE_WALLET_REQUEST_CODE,
      Activity.RESULT_OK,
    )
    core.handleHostResume()

    assertEquals(true, promise.resolved)
    assertEquals(1, promise.settlementCount)
    assertEquals(listOf(true), events)
  }

  @Test
  fun `host destruction rejects pending work and ignores late callbacks`() {
    val client = FakePayClient()
    val promise = FakePromise()
    val core = newCore(client)

    core.addPass(VALID_JWT, promise)
    core.destroy("host destroyed")
    client.succeedAvailability(PayApiAvailabilityStatus.AVAILABLE)

    assertEquals(WalletKitCore.ERR_WALLET_UNKNOWN, promise.rejectedCode)
    assertNull(client.savedJwt)
    assertEquals(1, promise.settlementCount)
  }

  @Test
  fun `listener count is clamped and completion events require a listener`() {
    val events = mutableListOf<Boolean>()
    val client = FakePayClient()
    val core = newCore(client, emitCompletion = events::add)

    core.removeListeners(4.0)
    assertEquals(0, core.activeListenerCount())
    core.addListener()
    core.addListener()
    core.removeListeners(1.0)
    assertEquals(1, core.activeListenerCount())

    val promise = FakePromise()
    core.addPass(VALID_JWT, promise)
    client.succeedAvailability(PayApiAvailabilityStatus.AVAILABLE)
    core.handleActivityResult(WalletKitCore.ADD_TO_GOOGLE_WALLET_REQUEST_CODE, Activity.RESULT_OK)

    assertEquals(listOf(true), events)
  }

  @Test
  fun `invalid and multiple pass inputs fail before availability checks`() {
    val client = FakePayClient()
    val invalid = FakePromise()
    val multiple = FakePromise()
    val core = newCore(client)

    core.addPass("  ", invalid)
    core.addPasses(listOf(VALID_JWT, VALID_JWT), multiple)

    assertEquals(WalletKitCore.INVALID_PASS, invalid.rejectedCode)
    assertEquals(WalletKitCore.ERR_WALLET_MULTIPLE_NOT_SUPPORTED, multiple.rejectedCode)
    assertTrue(client.availabilityCallbacks.isEmpty())
  }

  private fun newCore(
    client: FakePayClient,
    currentActivity: () -> WalletActivity? = { activity },
    emitCompletion: (Boolean) -> Unit = {},
  ) = WalletKitCore(currentActivity, client, emitCompletion)

  private class FakePromise : WalletPromise {
    var resolved: Boolean? = null
    var rejectedCode: String? = null
    var rejectedMessage: String? = null
    var rejectedError: Throwable? = null
    var settlementCount = 0

    override fun resolve(value: Boolean) {
      resolved = value
      settlementCount += 1
    }

    override fun reject(code: String, message: String, error: Throwable?) {
      rejectedCode = code
      rejectedMessage = message
      rejectedError = error
      settlementCount += 1
    }
  }

  private class FakePayClient(private val saveError: Exception? = null) : WalletPayClient {
    val availabilityCallbacks = mutableListOf<Pair<(Int) -> Unit, (Exception) -> Unit>>()
    var savedJwt: String? = null

    override fun checkAvailability(onSuccess: (Int) -> Unit, onFailure: (Exception) -> Unit) {
      availabilityCallbacks += onSuccess to onFailure
    }

    override fun savePassesJwt(jwt: String, activity: WalletActivity, requestCode: Int) {
      saveError?.let { throw it }
      savedJwt = jwt
    }

    fun succeedAvailability(status: Int) {
      availabilityCallbacks.removeAt(0).first(status)
    }

    fun failAvailability(error: Exception) {
      availabilityCallbacks.removeAt(0).second(error)
    }
  }

  private companion object {
    const val VALID_JWT = "header.payload.signature"
  }
}
