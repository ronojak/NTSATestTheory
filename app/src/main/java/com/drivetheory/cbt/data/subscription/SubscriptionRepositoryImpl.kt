package com.drivetheory.cbt.data.subscription

import android.content.Context
import com.drivetheory.cbt.core.common.Result
import com.drivetheory.cbt.core.security.EncryptedPrefs
import com.drivetheory.cbt.core.security.SessionManager
import com.drivetheory.cbt.data.subscription.api.EntitlementsApi
import com.drivetheory.cbt.domain.entities.Subscription
import com.drivetheory.cbt.domain.repository.SubscriptionRepository
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject

class SubscriptionRepositoryImpl @Inject constructor(
    @ApplicationContext private val context: Context,
    private val api: EntitlementsApi,
    private val session: SessionManager
) : SubscriptionRepository {
    private val prefs by lazy { EncryptedPrefs.get(context) }

    private fun bearer(): String? = session.token()?.let { "Bearer $it" }

    override suspend fun refresh(uid: String): Result<Subscription> = try {
        val b = bearer() ?: return Result.Error("Not logged in")
        val dto = api.getEntitlements(b)
        val sub = Subscription(
            status = dto.status,
            planType = dto.plan,
            startDate = null,
            endDate = null,
            expiryDate = dto.expiresAt
        )
        cache(sub)
        Result.Success(sub)
    } catch (e: Exception) {
        Result.Error("Refresh failed", e)
    }

    override suspend fun getCached(): Subscription? {
        val status = prefs.getString(KEY_STATUS, "free") ?: "free"
        val plan = prefs.getString(KEY_PLAN)
        val expiry = prefs.getLong(KEY_EXPIRY, 0L).takeIf { it > 0 }
        return Subscription(status = status, planType = plan, startDate = null, endDate = null, expiryDate = expiry)
    }

    override suspend fun cache(subscription: Subscription) {
        prefs.putString(KEY_STATUS, subscription.status)
        prefs.putString(KEY_PLAN, subscription.planType)
        prefs.putLong(KEY_EXPIRY, subscription.expiryDate ?: 0L)
        prefs.putLong(KEY_LAST_VERIFIED, System.currentTimeMillis())
    }

    companion object {
        private const val KEY_STATUS = "sub_status"
        private const val KEY_PLAN = "sub_plan"
        private const val KEY_EXPIRY = "sub_expiry"
        private const val KEY_LAST_VERIFIED = "sub_last_verified"
    }
}
