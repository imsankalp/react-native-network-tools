package com.networktools

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.networktools.interceptor.NetworkToolsEventEmitter
import com.networktools.session.SessionRecorder
import com.networktools.storage.NetworkRequestStorage
import com.networktools.storage.SessionFileStore
import org.json.JSONArray

object NetworkToolsModuleDelegate {
  fun initialize(reactContext: ReactApplicationContext) {
    NetworkToolsEventEmitter.initialize(reactContext)
    SessionRecorder.initialize(reactContext)
    SessionFileStore.initialize(reactContext)
  }

  fun getAllRequests(): String {
    val requests = NetworkRequestStorage.getAllRequests()
    val jsonArray = JSONArray()
    requests.forEach { request ->
      jsonArray.put(request.toJson())
    }
    return jsonArray.toString()
  }

  fun getRequestById(id: String): String {
    val request = NetworkRequestStorage.getRequestById(id)
    return request?.toJson()?.toString() ?: "{}"
  }

  fun clearAllRequests() {
    NetworkRequestStorage.clearAll()
  }

  fun getRequestCount(): Double {
    return NetworkRequestStorage.getCount().toDouble()
  }

  fun setMaxRequests(max: Double) {
    NetworkRequestStorage.maxRequests = max.toInt()
  }

  // Every session method is inert unless capture is active (debug builds only).
  private val sessionsAvailable get() = isCaptureActive()

  fun isCaptureActive(): Boolean = NetworkToolsManager.isCaptureActive

  fun startSession(): String =
    if (!sessionsAvailable) "" else SessionRecorder.start()?.toString() ?: ""

  fun stopSession(promise: Promise) {
    if (!sessionsAvailable) return promise.resolve("")
    SessionRecorder.stop { entry -> promise.resolve(entry?.toString() ?: "") }
  }

  fun getActiveSession(): String =
    if (!sessionsAvailable) "" else SessionRecorder.activeSession()?.toString() ?: ""

  fun getActiveSessionSummaries(): String =
    if (!sessionsAvailable) "[]" else SessionRecorder.activeSummaries().toString()

  fun listSessions(promise: Promise) {
    if (!sessionsAvailable) return promise.resolve("[]")
    SessionFileStore.list { promise.resolve(it.toString()) }
  }

  fun getSessionSummaries(sessionId: String, promise: Promise) {
    if (!sessionsAvailable) return promise.resolve("[]")
    SessionFileStore.summaries(sessionId) { promise.resolve(it?.toString() ?: "[]") }
  }

  fun getSessionRequest(sessionId: String, requestId: String, promise: Promise) {
    if (!sessionsAvailable) return promise.resolve("")
    SessionFileStore.request(sessionId, requestId) { promise.resolve(it?.toString() ?: "") }
  }

  fun deleteSession(sessionId: String, promise: Promise) {
    if (!sessionsAvailable) return promise.resolve(null)
    SessionFileStore.delete(sessionId) { promise.resolve(null) }
  }

  fun clearSessions(promise: Promise) {
    if (!sessionsAvailable) return promise.resolve(null)
    SessionFileStore.clear { promise.resolve(null) }
  }
}
