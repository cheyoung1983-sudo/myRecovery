
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';

interface FallbackProps {
  lat: number;
  lng: number;
  name: string;
}

const MapFallback: React.FC<FallbackProps> = ({ lat, lng, name }) => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-950 p-6 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-10" 
        style={{
          backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      ></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08),transparent)] pointer-events-none"></div>

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-wider rounded border border-blue-500/20">
            Navigation Fallback
          </span>
          <h4 className="text-sm font-black text-white italic uppercase tracking-wider mt-2 line-clamp-1">{name}</h4>
        </div>
        <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </div>
      </div>

      <div className="relative z-10 space-y-2 mt-4">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
          Google Maps is currently unavailable.
        </p>
        <p className="text-[9px] text-slate-500 font-mono">
          Coordinates: {lat.toFixed(5)}° N, {lng.toFixed(5)}° W
        </p>
        <div className="pt-1">
          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-blue-400 hover:text-blue-300 text-[9px] font-black uppercase tracking-wider rounded-lg border border-slate-700 pointer-events-auto transition-colors"
          >
            Open in Google Maps ↗
          </a>
        </div>
      </div>
    </div>
  );
};

interface LocalErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface LocalErrorBoundaryState {
  hasError: boolean;
}

class LocalErrorBoundary extends Component<LocalErrorBoundaryProps, LocalErrorBoundaryState> {
  public state: LocalErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): LocalErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Map rendering caught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface MeetingMapProps {
  lat: number;
  lng: number;
  name: string;
}

export const MeetingMap: React.FC<MeetingMapProps> = ({ lat, lng, name }) => {
  const customFallback = <MapFallback lat={lat} lng={lng} name={name} />;

  return (
    <div className="w-full h-48 sm:h-64 rounded-3xl overflow-hidden border border-slate-800 shadow-inner group relative">
      <LocalErrorBoundary fallback={customFallback}>
        <Map
          defaultCenter={{ lat, lng }}
          defaultZoom={15}
          mapId="DEMO_MAP_ID"
          disableDefaultUI={true}
          gestureHandling={'greedy'}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          className="w-full h-full"
        >
          <AdvancedMarker position={{ lat, lng }} title={name}>
            <div className="relative flex flex-col items-center group/pin pointer-events-auto">
              <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition-transform duration-300 group-hover/pin:scale-110">
                <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
              </div>
              <div className="w-2.5 h-2.5 bg-blue-500 rotate-45 -mt-1.5 shadow-md border-r border-b border-white/20"></div>
            </div>
          </AdvancedMarker>
        </Map>
        <div className="absolute top-4 left-4 p-2 bg-slate-900/80 backdrop-blur-md rounded-lg border border-slate-700 pointer-events-none select-none">
          <p className="text-[10px] font-black text-white uppercase tracking-widest">Live Interactive Map</p>
        </div>
      </LocalErrorBoundary>
    </div>
  );
};

