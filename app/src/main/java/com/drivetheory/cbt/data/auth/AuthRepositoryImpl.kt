package com.drivetheory.cbt.data.auth

import com.drivetheory.cbt.core.common.Result
import com.drivetheory.cbt.core.security.SessionManager
import com.drivetheory.cbt.data.auth.api.AuthApi
import com.drivetheory.cbt.data.auth.api.LoginRequest
import com.drivetheory.cbt.data.auth.api.RegisterRequest
import com.drivetheory.cbt.data.auth.api.ResetPasswordRequest
import com.drivetheory.cbt.domain.entities.UserProfile
import com.drivetheory.cbt.domain.repository.AuthRepository
import javax.inject.Inject

class AuthRepositoryImpl @Inject constructor(
    private val api: AuthApi,
    private val session: SessionManager
) : AuthRepository {

    override suspend fun register(email: String, password: String, name: String?, phone: String?): Result<UserProfile> = try {
        val res = api.register(RegisterRequest(email = email, password = password, name = name, phone = phone))
        session.save(res.token, res.user.id, res.user.email)
        Result.Success(UserProfile(uid = res.user.id, email = res.user.email, name = res.user.name, phone = res.user.phone))
    } catch (e: Exception) {
        Result.Error("Register failed", e)
    }

    override suspend fun login(email: String, password: String): Result<UserProfile> = try {
        val res = api.login(LoginRequest(email = email, password = password))
        session.save(res.token, res.user.id, res.user.email)
        Result.Success(UserProfile(uid = res.user.id, email = res.user.email, name = res.user.name, phone = res.user.phone))
    } catch (e: Exception) {
        Result.Error("Login failed", e)
    }

    override suspend fun logout(): Result<Unit> = try {
        session.clear()
        Result.Success(Unit)
    } catch (e: Exception) {
        Result.Error("Logout failed", e)
    }

    override suspend fun resetPassword(email: String): Result<Unit> = try {
        api.resetPassword(ResetPasswordRequest(email))
        Result.Success(Unit)
    } catch (e: Exception) {
        Result.Error("Reset failed", e)
    }

    override fun currentUser(): UserProfile? {
        val uid = session.userId() ?: return null
        val email = session.email() ?: ""
        return UserProfile(uid = uid, email = email)
    }
}
