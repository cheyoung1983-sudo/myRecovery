import React, { useState, useEffect } from 'react';
import { Bus, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TransitArrival } from '../types';

interface TransitArrivalsProps {
  neighborhood: string;
  meetingName: string;
}

const NEIGHBORHOOD_ROUTES: { [key: string]: string[] } = {
  'Downtown': ['1', '4', '22', '25', '90'],
  'South Hill': ['4', '14', '34', '144'],
  'North Side': ['25', '26', '27', '28', '33'],
  'Valley': ['90', '94', '95', '96', '97', '98'],
  'West Plains': ['6', '60', '61', '66'],
  'Airway Heights': ['60', '61']
};

export const TransitArrivals: React.FC<TransitArrivalsProps> = ({ neighborhood, meetingName }) => {
  const [arrivals, setArrivals] = useState<TransitArrival[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArrivals = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/transit/arrivals');
      if (!response.ok) {
        const errData = await response.json();
        if (errData.reason === 'FORBIDDEN_BOT_BLOCK') {
          throw new Error('STA feed is currently blocking automated access.');
        }
        throw new Error('Transit data unavailable');
      }
      const data: TransitArrival[] = await response.json();
      
      const relevantRoutes = NEIGHBORHOOD_ROUTES[neighborhood] || [];
      
      // Filter for arrivals on routes serving this neighborhood
      const neighborhoodArrivals = data.filter(arr => 
        relevantRoutes.includes(arr.routeId) || 
        meetingName.includes(`Route ${arr.routeId}`)
      ).slice(0, 3); // Take top 3 most recent updates

      setArrivals(neighborhoodArrivals);
      setError(null);
    } catch (err) {
      setError('Live transit feed pending...');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArrivals();
    const interval = setInterval(fetchArrivals, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [neighborhood, meetingName]);

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <Bus size={12} className="text-emerald-500" /> STA Real-Time Arrivals
        </h4>
        <button 
          onClick={fetchArrivals}
          className="text-slate-600 hover:text-white transition-colors"
        >
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading && arrivals.length === 0 ? (
          <div className="flex items-center gap-2 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] text-slate-600 font-bold italic">Polling Spokane Transit feeds...</p>
          </div>
        ) : error && arrivals.length === 0 ? (
          <p className="text-[10px] text-slate-700 italic font-medium flex items-center gap-1">
            <AlertCircle size={10} /> {error}
          </p>
        ) : (
          <div className="space-y-2">
            {arrivals.length === 0 ? (
              <p className="text-[10px] text-slate-600 italic">No live updates for {neighborhood} routes right now.</p>
            ) : (
              arrivals.map((arr, idx) => (
                <motion.div 
                  key={`${arr.id}-${idx}`}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black rounded-md">
                      Route {arr.routeId}
                    </span>
                    <span className="text-[10px] text-slate-300 font-bold">
                      {arr.stopTimeUpdates?.[0]?.arrival ? (
                        `${Math.max(0, Math.round((Number(arr.stopTimeUpdates[0].arrival) - Date.now() / 1000) / 60))}m away`
                      ) : (
                        'Arriving soon'
                      )}
                    </span>
                  </div>
                  {arr.stopTimeUpdates?.[0]?.delay ? (
                    <span className={`text-[9px] font-black uppercase ${arr.stopTimeUpdates[0].delay > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {arr.stopTimeUpdates[0].delay > 0 ? `+${Math.round(arr.stopTimeUpdates[0].delay / 60)}m late` : 'On time'}
                    </span>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
