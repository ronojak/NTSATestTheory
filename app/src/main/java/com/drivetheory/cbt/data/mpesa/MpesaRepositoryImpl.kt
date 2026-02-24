package com.drivetheory.cbt.data.mpesa

import com.drivetheory.cbt.core.common.Result
import com.drivetheory.cbt.core.security.SessionManager
import com.drivetheory.cbt.data.mpesa.api.MpesaApi
import com.drivetheory.cbt.data.mpesa.api.StkPushRequest
import com.drivetheory.cbt.domain.repository.MpesaRepository
import javax.inject.Inject

class MpesaRepositoryImpl @Inject constructor(
    private val api: MpesaApi,
    private val session: SessionManager
) : MpesaRepository {

    private fun bearer(): String? = session.token()?.let { "Bearer $it" }

    override suspend fun initiate(uid: String, phoneNumber: String, planId: String): Result<MpesaRepository.StkInit> {
        return try {
            val b = bearer() ?: return Result.Error("Not logged in")
            val amount = planAmountKES(planId)
            val resp = api.stkPush(b, StkPushRequest(phoneNumber = phoneNumber, planId = planId, amount = amount))
            Result.Success(MpesaRepository.StkInit(resp.serverPaymentId, resp.merchantRequestId, resp.checkoutRequestId, resp.status))
        } catch (e: Exception) {
            Result.Error("STK Push failed", e)
        }
    }
    override suspend fun status(paymentId: String): Result<MpesaRepository.PaymentStatus> {
        return try {
            val b = bearer() ?: return Result.Error("Not logged in")
            val resp = api.status(b, paymentId)
            Result.Success(
                MpesaRepository.PaymentStatus(
                paymentId = resp.paymentId,
                status = resp.status,
                planId = resp.planId,
                amount = resp.amount,
                checkoutRequestId = resp.checkoutRequestId,
                merchantRequestId = resp.merchantRequestId,
                resultCode = resp.resultCode,
                resultDesc = resp.resultDesc,
                mpesaReceipt = resp.mpesaReceipt,
                updatedAt = resp.updatedAt
                )
            )
        } catch (e: Exception) {
            Result.Error("Status failed", e)
        }
    }
    override suspend fun entitlements(uid: String): Result<MpesaRepository.Entitlement> {
        // Entitlements moved to SubscriptionRepository on new backend.
        return Result.Error("Use SubscriptionRepository.refresh()")
    }

    override suspend fun submitManualReceipt(uid: String, receipt: String, planId: String, phoneNumber: String?): Result<Boolean> {
        return try {
            val b = bearer() ?: return Result.Error("Not logged in")
            val amount = planAmountKES(planId)
            val resp = api.manualReceipt(
            b,
            MpesaApi.ManualReceiptRequest(
                receipt = receipt.trim(),
                planId = planId,
                phoneNumber = phoneNumber,
                amount = amount
            )
            )
            Result.Success(resp.status == "PAID")
        } catch (e: Exception) {
            Result.Error("Receipt submission failed", e)
        }
    }
    private fun planAmountKES(planId: String): Int = when (planId.lowercase()) {
        "weekly" -> 100
        "monthly" -> 300
        "yearly" -> 2000
        else -> 100
    }
}
