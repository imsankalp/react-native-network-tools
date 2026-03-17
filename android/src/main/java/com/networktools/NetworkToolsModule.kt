package com.networktools

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.networktools.interceptor.NetworkToolsEventEmitter

@ReactModule(name = NetworkToolsModule.NAME)
class NetworkToolsModule(reactContext: ReactApplicationContext) :
  NativeNetworkToolsSpec(reactContext) {

  init {
    // Initialize the event emitter with the React context
    NetworkToolsEventEmitter.initialize(reactContext)
  }

  // IMPORTANT: Add this method to support event emission
  override fun canOverrideExistingModule(): Boolean {
    return true
  }


  override fun getName(): String {
    return NAME
  }

  override fun getAllRequests(): String {
    return NetworkToolsModuleDelegate.getAllRequests()
  }

  override fun getRequestById(id: String): String {
    return NetworkToolsModuleDelegate.getRequestById(id)
  }

  override fun clearAllRequests() {
    NetworkToolsModuleDelegate.clearAllRequests()
  }

  override fun getRequestCount(): Double {
    return NetworkToolsModuleDelegate.getRequestCount()
  }

  override fun addListener(eventType: String?) {

  }

  override fun removeListeners(count: Double) {

  }

  companion object {
    const val NAME = "NetworkTools"
  }
}
