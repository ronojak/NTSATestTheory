package com.drivetheory.cbt.data.user.api

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PUT

data class ProfileDto(val id: String, val email: String, val name: String? = null, val phone: String? = null)
data class UpdateProfileRequest(val name: String? = null, val phone: String? = null)

interface UserApi {
    @GET("api/me/profile")
    suspend fun getProfile(@Header("Authorization") bearer: String): ProfileDto

    @PUT("api/me/profile")
    suspend fun updateProfile(@Header("Authorization") bearer: String, @Body req: UpdateProfileRequest): ProfileDto
}
