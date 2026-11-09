package com.networktools.storage

import android.content.Context
import android.util.AtomicFile
import org.json.JSONObject
import java.io.File

/**
 * Stateless reader for the on-disk session format (docs/SESSION_FILE_FORMAT.md).
 * Depends only on the format, so code other than the recorder can use it.
 */
object SessionFileReader {
  const val SCHEMA_VERSION = 1

  private val SUMMARY_KEYS =
    listOf("id", "seq", "method", "url", "responseCode", "duration", "requestTime", "error")

  /** `<noBackupFilesDir>/network-tools/sessions/` */
  fun sessionsDirectory(context: Context): File =
    File(File(context.noBackupFilesDir, "network-tools"), "sessions")

  fun indexFile(context: Context): AtomicFile =
    AtomicFile(File(sessionsDirectory(context), "index.json"))

  fun sessionFile(context: Context, sessionId: String): AtomicFile =
    AtomicFile(File(sessionsDirectory(context), File(sessionId).name + ".ndjson"))

  /** Parsed index.json, or null if it is missing or not valid JSON. */
  fun readIndex(context: Context): JSONObject? = try {
    JSONObject(String(indexFile(context).readFully(), Charsets.UTF_8))
  } catch (e: Exception) {
    null
  }

  /** Request lines in file order. Malformed lines are skipped. Null if the file can't be read. */
  fun readRequests(context: Context, sessionId: String): List<JSONObject>? {
    val text = try {
      String(sessionFile(context, sessionId).readFully(), Charsets.UTF_8)
    } catch (e: Exception) {
      return null
    }
    return text.split('\n').mapNotNull { line ->
      if (line.isEmpty()) null else try {
        JSONObject(line)
      } catch (e: Exception) {
        null
      }
    }
  }

  /** The list-screen fields of a stored request line. */
  fun summary(request: JSONObject): JSONObject {
    val summary = JSONObject()
    SUMMARY_KEYS.forEach { key -> if (request.has(key)) summary.put(key, request.get(key)) }
    return summary
  }
}
