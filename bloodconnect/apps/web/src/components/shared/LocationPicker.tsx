'use client';

import React from 'react';
import { MapPin, Shield } from 'lucide-react';

interface LocationPickerProps {
  city: string;
  area: string;
  approxLat: number;
  approxLng: number;
  onChange: (loc: { city: string; area: string; approxLat: number; approxLng: number }) => void;
}

const BENGALURU_ZONES = [
  { area: 'Koramangala (South-East)', lat: 12.93, lng: 77.62 },
  { area: 'Indiranagar (East)', lat: 12.97, lng: 77.64 },
  { area: 'Jayanagar (South)', lat: 12.92, lng: 77.58 },
  { area: 'Malleshwaram (North-West)', lat: 13.00, lng: 77.57 },
  { area: 'Shivajinagar / Central', lat: 12.98, lng: 77.60 },
  { area: 'Whitefield (East Tech Corridor)', lat: 12.96, lng: 77.74 },
  { area: 'HSR Layout (South-East)', lat: 12.91, lng: 77.64 },
  { area: 'Hebbal (North)', lat: 13.03, lng: 77.59 },
  { area: 'Electronic City (South)', lat: 12.84, lng: 77.66 },
  { area: 'Rajajinagar (West)', lat: 12.99, lng: 77.55 },
];

export const LocationPicker: React.FC<LocationPickerProps> = ({
  city,
  area,
  approxLat,
  approxLng,
  onChange,
}) => {
  const handleZoneSelect = (zone: typeof BENGALURU_ZONES[0]) => {
    onChange({
      city: 'Bengaluru',
      area: zone.area,
      approxLat: zone.lat,
      approxLng: zone.lng,
    });
  };

  const gridCell = `GRID_${approxLat.toFixed(2)}_${approxLng.toFixed(2)}`;

  return (
    <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-red-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Approximate Location (Privacy Preserved)
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <Shield className="h-3 w-3" />
          <span>Approx ~1.1 km Grid Precision</span>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Home addresses are never collected or stored. Geolocation is restricted to neighborhood-level coordinates.
      </p>

      {/* Quick Zone Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
        {BENGALURU_ZONES.map((zone) => {
          const isSelected = zone.area === area;
          return (
            <button
              key={zone.area}
              type="button"
              onClick={() => handleZoneSelect(zone)}
              className={`p-2 rounded-lg text-left text-xs transition-all border ${
                isSelected
                  ? 'bg-red-600 text-white font-semibold border-red-700 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <div className="truncate">{zone.area}</div>
              <div className={`text-[10px] ${isSelected ? 'text-red-100' : 'text-slate-400'}`}>
                {zone.lat.toFixed(2)}, {zone.lng.toFixed(2)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Readout */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-600 font-mono">
        <div>Zone: <span className="font-semibold text-slate-900">{area || 'Select above'}</span></div>
        <div>Grid: <span className="font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">{gridCell}</span></div>
      </div>
    </div>
  );
};
