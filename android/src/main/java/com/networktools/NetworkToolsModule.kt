package com.networktools

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.networktools.interceptor.NetworkToolsEventEmitter
import com.networktools.storage.NetworkRequestStorage
import org.json.JSONArray

@ReactModule(name = NetworkToolsModule.NAME)
class NetworkToolsModule(reactContext: ReactApplicationContext) :
  NativeNetworkToolsSpec(reactContext) {

  init {
    // Initialize the event emitter with the React context
    NetworkToolsEventEmitter.initialize(reactContext)
  }

  // IMPORTANT: Add this method to support event emission
  override fun canOverrideExistingModule(): Boolean {
    return true
  }


  override fun getName(): String {
    return NAME
  }

  override fun enable() {
    NetworkToolsManager.enable()
  }

  override fun disable() {
    NetworkToolsManager.disable()
  }

  override fun isEnabled(): Boolean {
    return NetworkToolsManager.isEnabled()
  }

  override fun getAllRequests(): String {
    val requests = NetworkRequestStorage.getAllRequests()
    val jsonArray = JSONArray()
    requests.forEach { request ->
      jsonArray.put(request.toJson())
    }
    return jsonArray.toString()
  }

  override fun getRequestById(id: String): String {
    val request = NetworkRequestStorage.getRequestById(id)
    return request?.toJson()?.toString() ?: "{}"
  }

  override fun clearAllRequests() {
    NetworkRequestStorage.clearAll()
  }

  override fun getRequestCount(): Double {
    return NetworkRequestStorage.getCount().toDouble()
  }

  override fun addListener(eventType: String?) {

  }

  override fun removeListeners(count: Double) {

  }

  companion object {
    const val NAME = "NetworkTools"
  }
}
