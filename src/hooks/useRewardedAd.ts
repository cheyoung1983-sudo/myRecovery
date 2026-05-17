import { useEffect, useState, useCallback } from 'react';

/**
 * Hook to manage GPT-based Rewarded Interstitial Ads
 * Ad Unit: ca-app-pub-7510685978539466/6194107947
 */
export const useRewardedAd = () => {
  const [isAdReady, setIsAdReady] = useState(false);
  const [adSlot, setAdSlot] = useState<any>(null);

  useEffect(() => {
    const googletag = (window as any).googletag;
    if (!googletag) return;

    const setupRewardedAd = () => {
      googletag.cmd.push(() => {
        // Find the rewarded slot if it exists
        const slots = googletag.pubads().getSlots();
        const rewarded = slots.find((s: any) => s.getAdUnitPath() === '/ca-app-pub-7510685978539466/6194107947');
        
        if (rewarded) {
          setAdSlot(rewarded);
        }

        // Listen for events
        googletag.pubads().addEventListener('rewardedSlotReady', (event: any) => {
          if (event.slot === rewarded) {
            setIsAdReady(true);
            console.log('Rewarded Ad Ready');
          }
        });

        googletag.pubads().addEventListener('rewardedSlotClosed', (event: any) => {
          if (event.slot === rewarded) {
            setIsAdReady(false);
            // Reload the ad for next time
            googletag.pubads().refresh([rewarded]);
            console.log('Rewarded Ad Closed');
          }
        });

        googletag.pubads().addEventListener('rewardedSlotGranted', (event: any) => {
          if (event.slot === rewarded) {
            console.log('Reward Granted!', event.payload);
            // You can trigger a callback here if needed
          }
        });
      });
    };

    if (googletag.apiReady) {
      setupRewardedAd();
    } else {
      googletag.cmd.push(setupRewardedAd);
    }
  }, []);

  const showAd = useCallback(() => {
    const googletag = (window as any).googletag;
    if (isAdReady && adSlot && googletag) {
      googletag.cmd.push(() => {
        googletag.display(adSlot);
      });
    } else {
      console.warn('Ad not ready or slot not found');
    }
  }, [isAdReady, adSlot]);

  return { isAdReady, showAd };
};
