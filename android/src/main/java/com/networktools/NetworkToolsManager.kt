package com.networktools

import com.networktools.interceptor.NetworkToolsInterceptor
import okhttp3.OkHttpClient

/**
 * Manager class for NetworkTools
 * Provides methods to configure OkHttpClient with network tracking
 */
object NetworkToolsManager {
  private var isEnabled = false
  private val interceptor = NetworkToolsInterceptor()

  /**
   * Enable network tracking
   * This should be called during app initialization
   */
  fun enable() {
    if (BuildConfig.NETWORK_TOOLS_ENABLED) {
      isEnabled = true
    }
  }

  /**
   * Disable network tracking
   */
  fun disable() {
    isEnabled = false
  }

  /**
   * Check if network tracking is enabled
   */
  fun isEnabled(): Boolean {
    return isEnabled && BuildConfig.NETWORK_TOOLS_ENABLED
  }

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
    if (isEnabled()) {
      builder.addInterceptor(interceptor)
    }
    return builder
  }

  /**
   * Get the interceptor instance
   * Use this if you need to manually add the interceptor
   */
  fun getInterceptor(): NetworkToolsInterceptor? {
    return if (isEnabled()) interceptor else null
  }
}
