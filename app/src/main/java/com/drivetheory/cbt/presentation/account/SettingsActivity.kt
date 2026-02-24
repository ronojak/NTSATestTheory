package com.drivetheory.cbt.presentation.account

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity
import com.drivetheory.cbt.R
import com.drivetheory.cbt.domain.repository.AuthRepository
import com.drivetheory.cbt.presentation.auth.LoginActivity
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch

@AndroidEntryPoint
class SettingsActivity : AppCompatActivity() {

    @Inject lateinit var authRepo: AuthRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)
        findViewById<Button>(R.id.btn_logout).setOnClickListener {
            lifecycleScope.launch {
                authRepo.logout()
                startActivity(Intent(this@SettingsActivity, LoginActivity::class.java))
                finishAffinity()
            }
        }
    }
}
