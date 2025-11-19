package com.networktools.storage

import com.networktools.models.NetworkRequest
import java.util.concurrent.ConcurrentLinkedQueue


object NetworkRequestStorage {
  private val requests = ConcurrentLinkedQueue<NetworkRequest>()
  private const val MAX_REQUESTS = 100

  /**
   * Add a network request to storage
   * Automatically removes oldest request if limit is exceeded
   */
  fun addRequest(request: NetworkRequest) {
    requests.add(request)
    
    // Remove oldest requests if we exceed the limit
    while (requests.size > MAX_REQUESTS) {
      requests.poll()
    }
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
}
