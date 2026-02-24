package com.drivetheory.cbt.presentation.auth

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.drivetheory.cbt.R
import com.drivetheory.cbt.domain.repository.AuthRepository
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch

@AndroidEntryPoint
class ForgotPasswordActivity : AppCompatActivity() {

    @Inject lateinit var authRepo: AuthRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_forgot_password)
        val email = findViewById<EditText>(R.id.email)
        findViewById<Button>(R.id.btn_reset).setOnClickListener {
            val e = email.text.toString().trim()
            if (e.isBlank()) return@setOnClickListener
            lifecycleScope.launch {
                val r = authRepo.resetPassword(e)
                when (r) {
                    is com.drivetheory.cbt.core.common.Result.Success -> Toast.makeText(this@ForgotPasswordActivity, "Reset request sent", Toast.LENGTH_SHORT).show()
                    is com.drivetheory.cbt.core.common.Result.Error -> Toast.makeText(this@ForgotPasswordActivity, r.message, Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
