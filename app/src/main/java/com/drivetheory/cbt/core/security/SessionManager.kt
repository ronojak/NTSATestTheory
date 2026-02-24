package com.drivetheory.cbt.core.security

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SessionManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val prefs by lazy { EncryptedPrefs.get(context) }

    fun save(token: String, userId: String, email: String?) {
        prefs.putString(KEY_TOKEN, token)
        prefs.putString(KEY_USER_ID, userId)
        if (email != null) prefs.putString(KEY_EMAIL, email)
    }

    fun clear() {
        prefs.putString(KEY_TOKEN, "")
        prefs.putString(KEY_USER_ID, "")
        prefs.putString(KEY_EMAIL, "")
    }

    fun token(): String? = prefs.getString(KEY_TOKEN)?.takeIf { it.isNotBlank() }
    fun userId(): String? = prefs.getString(KEY_USER_ID)?.takeIf { it.isNotBlank() }
    fun email(): String? = prefs.getString(KEY_EMAIL)?.takeIf { it.isNotBlank() }

    companion object {
        private const val KEY_TOKEN = "session_token"
        private const val KEY_USER_ID = "session_user_id"
        private const val KEY_EMAIL = "session_email"
    }
}
