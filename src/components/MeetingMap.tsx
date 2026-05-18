
import React from 'react';
import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

interface MeetingMapProps {
  lat: number;
  lng: number;
  name: string;
}

export const MeetingMap: React.FC<MeetingMapProps> = ({ lat, lng, name }) => {
  return (
    <div className="w-full h-48 sm:h-64 rounded-3xl overflow-hidden border border-slate-800 shadow-inner group relative">
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
          <Pin background="#3b82f6" glyphColor="#fff" borderColor="#1e3a8a" />
        </AdvancedMarker>
      </Map>
      <div className="absolute top-4 left-4 p-2 bg-slate-900/80 backdrop-blur-md rounded-lg border border-slate-700 pointer-events-none">
        <p className="text-[10px] font-black text-white uppercase tracking-widest">Live Interactive Map</p>
      </div>
    </div>
  );
};
