// @ts-nocheck
import { useEffect, useState } from 'react';
import { RewardedInterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

/**
 * Custom React Native Hook to implement Google Mobile Ads
 * with Rewarded Interstitial Unit (ca-app-pub-7510685978539466/5063838577)
 */
export function useReactNativeRewardedAd() {
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState(false);

  useEffect(() => {
    const rewardedInterstitial = RewardedInterstitialAd.createForAdRequest(
      'ca-app-pub-7510685978539466/5063838577'
    );

    // Load and handle reward events
    const unsubscribeEarned = rewardedInterstitial.addAdEventListener(
      AdEventType.EARNED_REWARD,
      (reward) => {
        setIsPremiumUnlocked(true);
      }
    );

    rewardedInterstitial.load();

    return () => {
      unsubscribeEarned();
    };
  }, []);

  return { isPremiumUnlocked, setIsPremiumUnlocked };
}
