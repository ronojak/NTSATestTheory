package com.drivetheory.cbt.data.billing.api

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Query

data class InitRequest(val plan: String)
data class InitResponse(val checkoutUrl: String?, val reference: String?)
data class VerifyResponse(val success: Boolean)

interface BillingApi {
    @POST("api/paystack/initialize")
    suspend fun initialize(@Header("Authorization") bearer: String, @Body req: InitRequest): InitResponse

    @GET("api/paystack/verify")
    suspend fun verify(@Header("Authorization") bearer: String, @Query("reference") reference: String): VerifyResponse
}
