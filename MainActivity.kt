package com.myrecovery.app

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.rewardedinterstitial.RewardedInterstitialAd
import com.google.android.gms.ads.rewardedinterstitial.RewardedInterstitialAdLoadCallback

class MainActivity : AppCompatActivity() {
    private var rewardedInterstitialAd: RewardedInterstitialAd? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        MobileAds.initialize(this) {}
        loadRewardedAd()
    }

    private fun loadRewardedAd() {
        val adUnitId = "ca-app-pub-7510685978539466/5063838577" 
        val adRequest = AdRequest.Builder().build()

        RewardedInterstitialAd.load(this, adUnitId, adRequest, 
            object : RewardedInterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: RewardedInterstitialAd) {
                    rewardedInterstitialAd = ad
                }
                override fun onAdFailedToLoad(error: LoadAdError) {
                    rewardedInterstitialAd = null
                }
            }
        )
    }

    fun showAdAndGrantAccess() {
        rewardedInterstitialAd?.let { ad ->
            ad.show(this) { rewardItem ->
                val rewardAmount = rewardItem.amount
                // Unlock Spokane Peer Support Premium mode here!
                runOnUiThread {
                    unlockSpokanePremiumFeatures()
                }
            }
        } ?: run {
            // Fallback: Ad is still loading, show loading spinner
        }
    }

    private fun unlockSpokanePremiumFeatures() {
        // Implementation for unlocking Spokane Peer Support Premium features
    }
}
