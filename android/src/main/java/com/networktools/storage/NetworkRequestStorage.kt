package com.networktools.storage

import com.networktools.models.NetworkRequest
import java.util.concurrent.ConcurrentLinkedQueue


object NetworkRequestStorage {
  private const val DEFAULT_MAX_REQUESTS = 1000

  private val requests = ConcurrentLinkedQueue<NetworkRequest>()

  @Volatile
  var maxRequests: Int = DEFAULT_MAX_REQUESTS
    set(value) {
      field = value.coerceAtLeast(1)
      trim()
    }

  /**
   * Add a network request to storage
   * Automatically removes oldest request if limit is exceeded
   */
  fun addRequest(request: NetworkRequest) {
    requests.add(request)
    trim()
  }

  /**
   * Get all stored network requests
   */
  fun getAllRequests(): List<NetworkRequest> {
    return requests.toList()
  }

  /**
   * Get a specific request by ID
   */
  fun getRequestById(id: String): NetworkRequest? {
    return requests.find { it.id == id }
  }

  /**
   * Clear all stored requests
   */
  fun clearAll() {
    requests.clear()
  }

  /**
   * Get the count of stored requests
   */
  fun getCount(): Int {
    return requests.size
  }

  private fun trim() {
    while (requests.size > maxRequests) {
      requests.poll()
    }
  }
}
