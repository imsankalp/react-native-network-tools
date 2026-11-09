package com.networktools

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray

class NetworkToolsLegacyModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  init {
    NetworkToolsModuleDelegate.initialize(reactContext)
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
  fun setMaxRequests(max: Double) = NetworkToolsModuleDelegate.setMaxRequests(max)

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun isCaptureActive(): Boolean = NetworkToolsModuleDelegate.isCaptureActive()

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun startSession(): String = NetworkToolsModuleDelegate.startSession()

  @ReactMethod
  fun stopSession(promise: Promise) = NetworkToolsModuleDelegate.stopSession(promise)

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun getActiveSession(): String = NetworkToolsModuleDelegate.getActiveSession()

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun getActiveSessionSummaries(): String = NetworkToolsModuleDelegate.getActiveSessionSummaries()

  @ReactMethod
  fun listSessions(promise: Promise) = NetworkToolsModuleDelegate.listSessions(promise)

  @ReactMethod
  fun getSessionSummaries(sessionId: String, promise: Promise) =
    NetworkToolsModuleDelegate.getSessionSummaries(sessionId, promise)

  @ReactMethod
  fun getSessionRequest(sessionId: String, requestId: String, promise: Promise) =
    NetworkToolsModuleDelegate.getSessionRequest(sessionId, requestId, promise)

  @ReactMethod
  fun deleteSession(sessionId: String, promise: Promise) =
    NetworkToolsModuleDelegate.deleteSession(sessionId, promise)

  @ReactMethod
  fun clearSessions(promise: Promise) = NetworkToolsModuleDelegate.clearSessions(promise)

  @ReactMethod
  fun addListener(eventType: String?) {}

  @ReactMethod
  fun removeListeners(count: Double) {}

  companion object {
    const val NAME = "NetworkToolsLegacy"
  }
}
