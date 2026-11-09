package com.networktools.models

import org.json.JSONArray
import org.json.JSONObject

/**
 * Data class representing a captured network request
 */
data class  NetworkRequest(
  val id: String,
  val url: String,
  val method: String,
  val requestHeaders: Map<String, String>,
  val requestBody: String?,
  val requestTime: Long,
  val responseCode: Int?,
  val responseHeaders: Map<String, String>?,
  val responseBody: String?,
  val responseTime: Long?,
  val duration: Long?,
  val error: String?,
  val requestBodyTruncated: Boolean = false,
  val responseBodyTruncated: Boolean = false,
  val requestBodyEncoding: String = ENCODING_UTF8,
  val responseBodyEncoding: String = ENCODING_UTF8,
  val requestContentType: String? = null,
  val responseContentType: String? = null,
  val redactedRequestHeaders: List<String> = emptyList(),
  val redactedResponseHeaders: List<String> = emptyList()
) {
  fun toJson(): JSONObject {
    return JSONObject().apply {
      put("id", id)
      put("url", url)
      put("method", method)
      put("requestHeaders", JSONObject(requestHeaders))
      put("requestBody", requestBody ?: "")
      put("requestTime", requestTime)
      put("responseCode", responseCode ?: 0)
      put("responseHeaders", responseHeaders?.let { JSONObject(it) } ?: JSONObject())
      put("responseBody", responseBody ?: "")
      put("responseTime", responseTime ?: 0)
      put("duration", duration ?: 0)
      put("error", error ?: "")
      put("requestBodyTruncated", requestBodyTruncated)
      put("responseBodyTruncated", responseBodyTruncated)
      put("requestBodyEncoding", requestBodyEncoding)
      put("responseBodyEncoding", responseBodyEncoding)
      requestContentType?.let { put("requestContentType", it) }
      responseContentType?.let { put("responseContentType", it) }
      put("redactedRequestHeaders", JSONArray(redactedRequestHeaders))
      put("redactedResponseHeaders", JSONArray(redactedResponseHeaders))
    }
  }

  companion object {
    const val ENCODING_UTF8 = "utf8"
    const val ENCODING_OMITTED = "omitted"

    fun fromJson(json: JSONObject): NetworkRequest {
      return NetworkRequest(
        id = json.getString("id"),
        url = json.getString("url"),
        method = json.getString("method"),
        requestHeaders = json.getJSONObject("requestHeaders").toMap(),
        requestBody = json.optString("requestBody", null),
        requestTime = json.getLong("requestTime"),
        responseCode = json.optInt("responseCode", 0).takeIf { it != 0 },
        responseHeaders = json.optJSONObject("responseHeaders")?.toMap(),
        responseBody = json.optString("responseBody", null),
        responseTime = json.optLong("responseTime", 0).takeIf { it != 0L },
        duration = json.optLong("duration", 0).takeIf { it != 0L },
        error = json.optString("error", null),
        requestBodyTruncated = json.optBoolean("requestBodyTruncated", false),
        responseBodyTruncated = json.optBoolean("responseBodyTruncated", false),
        requestBodyEncoding = json.optString("requestBodyEncoding", ENCODING_UTF8),
        responseBodyEncoding = json.optString("responseBodyEncoding", ENCODING_UTF8),
        requestContentType = json.optString("requestContentType", "").ifEmpty { null },
        responseContentType = json.optString("responseContentType", "").ifEmpty { null },
        redactedRequestHeaders = json.optJSONArray("redactedRequestHeaders").toStringList(),
        redactedResponseHeaders = json.optJSONArray("redactedResponseHeaders").toStringList()
      )
    }

    private fun JSONObject.toMap(): Map<String, String> {
      val map = mutableMapOf<String, String>()
      keys().forEach { key ->
        map[key] = getString(key)
      }
      return map
    }

    private fun JSONArray?.toStringList(): List<String> {
      if (this == null) return emptyList()
      return (0 until length()).map { getString(it) }
    }
  }
}
