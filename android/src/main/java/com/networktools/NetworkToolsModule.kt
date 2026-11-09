package com.networktools

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = NetworkToolsModule.NAME)
class NetworkToolsModule(reactContext: ReactApplicationContext) :
  NativeNetworkToolsSpec(reactContext) {

  init {
    NetworkToolsModuleDelegate.initialize(reactContext)
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

  override fun setMaxBodyCaptureBytes(bytes: Double) {
    NetworkToolsManager.maxBodyCaptureBytes = bytes.toLong()
  }

  override fun setRedactHeaders(headers: ReadableArray) {
    val set = mutableSetOf<String>()
    for (i in 0 until headers.size()) {
      headers.getString(i)?.lowercase()?.let { set.add(it) }
    }
    NetworkToolsManager.redactHeaders = set
  }

  override fun setMaxRequests(max: Double) = NetworkToolsModuleDelegate.setMaxRequests(max)

  override fun isCaptureActive(): Boolean = NetworkToolsModuleDelegate.isCaptureActive()

  override fun startSession(): String = NetworkToolsModuleDelegate.startSession()

  override fun stopSession(promise: Promise) = NetworkToolsModuleDelegate.stopSession(promise)

  override fun getActiveSession(): String = NetworkToolsModuleDelegate.getActiveSession()

  override fun getActiveSessionSummaries(): String =
    NetworkToolsModuleDelegate.getActiveSessionSummaries()

  override fun listSessions(promise: Promise) = NetworkToolsModuleDelegate.listSessions(promise)

  override fun getSessionSummaries(sessionId: String, promise: Promise) =
    NetworkToolsModuleDelegate.getSessionSummaries(sessionId, promise)

  override fun getSessionRequest(sessionId: String, requestId: String, promise: Promise) =
    NetworkToolsModuleDelegate.getSessionRequest(sessionId, requestId, promise)

  override fun deleteSession(sessionId: String, promise: Promise) =
    NetworkToolsModuleDelegate.deleteSession(sessionId, promise)

  override fun clearSessions(promise: Promise) = NetworkToolsModuleDelegate.clearSessions(promise)

  override fun addListener(eventType: String?) {

  }

  override fun removeListeners(count: Double) {

  }

  companion object {
    const val NAME = "NetworkTools"
  }
}
