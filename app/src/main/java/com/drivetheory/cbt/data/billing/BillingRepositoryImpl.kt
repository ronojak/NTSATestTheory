package com.drivetheory.cbt.data.billing

import com.drivetheory.cbt.core.common.Result
import com.drivetheory.cbt.core.security.SessionManager
import com.drivetheory.cbt.data.billing.api.BillingApi
import com.drivetheory.cbt.data.billing.api.InitRequest
import com.drivetheory.cbt.domain.repository.BillingRepository
import javax.inject.Inject

class BillingRepositoryImpl @Inject constructor(
    private val api: BillingApi,
    private val session: SessionManager
) : BillingRepository {

    private fun bearer(): String? = session.token()?.let { "Bearer $it" }

    override suspend fun initializePayment(uid: String, plan: String): Result<BillingRepository.PaymentInit> {
        return try {
            val b = bearer() ?: return Result.Error("Not logged in")
            val resp = api.initialize(b, InitRequest(plan))
            if ((resp.checkoutUrl ?: resp.reference) != null) {
                Result.Success(BillingRepository.PaymentInit(resp.checkoutUrl, resp.reference))
            } else {
                Result.Error("Empty response")
            }
        } catch (e: Exception) {
            Result.Error("Initialize failed", e)
        }
    }
    override suspend fun verifyPayment(reference: String): Result<Boolean> {
        return try {
            val b = bearer() ?: return Result.Error("Not logged in")
            val resp = api.verify(b, reference)
            Result.Success(resp.success)
        } catch (e: Exception) {
            Result.Error("Verify failed", e)
        }
    }
}
