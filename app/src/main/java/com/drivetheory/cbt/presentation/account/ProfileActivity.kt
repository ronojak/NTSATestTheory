package com.drivetheory.cbt.presentation.account

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import kotlinx.coroutines.launch
import android.content.Intent
import com.drivetheory.cbt.R
import com.drivetheory.cbt.core.security.SessionManager
import com.drivetheory.cbt.presentation.billing.SubscriptionActivity
import com.drivetheory.cbt.presentation.auth.LoginActivity
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class ProfileActivity : AppCompatActivity() {
    private val vm: ProfileViewModel by viewModels()

    @Inject lateinit var session: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_profile)

        // Ensure a logged-in user exists; otherwise redirect to login
        if (session.token() == null || session.userId() == null) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }

        val name = findViewById<EditText>(R.id.name)
        val emailView = findViewById<TextView>(R.id.email)
        val phone = findViewById<EditText>(R.id.phone)
        val sub = findViewById<TextView>(R.id.subscription)

        findViewById<Button>(R.id.btn_save).setOnClickListener {
            vm.save(name.text.toString().trim(), phone.text.toString().trim())
        }
        findViewById<Button>(R.id.btn_manage).setOnClickListener {
            startActivity(Intent(this, SubscriptionActivity::class.java))
        }

        lifecycleScope.launch {
            repeatOnLifecycle(androidx.lifecycle.Lifecycle.State.STARTED) {
                vm.state.collect { st ->
                    if (st.loading) return@collect
                    if (st.error != null) Toast.makeText(this@ProfileActivity, st.error, Toast.LENGTH_SHORT).show()
                    if (st.profile != null) {
                        name.setText(st.profile.name ?: "")
                        phone.setText(st.profile.phone ?: "")
                        emailView.text = st.profile.email ?: ""
                    }
                    if (st.subscription != null) {
                        sub.text = st.subscription.status + (st.subscription.planType?.let { " ($it)" } ?: "")
                    }
                }
            }
        }
        vm.load()
    }
}
