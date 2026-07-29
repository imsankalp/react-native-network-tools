package com.networktools

import com.networktools.interceptor.NetworkToolsInterceptor
import okhttp3.OkHttpClient

/**
 * Manager class for NetworkTools
 * Provides methods to configure OkHttpClient with network tracking
 */
object NetworkToolsManager {
  private val interceptor = NetworkToolsInterceptor()

  /** Maximum bytes captured per request/response body. Default: 256 KB. */
  @JvmField
  var maxBodyCaptureBytes: Long = 256 * 1024L

  /** Header names (case-insensitive) whose values are replaced with "[redacted]". */
  @Volatile
  var redactHeaders: Set<String> = emptySet()

  /**
   * Add the NetworkTools interceptor to an OkHttpClient.Builder
   * This method should be called when configuring your OkHttpClient
   *
   * Example usage:
   * ```
   * val client = OkHttpClient.Builder()
   *   .apply { NetworkToolsManager.addInterceptor(this) }
   *   .build()
   * ```
   */
  fun addInterceptor(builder: OkHttpClient.Builder): OkHttpClient.Builder {
    if (BuildConfig.NETWORK_TOOLS_ENABLED) {
      builder.addInterceptor(interceptor)
    }
    return builder
  }

  /**
   * Get the interceptor instance
   * Use this if you need to manually add the interceptor
   */
  fun getInterceptor(): NetworkToolsInterceptor? {
    return if (BuildConfig.NETWORK_TOOLS_ENABLED) interceptor else null
  }
}
