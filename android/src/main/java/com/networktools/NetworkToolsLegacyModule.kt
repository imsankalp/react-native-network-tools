package com.networktools

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.networktools.interceptor.NetworkToolsEventEmitter

class NetworkToolsLegacyModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  init {
    NetworkToolsEventEmitter.initialize(reactContext)
  }

  override fun getName(): String {
    return NAME
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun getAllRequests(): String {
    return NetworkToolsModuleDelegate.getAllRequests()
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun getRequestById(id: String): String {
    return NetworkToolsModuleDelegate.getRequestById(id)
  }

  @ReactMethod
  fun clearAllRequests() {
    NetworkToolsModuleDelegate.clearAllRequests()
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun getRequestCount(): Double {
    return NetworkToolsModuleDelegate.getRequestCount()
  }

  @ReactMethod
  fun addListener(eventType: String?) {}

  @ReactMethod
  fun removeListeners(count: Double) {}

  companion object {
    const val NAME = "NetworkToolsLegacy"
  }
}
