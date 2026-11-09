package com.networktools.interceptor

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.networktools.models.NetworkRequest
import org.json.JSONArray
import org.json.JSONObject

object NetworkToolsEventEmitter {
  private var reactContext: ReactApplicationContext? = null

  const val EVENT_NETWORK_REQUEST = "NetworkTools:onRequest"
  const val EVENT_SESSION_CHANGE = "NetworkTools:onSessionChange"

  fun initialize(context: ReactApplicationContext) {
    reactContext = context
  }

  fun emitJson(eventName: String, body: JSONObject) {
    val context = reactContext ?: return
    if (!context.hasActiveReactInstance()) return
    try {
      context
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(eventName, jsonToMap(body))
    } catch (e: Exception) {
      android.util.Log.e("NetworkTools", "Failed to emit $eventName", e)
    }
  }

  private fun jsonToMap(json: JSONObject): WritableMap {
    val map = Arguments.createMap()
    json.keys().forEach { key ->
      when (val value = json.get(key)) {
        JSONObject.NULL -> map.putNull(key)
        is JSONObject -> map.putMap(key, jsonToMap(value))
        is JSONArray -> map.putArray(key, jsonToArray(value))
        is Boolean -> map.putBoolean(key, value)
        is Int -> map.putInt(key, value)
        is Number -> map.putDouble(key, value.toDouble())
        else -> map.putString(key, value.toString())
      }
    }
    return map
  }

  private fun jsonToArray(json: JSONArray): WritableArray {
    val array = Arguments.createArray()
    for (i in 0 until json.length()) {
      when (val value = json.get(i)) {
        JSONObject.NULL -> array.pushNull()
        is JSONObject -> array.pushMap(jsonToMap(value))
        is JSONArray -> array.pushArray(jsonToArray(value))
        is Boolean -> array.pushBoolean(value)
        is Int -> array.pushInt(value)
        is Number -> array.pushDouble(value.toDouble())
        else -> array.pushString(value.toString())
      }
    }
    return array
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

    map.putBoolean("requestBodyTruncated", request.requestBodyTruncated)
    map.putBoolean("responseBodyTruncated", request.responseBodyTruncated)
    map.putString("requestBodyEncoding", request.requestBodyEncoding)
    map.putString("responseBodyEncoding", request.responseBodyEncoding)
    request.requestContentType?.let { map.putString("requestContentType", it) }
    request.responseContentType?.let { map.putString("responseContentType", it) }
    map.putArray("redactedRequestHeaders", Arguments.fromList(request.redactedRequestHeaders))
    map.putArray("redactedResponseHeaders", Arguments.fromList(request.redactedResponseHeaders))

    return map
  }
}
