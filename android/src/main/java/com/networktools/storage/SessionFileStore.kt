package com.networktools.storage

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.Executors

/**
 * Owns all writes to the sessions directory. Every operation runs on one
 * background thread, and callbacks are invoked on that thread. Startup
 * housekeeping (schema check, orphan cleanup) runs before the first operation.
 */
object SessionFileStore {
  const val MAX_STORED_SESSIONS = 20

  private val executor = Executors.newSingleThreadExecutor { r ->
    Thread(r, "NetworkTools-sessions")
  }

  @Volatile
  private var appContext: Context? = null
  private var prepared = false

  fun initialize(context: Context) {
    appContext = context.applicationContext
  }

  /**
   * Writes the session file, then adds [entry] (completed with sizeBytes and
   * schemaVersion) to the index and applies retention. Calls back with the
   * stored entry, or null on failure.
   */
  fun save(entry: JSONObject, requests: List<JSONObject>, callback: (JSONObject?) -> Unit) =
    run(callback, null) { context ->
      val dir = SessionFileReader.sessionsDirectory(context)
      if (!dir.isDirectory && !dir.mkdirs()) return@run null

      val bytes = buildString {
        requests.forEach { append(it.toString()).append('\n') }
      }.toByteArray(Charsets.UTF_8)

      val file = SessionFileReader.sessionFile(context, entry.getString("id"))
      val out = file.startWrite()
      try {
        out.write(bytes)
        file.finishWrite(out)
      } catch (e: Exception) {
        file.failWrite(out)
        return@run null
      }

      val stored = JSONObject(entry.toString())
        .put("sizeBytes", bytes.size)
        .put("schemaVersion", SessionFileReader.SCHEMA_VERSION)
      writeIndexApplyingRetention(context, indexSessions(context) + stored)
      stored
    }

  fun list(callback: (JSONArray) -> Unit) = run(callback, JSONArray()) { context ->
    JSONArray(indexSessions(context))
  }

  fun summaries(sessionId: String, callback: (JSONArray?) -> Unit) = run(callback, null) { context ->
    readRequestsDroppingUnreadable(context, sessionId)
      ?.let { requests -> JSONArray(requests.map(SessionFileReader::summary)) }
  }

  fun request(sessionId: String, requestId: String, callback: (JSONObject?) -> Unit) =
    run(callback, null) { context ->
      readRequestsDroppingUnreadable(context, sessionId)?.firstOrNull { it.optString("id") == requestId }
    }

  fun delete(sessionId: String, callback: () -> Unit) = run({ _: Unit -> callback() }, Unit) { context ->
    removeSessions(context, setOf(sessionId))
  }

  fun clear(callback: () -> Unit) = run({ _: Unit -> callback() }, Unit) { context ->
    SessionFileReader.sessionsDirectory(context).deleteRecursively()
    Unit
  }

  private fun <T> run(callback: (T) -> Unit, fallback: T, block: (Context) -> T) {
    executor.execute {
      val context = appContext
      val result = if (context == null) {
        fallback
      } else {
        if (!prepared) {
          prepared = true
          housekeep(context)
        }
        try {
          block(context)
        } catch (e: Exception) {
          android.util.Log.e("NetworkTools", "Session storage operation failed", e)
          fallback
        }
      }
      callback(result)
    }
  }

  // ── Index (executor thread only) ────────────────────────────────────────────

  private fun indexSessions(context: Context): List<JSONObject> {
    val sessions = SessionFileReader.readIndex(context)?.optJSONArray("sessions") ?: return emptyList()
    return (0 until sessions.length()).mapNotNull { sessions.optJSONObject(it) }
  }

  private fun writeIndexApplyingRetention(context: Context, sessions: List<JSONObject>) {
    val sorted = sessions.sortedByDescending { it.optDouble("startTime", 0.0) }
    val kept = sorted.take(MAX_STORED_SESSIONS)

    val dir = SessionFileReader.sessionsDirectory(context)
    if (!dir.isDirectory) dir.mkdirs()
    val index = JSONObject()
      .put("schemaVersion", SessionFileReader.SCHEMA_VERSION)
      .put("sessions", JSONArray(kept))
    val file = SessionFileReader.indexFile(context)
    val out = file.startWrite()
    try {
      out.write(index.toString().toByteArray(Charsets.UTF_8))
      file.finishWrite(out)
    } catch (e: Exception) {
      file.failWrite(out)
    }

    sorted.drop(MAX_STORED_SESSIONS).forEach {
      SessionFileReader.sessionFile(context, it.optString("id")).delete()
    }
  }

  private fun removeSessions(context: Context, ids: Set<String>) {
    writeIndexApplyingRetention(context, indexSessions(context).filter { it.optString("id") !in ids })
    ids.forEach { SessionFileReader.sessionFile(context, it).delete() }
  }

  private fun readRequestsDroppingUnreadable(context: Context, sessionId: String): List<JSONObject>? {
    val requests = SessionFileReader.readRequests(context, sessionId)
    if (requests == null) removeSessions(context, setOf(sessionId))
    return requests
  }

  // ── Housekeeping (executor thread only) ─────────────────────────────────────

  private fun housekeep(context: Context) {
    val dir = SessionFileReader.sessionsDirectory(context)
    if (!dir.exists()) return

    val index = SessionFileReader.readIndex(context)
    if (index == null || index.optInt("schemaVersion", -1) != SessionFileReader.SCHEMA_VERSION) {
      dir.deleteRecursively()
      return
    }

    val all = indexSessions(context)
    val present = all.filter { session ->
      val id = session.optString("id")
      id.isNotEmpty() && SessionFileReader.sessionFile(context, id).baseFile.canRead()
    }
    if (present.size != all.size) writeIndexApplyingRetention(context, present)

    val listed = present.map { it.optString("id") }.toSet()
    dir.listFiles()?.forEach { file ->
      if (file.name.endsWith(".ndjson") && file.name.removeSuffix(".ndjson") !in listed) {
        file.delete()
      }
    }
  }
}
