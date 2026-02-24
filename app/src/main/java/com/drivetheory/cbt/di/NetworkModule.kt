package com.drivetheory.cbt.di

import com.drivetheory.cbt.BuildConfig
import com.drivetheory.cbt.core.network.ApiClient
import com.drivetheory.cbt.data.billing.api.BillingApi
import com.drivetheory.cbt.data.mpesa.api.MpesaApi
import com.drivetheory.cbt.data.auth.api.AuthApi
import com.drivetheory.cbt.data.user.api.UserApi
import com.drivetheory.cbt.data.subscription.api.EntitlementsApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides @Singleton fun provideRetrofit(): Retrofit = ApiClient.retrofit(BuildConfig.BACKEND_BASE_URL)
    @Provides @Singleton fun provideBillingApi(retrofit: Retrofit): BillingApi = retrofit.create(BillingApi::class.java)
    @Provides @Singleton fun provideMpesaApi(retrofit: Retrofit): MpesaApi = retrofit.create(MpesaApi::class.java)
    @Provides @Singleton fun provideAuthApi(retrofit: Retrofit): AuthApi = retrofit.create(AuthApi::class.java)
    @Provides @Singleton fun provideUserApi(retrofit: Retrofit): UserApi = retrofit.create(UserApi::class.java)
    @Provides @Singleton fun provideEntitlementsApi(retrofit: Retrofit): EntitlementsApi = retrofit.create(EntitlementsApi::class.java)
}

