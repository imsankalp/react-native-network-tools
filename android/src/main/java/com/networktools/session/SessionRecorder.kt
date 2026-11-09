package com.networktools.session

import android.content.Context
import android.os.Build
import com.networktools.BuildConfig
import com.networktools.NetworkToolsManager
import com.networktools.interceptor.NetworkToolsEventEmitter
import com.networktools.models.NetworkRequest
import com.networktools.storage.NetworkRequestStorage
import com.networktools.storage.SessionFileReader
import com.networktools.storage.SessionFileStore
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

/**
 * Holds the one active recording session in native memory, so it survives
 * JS reloads. Fed by the interceptor with every completed request.
 */
object SessionRecorder {
  private val lock = Any()

  private var sessionId: String? = null
  private var name = ""
  private var startTime = 0L
  private var requests = mutableListOf<JSONObject>()
  private var limitReached = false

  @Volatile
  private var appContext: Context? = null

  fun initialize(context: Context) {
    appContext = context.applicationContext
  }

  /** Starts a recording. Null if one is already active or capture isn't active. */
  fun start(): JSONObject? {
    if (!NetworkToolsManager.isCaptureActive) return null
    val active = synchronized(lock) {
      if (sessionId != null) return null
      val now = Date()
      sessionId = UUID.randomUUID().toString()
      name = "api-recording-" + SimpleDateFormat("yyyy-MM-dd'T'HH-mm-ss", Locale.US).format(now)
      startTime = now.time
      requests = mutableListOf()
      limitReached = false
      activeLocked()
    }
    emit("started", active, null)
    return active
  }

  /** Stops and saves the recording. Calls back with the stored index entry, or null if nothing was recording. */
  fun stop(callback: (JSONObject?) -> Unit) {
    val (entry, lines) = synchronized(lock) {
      val id = sessionId ?: return callback(null)
      val entry = JSONObject()
        .put("id", id)
        .put("name", name)
        .put("status", "stopped")
        .put("startTime", startTime)
        .put("endTime", System.currentTimeMillis())
        .put("requestCount", requests.size)
        .put("limitReached", limitReached)
        .put("platform", "android")
        .put("appId", appContext?.packageName ?: "")
        .put("appVersion", appVersion())
        .put("libraryVersion", BuildConfig.NETWORK_TOOLS_VERSION)
      val lines = requests
      sessionId = null
      requests = mutableListOf()
      limitReached = false
      entry to lines
    }
    emit("stopped", null, null)
    SessionFileStore.save(entry, lines, callback)
  }

  /** Adds the request to the active session if it started after recording began. */
  fun record(request: NetworkRequest) {
    var firstLimitHit = false
    var line: JSONObject? = null
    val active = synchronized(lock) {
      if (sessionId == null || request.requestTime < startTime) return
      if (requests.size >= NetworkRequestStorage.maxRequests) {
        firstLimitHit = !limitReached
        limitReached = true
      } else {
        line = request.toJson().put("seq", requests.size + 1).also { requests.add(it) }
      }
      activeLocked()
    }
    val added = line
    when {
      added != null -> emit("request", active, SessionFileReader.summary(added))
      firstLimitHit -> emit("limitReached", active, null)
    }
  }

  /** Active session JSON object, or null. */
  fun activeSession(): JSONObject? = synchronized(lock) { activeLocked() }

  /** Summaries of the active session's requests in capture order. */
  fun activeSummaries(): JSONArray {
    val snapshot = synchronized(lock) { requests.toList() }
    return JSONArray(snapshot.map(SessionFileReader::summary))
  }

  private fun activeLocked(): JSONObject? {
    val id = sessionId ?: return null
    return JSONObject()
      .put("id", id)
      .put("name", name)
      .put("status", "recording")
      .put("startTime", startTime)
      .put("requestCount", requests.size)
      .put("limitReached", limitReached)
  }

  private fun emit(type: String, active: JSONObject?, added: JSONObject?) {
    val body = JSONObject()
      .put("type", type)
      .put("activeSession", active ?: JSONObject.NULL)
    added?.let { body.put("addedRequest", it) }
    NetworkToolsEventEmitter.emitJson(NetworkToolsEventEmitter.EVENT_SESSION_CHANGE, body)
  }

  private fun appVersion(): String {
    val context = appContext ?: return ""
    return try {
      val info = if (Build.VERSION.SDK_INT >= 33) {
        context.packageManager.getPackageInfo(
          context.packageName,
          android.content.pm.PackageManager.PackageInfoFlags.of(0)
        )
      } else {
        @Suppress("DEPRECATION")
        context.packageManager.getPackageInfo(context.packageName, 0)
      }
      info.versionName ?: ""
    } catch (e: Exception) {
      ""
    }
  }
}
