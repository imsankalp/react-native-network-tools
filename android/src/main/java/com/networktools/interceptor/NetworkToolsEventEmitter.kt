package com.networktools.interceptor

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.networktools.models.NetworkRequest

object NetworkToolsEventEmitter {
  private var reactContext: ReactApplicationContext? = null

  const val EVENT_NETWORK_REQUEST = "NetworkTools:onRequest"

  fun initialize(context: ReactApplicationContext) {
    reactContext = context
  }

  fun emitNetworkRequest(request: NetworkRequest) {
    reactContext?.let { context ->
      if (context.hasActiveReactInstance()) {
        try {
          val params = convertNetworkRequestToWritableMap(request)
          android.util.Log.d("NetworkTools", "Emitting event: $EVENT_NETWORK_REQUEST")
          context
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EVENT_NETWORK_REQUEST, params)
          android.util.Log.d("NetworkTools", "Event emitted successfully")
        } catch (e: Exception) {
          // Handle error silently or log it
          android.util.Log.e("NetworkTools", "Failed to emit event", e)
          e.printStackTrace()
        }
      } else {
        android.util.Log.w("NetworkTools", "No active React instance")
      }
    } ?: android.util.Log.e("NetworkTools", "React context is null")
  }

  private fun convertNetworkRequestToWritableMap(request: NetworkRequest): WritableMap {
    val map = Arguments.createMap()

    map.putString("id", request.id)
    map.putString("url", request.url)
    map.putString("method", request.method)
    map.putDouble("requestTime", request.requestTime.toDouble())

    // Request headers
    val requestHeadersMap = Arguments.createMap()
    request.requestHeaders.forEach { (key, value) ->
      requestHeadersMap.putString(key, value)
    }
    map.putMap("requestHeaders", requestHeadersMap)

    // Request body
    request.requestBody?.let { map.putString("requestBody", it) }

    // Response code
    request.responseCode?.let { map.putInt("responseCode", it) }

    // Response headers
    request.responseHeaders?.let { headers ->
      val responseHeadersMap = Arguments.createMap()
      headers.forEach { (key, value) ->
        responseHeadersMap.putString(key, value)
      }
      map.putMap("responseHeaders", responseHeadersMap)
    }

    // Response body
    request.responseBody?.let { map.putString("responseBody", it) }

    // Response time and duration
    request.responseTime?.let { map.putDouble("responseTime", it.toDouble()) }
    request.duration?.let { map.putDouble("duration", it.toDouble()) }

    // Error
    request.error?.let { map.putString("error", it) }

    return map
  }
}
