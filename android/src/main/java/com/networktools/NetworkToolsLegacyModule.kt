package com.networktools

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
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
  fun setMaxBodyCaptureBytes(bytes: Double) {
    NetworkToolsManager.maxBodyCaptureBytes = bytes.toLong()
  }

  @ReactMethod
  fun setRedactHeaders(headers: ReadableArray) {
    val set = mutableSetOf<String>()
    for (i in 0 until headers.size()) {
      headers.getString(i)?.lowercase()?.let { set.add(it) }
    }
    NetworkToolsManager.redactHeaders = set
  }

  @ReactMethod
  fun addListener(eventType: String?) {}

  @ReactMethod
  fun removeListeners(count: Double) {}

  companion object {
    const val NAME = "NetworkToolsLegacy"
  }
}
