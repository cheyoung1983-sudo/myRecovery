
import React from 'react';
import { MapPin, Phone, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { Resource } from '../types';

interface ResourceCardProps {
  resource: Resource;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/20 border border-slate-800 p-6 rounded-3xl space-y-4"
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-black px-2 py-1 bg-blue-600/10 text-blue-500 rounded border border-blue-500/20 uppercase tracking-widest leading-none">
            {resource.category}
          </span>
          <h3 className="text-xl font-bold text-white mt-3">{resource.name}</h3>
        </div>
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{resource.neighborhood}</div>
      </div>
      <p className="text-slate-400 text-sm leading-relaxed">{resource.description}</p>
      <div className="flex flex-col gap-2 pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <MapPin size={14} className="text-blue-500" />
          {resource.address}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Phone size={14} className="text-emerald-500" />
          {resource.phone}
        </div>
      </div>
      <a 
        href={resource.website} 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700/50"
      >
        <Eye size={16} /> VISIT WEBSITE
      </a>
    </motion.div>
  );
};
