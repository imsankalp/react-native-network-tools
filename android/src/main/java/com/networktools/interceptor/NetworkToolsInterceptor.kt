package com.networktools.interceptor

import com.networktools.NetworkToolsManager
import com.networktools.models.NetworkRequest
import com.networktools.session.SessionRecorder
import com.networktools.storage.NetworkRequestStorage
import okhttp3.Headers
import okhttp3.Interceptor
import okhttp3.Request
import okhttp3.Response
import okio.Buffer
import java.io.IOException
import java.nio.ByteBuffer
import java.nio.charset.CharacterCodingException
import java.nio.charset.CodingErrorAction
import java.util.UUID

/**
 * OkHttp Interceptor that captures all network requests and responses
 * This interceptor should only be added in debug builds
 */
class NetworkToolsInterceptor : Interceptor {

  private data class CapturedHeaders(val headers: Map<String, String>, val redacted: List<String>)

  private data class CapturedBody(
    val body: String?,
    val truncated: Boolean,
    val encoding: String,
    val contentType: String?
  )

  private val binaryContentTypePrefixes = listOf(
    "image/", "video/", "audio/", "application/octet-stream", "application/zip",
    "application/pdf", "application/x-", "font/"
  )

  @Throws(IOException::class)
  override fun intercept(chain: Interceptor.Chain): Response {
    val request = chain.request()
    val requestId = UUID.randomUUID().toString()
    val requestTime = System.currentTimeMillis()

    val requestHeaders = captureHeaders(request.headers)
    val requestBody = captureRequestBody(request)

    try {
      val response = chain.proceed(request)
      val responseTime = System.currentTimeMillis()

      val responseHeaders = captureHeaders(response.headers)
      val responseBody = captureResponseBody(response)

      record(
        NetworkRequest(
          id = requestId,
          url = request.url.toString(),
          method = request.method,
          requestHeaders = requestHeaders.headers,
          requestBody = requestBody.body,
          requestTime = requestTime,
          responseCode = response.code,
          responseHeaders = responseHeaders.headers,
          responseBody = responseBody.body,
          responseTime = responseTime,
          duration = responseTime - requestTime,
          error = null,
          requestBodyTruncated = requestBody.truncated,
          responseBodyTruncated = responseBody.truncated,
          requestBodyEncoding = requestBody.encoding,
          responseBodyEncoding = responseBody.encoding,
          requestContentType = requestBody.contentType,
          responseContentType = responseBody.contentType,
          redactedRequestHeaders = requestHeaders.redacted,
          redactedResponseHeaders = responseHeaders.redacted
        )
      )

      return response
    } catch (e: Exception) {
      val responseTime = System.currentTimeMillis()

      record(
        NetworkRequest(
          id = requestId,
          url = request.url.toString(),
          method = request.method,
          requestHeaders = requestHeaders.headers,
          requestBody = requestBody.body,
          requestTime = requestTime,
          responseCode = null,
          responseHeaders = null,
          responseBody = null,
          responseTime = responseTime,
          duration = responseTime - requestTime,
          error = e.message ?: "Unknown error",
          requestBodyTruncated = requestBody.truncated,
          requestBodyEncoding = requestBody.encoding,
          requestContentType = requestBody.contentType,
          redactedRequestHeaders = requestHeaders.redacted
        )
      )

      throw e
    }
  }

  private fun record(networkRequest: NetworkRequest) {
    NetworkRequestStorage.addRequest(networkRequest)
    NetworkToolsEventEmitter.emitNetworkRequest(networkRequest)
    SessionRecorder.record(networkRequest)
  }

  private fun captureHeaders(source: Headers): CapturedHeaders {
    val redact = NetworkToolsManager.redactHeaders
    val headers = mutableMapOf<String, String>()
    val redacted = mutableListOf<String>()
    source.forEach { pair ->
      if (pair.first.lowercase() in redact) {
        headers[pair.first] = "[redacted]"
        if (pair.first !in redacted) redacted.add(pair.first)
      } else {
        headers[pair.first] = pair.second
      }
    }
    return CapturedHeaders(headers, redacted)
  }

  private fun captureRequestBody(request: Request): CapturedBody {
    val contentType = (request.body?.contentType()?.toString() ?: request.header("Content-Type"))
      ?.ifEmpty { null }
    val body = request.body ?: return CapturedBody(null, false, NetworkRequest.ENCODING_UTF8, contentType)
    if (isBinaryContentType(contentType)) {
      return CapturedBody("", false, NetworkRequest.ENCODING_OMITTED, contentType)
    }
    return try {
      val buffer = Buffer()
      body.writeTo(buffer)
      captureBytes(buffer.readByteArray(), contentType)
    } catch (e: Exception) {
      CapturedBody(null, false, NetworkRequest.ENCODING_OMITTED, contentType)
    }
  }

  private fun captureResponseBody(response: Response): CapturedBody {
    val contentType = (response.body?.contentType()?.toString() ?: response.header("Content-Type"))
      ?.ifEmpty { null }
    if (isBinaryContentType(contentType)) {
      return CapturedBody("", false, NetworkRequest.ENCODING_OMITTED, contentType)
    }
    return try {
      val source = response.body?.source()
        ?: return CapturedBody(null, false, NetworkRequest.ENCODING_UTF8, contentType)
      val limit = NetworkToolsManager.maxBodyCaptureBytes
      // Request one extra byte so we can detect truncation without consuming it
      source.request(limit + 1)
      val buffer = source.buffer
      val available = minOf(buffer.size, limit + 1).toInt()
      captureBytes(buffer.snapshot().substring(0, available).toByteArray(), contentType)
    } catch (e: Exception) {
      CapturedBody(null, false, NetworkRequest.ENCODING_OMITTED, contentType)
    }
  }

  /** [bytes] may hold more than the limit; anything past it marks the body truncated. */
  private fun captureBytes(bytes: ByteArray, contentType: String?): CapturedBody {
    val limit = NetworkToolsManager.maxBodyCaptureBytes.coerceAtLeast(0L)
    val truncated = bytes.size > limit
    val capped = if (truncated) bytes.copyOf(limit.toInt()) else bytes
    if (capped.isEmpty()) {
      return CapturedBody("", truncated, NetworkRequest.ENCODING_UTF8, contentType)
    }
    val decoded = if (isBinaryContentType(contentType)) null else decodeUtf8(capped, truncated)
    return if (decoded != null) {
      CapturedBody(decoded, truncated, NetworkRequest.ENCODING_UTF8, contentType)
    } else {
      CapturedBody("", truncated, NetworkRequest.ENCODING_OMITTED, contentType)
    }
  }

  // A cut at the capture limit can split a multi-byte character; drop up to 3
  // trailing bytes so the rest still decodes.
  private fun decodeUtf8(bytes: ByteArray, allowTrailingTrim: Boolean): String? {
    val maxTrim = if (allowTrailingTrim) minOf(3, bytes.size) else 0
    for (trim in 0..maxTrim) {
      try {
        return Charsets.UTF_8.newDecoder()
          .onMalformedInput(CodingErrorAction.REPORT)
          .onUnmappableCharacter(CodingErrorAction.REPORT)
          .decode(ByteBuffer.wrap(bytes, 0, bytes.size - trim))
          .toString()
      } catch (e: CharacterCodingException) {
        // try a shorter slice
      }
    }
    return null
  }

  private fun isBinaryContentType(contentType: String?): Boolean {
    val type = contentType?.lowercase() ?: return false
    return binaryContentTypePrefixes.any { type.startsWith(it) }
  }
}
