package com.networktools

import com.networktools.interceptor.NetworkToolsInterceptor
import okhttp3.OkHttpClient

object NetworkToolsManager {
  @JvmField
  var maxBodyCaptureBytes: Long = 0L

  fun addInterceptor(builder: OkHttpClient.Builder): OkHttpClient.Builder = builder

  fun getInterceptor(): NetworkToolsInterceptor? = null
}
