package com.walletkit;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;

@ReactModule(name = WalletKitModule.NAME)
public class WalletKitModule extends ReactContextBaseJavaModule {
  public static final String NAME = "WalletKit";
  private int listenerCount = 0;

  public WalletKitModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void canAddPasses(Promise promise) {
    promise.reject("Not Implemented");
  }

  @ReactMethod
  public void addPass(String passData, Promise promise) {
    promise.reject("Not Implemented");
  }

  @ReactMethod
  public void addPasses(ReadableArray passDataArray, Promise promise) {
    promise.reject("Not Implemented");
  }

  @ReactMethod
  public void addListener(String eventName) {
    listenerCount += 1;
  }

  @ReactMethod
  public void removeListeners(Integer count) {
    listenerCount -= count;
  }

  private void sendEvent(ReactContext reactContext, String eventName, @Nullable WritableMap params) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(eventName, params);
  }
}
