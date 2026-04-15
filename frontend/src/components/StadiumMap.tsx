'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Zone {
  id: string;
  name: string;
  type: string;
  capacity: number;
  currentUsers: number;
  status: string;
  coordinates: { lat: number; lng: number };
  queueSize?: number;
  stallsOpen?: number;
  stallsTotal?: number;
  flowRate?: number;
}

interface StadiumMapProps {
  zones: Record<string, Zone>;
}

const STATUS_COLORS: Record<string, string> = {
  normal: '#22c55e',   // green
  warning: '#f59e0b',  // amber
  critical: '#ef4444', // red
};

const ZONE_ICONS: Record<string, string> = {
  crowd: '👥',
  vendor: '🍔',
  gate: '🚪',
};

export default function StadiumMap({ zones }: StadiumMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.CircleMarker>>({});
  const tooltipsRef = useRef<Record<string, L.Tooltip>>({});

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [40.4528, -3.6883],
      zoom: 17,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark tile layer
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      { maxZoom: 19 }
    ).addTo(map);

    // Zoom control on the right
    L.control.zoom({ position: 'topright' }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
      tooltipsRef.current = {};
    };
  }, []);

  // Update markers when zones change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !zones) return;

    Object.values(zones).forEach((zone) => {
      const color = STATUS_COLORS[zone.status] || '#6b7280';
      const fillOpacity = Math.min(0.9, 0.3 + (zone.currentUsers / zone.capacity) * 0.6);
      const radius = zone.type === 'gate' ? 12 : 20 + (zone.currentUsers / zone.capacity) * 15;
      const icon = ZONE_ICONS[zone.type] || '📍';
      const pct = zone.capacity > 0 ? Math.round((zone.currentUsers / zone.capacity) * 100) : 0;

      let extra = '';
      if (zone.type === 'vendor') {
        extra = `<br/>Queue: ${zone.queueSize ?? 0} · Stalls: ${zone.stallsOpen ?? 0}/${zone.stallsTotal ?? 0}`;
      } else if (zone.type === 'gate') {
        extra = `<br/>Flow: ${zone.flowRate ?? 0}/tick`;
      }

      const tooltipContent = `
        <div style="font-family: system-ui; font-size: 13px; line-height: 1.5;">
          <strong>${icon} ${zone.name}</strong><br/>
          ${zone.currentUsers}/${zone.capacity} (${pct}%)
          ${extra}
          <br/><span style="color: ${color}; font-weight: 600;">● ${zone.status.toUpperCase()}</span>
        </div>
      `;

      if (markersRef.current[zone.id]) {
        // Update existing marker
        const marker = markersRef.current[zone.id];
        marker.setStyle({ color, fillColor: color, fillOpacity, radius });
        marker.setTooltipContent(tooltipContent);
      } else {
        // Create new marker
        const marker = L.circleMarker([zone.coordinates.lat, zone.coordinates.lng], {
          radius,
          color,
          fillColor: color,
          fillOpacity,
          weight: 2,
        }).addTo(map);

        marker.bindTooltip(tooltipContent, {
          permanent: true,
          direction: 'top',
          offset: [0, -10],
          className: 'stadium-tooltip',
        });

        markersRef.current[zone.id] = marker;
      }
    });
  }, [zones]);

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden border border-gray-800">
      <div ref={mapContainerRef} className="h-full w-full" />
      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] rounded-lg bg-gray-900/90 px-3 py-2 text-xs backdrop-blur-sm border border-gray-700">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" /> Normal</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" /> Warning</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" /> Critical</span>
        </div>
      </div>
    </div>
  );
}
