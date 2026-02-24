package com.drivetheory.cbt.data.subscription.api

import retrofit2.http.GET
import retrofit2.http.Header

data class EntitlementsDto(val status: String, val plan: String? = null, val expiresAt: Long? = null)

interface EntitlementsApi {
    @GET("api/me/entitlements")
    suspend fun getEntitlements(@Header("Authorization") bearer: String): EntitlementsDto
}
