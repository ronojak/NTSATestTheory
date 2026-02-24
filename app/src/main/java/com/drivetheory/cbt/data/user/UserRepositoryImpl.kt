package com.drivetheory.cbt.data.user

import com.drivetheory.cbt.core.common.Result
import com.drivetheory.cbt.core.security.SessionManager
import com.drivetheory.cbt.data.user.api.UpdateProfileRequest
import com.drivetheory.cbt.data.user.api.UserApi
import com.drivetheory.cbt.domain.entities.UserProfile
import com.drivetheory.cbt.domain.repository.UserRepository
import javax.inject.Inject

class UserRepositoryImpl @Inject constructor(
    private val api: UserApi,
    private val session: SessionManager
) : UserRepository {

    private fun bearer(): String? = session.token()?.let { "Bearer $it" }

    override suspend fun getProfile(uid: String): Result<UserProfile> = try {
        val b = bearer() ?: return Result.Error("Not logged in")
        val p = api.getProfile(b)
        Result.Success(UserProfile(uid = p.id, email = p.email, name = p.name, phone = p.phone))
    } catch (e: Exception) {
        Result.Error("Fetch failed", e)
    }

    override suspend fun upsertProfile(profile: UserProfile): Result<Unit> = try {
        val b = bearer() ?: return Result.Error("Not logged in")
        api.updateProfile(b, UpdateProfileRequest(name = profile.name, phone = profile.phone))
        Result.Success(Unit)
    } catch (e: Exception) {
        Result.Error("Upsert failed", e)
    }

    override suspend fun deleteProfile(uid: String): Result<Unit> {
        // Deleting accounts is not supported in MVP API; keep placeholder.
        return Result.Error("Not supported")
    }
}
