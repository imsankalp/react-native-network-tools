package com.networktools.interceptor

import com.networktools.NetworkToolsManager
import com.networktools.models.NetworkRequest
import com.networktools.storage.NetworkRequestStorage
import okhttp3.Interceptor
import okhttp3.Request
import okhttp3.Response
import okio.Buffer
import java.io.IOException
import java.util.UUID

/**
 * OkHttp Interceptor that captures all network requests and responses
 * This interceptor should only be added in debug builds
 */
class NetworkToolsInterceptor : Interceptor {

  private val binaryContentTypePrefixes = listOf(
    "image/", "video/", "audio/", "application/octet-stream", "application/zip",
    "application/pdf", "application/x-", "font/"
  )

  @Throws(IOException::class)
  override fun intercept(chain: Interceptor.Chain): Response {
    val request = chain.request()
    val requestId = UUID.randomUUID().toString()
    val requestTime = System.currentTimeMillis()

    val requestHeaders = captureHeaders(request)
    val requestBody = captureRequestBody(request)

    var response: Response? = null
    var error: String? = null
    var responseTime: Long? = null
    var duration: Long? = null

    try {
      response = chain.proceed(request)
      responseTime = System.currentTimeMillis()
      duration = responseTime - requestTime

      val responseHeaders = captureResponseHeaders(response)
      val responseBody = captureResponseBody(response)

      val networkRequest = NetworkRequest(
        id = requestId,
        url = request.url.toString(),
        method = request.method,
        requestHeaders = requestHeaders,
        requestBody = requestBody,
        requestTime = requestTime,
        responseCode = response.code,
        responseHeaders = responseHeaders,
        responseBody = responseBody,
        responseTime = responseTime,
        duration = duration,
        error = null
      )

      NetworkRequestStorage.addRequest(networkRequest)
      NetworkToolsEventEmitter.emitNetworkRequest(networkRequest)

      return response
    } catch (e: Exception) {
      error = e.message ?: "Unknown error"
      responseTime = System.currentTimeMillis()
      duration = responseTime - requestTime

      val networkRequest = NetworkRequest(
        id = requestId,
        url = request.url.toString(),
        method = request.method,
        requestHeaders = requestHeaders,
        requestBody = requestBody,
        requestTime = requestTime,
        responseCode = null,
        responseHeaders = null,
        responseBody = null,
        responseTime = responseTime,
        duration = duration,
        error = error
      )

      NetworkRequestStorage.addRequest(networkRequest)
      NetworkToolsEventEmitter.emitNetworkRequest(networkRequest)

      throw e
    }
  }

  private fun captureHeaders(request: Request): Map<String, String> {
    val headers = mutableMapOf<String, String>()
    request.headers.forEach { pair ->
      headers[pair.first] = pair.second
    }
    return headers
  }

  private fun captureRequestBody(request: Request): String? {
    return try {
      val contentType = request.body?.contentType()?.toString().orEmpty()
      if (isBinaryContentType(contentType)) return "[binary content — not captured]"

      val limit = NetworkToolsManager.maxBodyCaptureBytes
      val buffer = Buffer()
      request.body?.writeTo(buffer)
      val totalSize = buffer.size
      val isTruncated = totalSize > limit
      val body = buffer.readUtf8(minOf(totalSize, limit))
      if (isTruncated) "$body\n[... truncated — $totalSize bytes total]" else body
    } catch (e: Exception) {
      null
    }
  }

  private fun captureResponseHeaders(response: Response): Map<String, String> {
    val headers = mutableMapOf<String, String>()
    response.headers.forEach { pair ->
      headers[pair.first] = pair.second
    }
    return headers
  }

  private fun captureResponseBody(response: Response): String? {
    return try {
      val contentType = response.body?.contentType()?.toString().orEmpty()
      if (isBinaryContentType(contentType)) return "[binary content — not captured]"

      val source = response.body?.source() ?: return null
      val limit = NetworkToolsManager.maxBodyCaptureBytes
      // Request one extra byte so we can detect truncation without consuming it
      source.request(limit + 1)
      val buffer = source.buffer
      val isTruncated = buffer.size > limit
      val capturedBytes = minOf(buffer.size, limit).toInt()
      val body = buffer.snapshot().substring(0, capturedBytes).utf8()
      if (isTruncated) "$body\n[... truncated]" else body
    } catch (e: Exception) {
      null
    }
  }

  private fun isBinaryContentType(contentType: String): Boolean =
    binaryContentTypePrefixes.any { contentType.startsWith(it) }
}
