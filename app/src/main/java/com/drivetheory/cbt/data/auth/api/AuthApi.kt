package com.drivetheory.cbt.data.auth.api

import retrofit2.http.Body
import retrofit2.http.POST

data class RegisterRequest(val email: String, val password: String, val name: String? = null, val phone: String? = null)
data class LoginRequest(val email: String, val password: String)
data class ResetPasswordRequest(val email: String)

data class AuthUserDto(val id: String, val email: String, val name: String? = null, val phone: String? = null)
data class AuthResponse(val token: String, val user: AuthUserDto)
data class ResetPasswordResponse(val ok: Boolean, val resetToken: String? = null)

interface AuthApi {
    @POST("api/auth/register")
    suspend fun register(@Body req: RegisterRequest): AuthResponse

    @POST("api/auth/login")
    suspend fun login(@Body req: LoginRequest): AuthResponse

    @POST("api/auth/reset-password")
    suspend fun resetPassword(@Body req: ResetPasswordRequest): ResetPasswordResponse
}
