package com.networktools

import com.networktools.storage.NetworkRequestStorage
import org.json.JSONArray

object NetworkToolsModuleDelegate {
  fun getAllRequests(): String {
    val requests = NetworkRequestStorage.getAllRequests()
    val jsonArray = JSONArray()
    requests.forEach { request ->
      jsonArray.put(request.toJson())
    }
    return jsonArray.toString()
  }

  fun getRequestById(id: String): String {
    val request = NetworkRequestStorage.getRequestById(id)
    return request?.toJson()?.toString() ?: "{}"
  }

  fun clearAllRequests() {
    NetworkRequestStorage.clearAll()
  }

  fun getRequestCount(): Double {
    return NetworkRequestStorage.getCount().toDouble()
  }
}
