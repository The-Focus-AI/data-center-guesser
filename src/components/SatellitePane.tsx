import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { ZoomIn, ZoomOut, RotateCcw, ArrowUpRight } from 'lucide-react';
import type { FacilityLocation } from '../data/facilities';

interface SatellitePaneProps {
  facility: FacilityLocation;
  label: 'A' | 'B';
  showLabels: boolean;
  isRevealed: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

function MapController({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng], zoom, { animate: true, duration: 0.4 });
  }, [map, lat, lng, zoom]);

  return null;
}

function MapClickSelector({
  isRevealed,
  onSelect,
}: {
  isRevealed: boolean;
  onSelect: () => void;
}) {
  useMapEvents({
    click() {
      if (!isRevealed) {
        onSelect();
      }
    },
  });
  return null;
}

function CustomZoomControls({ lat, lng, defaultZoom }: { lat: number; lng: number; defaultZoom: number }) {
  const map = useMap();

  return (
    <div
      className="absolute bottom-3 right-3 z-[500] flex flex-col border border-zinc-800 bg-zinc-950/90 backdrop-blur-sm divide-y divide-zinc-800"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => map.zoomIn()}
        title="Zoom in"
        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        title="Zoom out"
        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => map.setView([lat, lng], defaultZoom, { animate: true })}
        title="Reset zoom"
        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function SatellitePane({
  facility,
  label,
  showLabels,
  isRevealed,
  isSelected,
  onSelect,
}: SatellitePaneProps) {
  return (
    <div className="flex flex-col bg-[#09090b] justify-between group">
      {/* Satellite Viewport — Click anywhere on the map to select */}
      <div
        onClick={() => {
          if (!isRevealed) onSelect();
        }}
        className={`relative h-[420px] sm:h-[500px] w-full bg-zinc-950 border-b border-zinc-800 overflow-hidden ${
          !isRevealed ? 'cursor-pointer' : ''
        }`}
      >
        <MapContainer
          center={[facility.lat, facility.lng]}
          zoom={facility.defaultZoom}
          minZoom={14}
          maxZoom={19}
          zoomControl={false}
          dragging={false}
          doubleClickZoom={false}
          boxZoom={false}
          keyboard={false}
          scrollWheelZoom={true}
          className={`h-full w-full z-0 ${!isRevealed ? '!cursor-pointer' : ''}`}
        >
          <MapController
            lat={facility.lat}
            lng={facility.lng}
            zoom={facility.defaultZoom}
          />
          <MapClickSelector isRevealed={isRevealed} onSelect={onSelect} />
          <TileLayer
            attribution="ESRI / MAXAR"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxNativeZoom={19}
            maxZoom={19}
          />

          {(showLabels || isRevealed) && (
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={19}
              maxZoom={19}
              opacity={0.85}
            />
          )}

          <CustomZoomControls
            lat={facility.lat}
            lng={facility.lng}
            defaultZoom={facility.defaultZoom}
          />
        </MapContainer>

        {/* Subtle hover border highlight when clickable */}
        {!isRevealed && (
          <div className="pointer-events-none absolute inset-0 border-2 border-transparent group-hover:border-white/70 transition-colors z-[400]" />
        )}

        {/* Top-Left Option Badge Overlay */}
        <div className="pointer-events-none absolute top-3 left-3 z-[400] flex items-center gap-2">
          <span
            className={`inline-flex items-center justify-center px-2.5 py-1 font-mono text-xs font-bold tracking-wider uppercase border transition-colors ${
              !isRevealed
                ? 'bg-zinc-950/90 text-white border-zinc-700 group-hover:bg-white group-hover:text-black group-hover:border-white'
                : facility.isDataCenter
                  ? 'bg-emerald-950/95 text-emerald-300 border-emerald-500'
                  : 'bg-zinc-950/95 text-zinc-400 border-zinc-700'
            }`}
          >
            {!isRevealed ? `CLICK TO PICK ${label}` : `BUILDING ${label}`}
          </span>
          {isRevealed && (
            <span className="bg-zinc-950/90 backdrop-blur-sm border border-zinc-800 px-2.5 py-1 font-mono text-[11px] text-zinc-300">
              {facility.city}, {facility.stateOrCountry}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Action Button or Post-Guess Reveal */}
      <div className="p-5 flex-1 flex flex-col justify-between bg-[#09090b]">
        {!isRevealed ? (
          <button
            type="button"
            onClick={onSelect}
            className="w-full py-4 px-5 bg-white hover:bg-zinc-200 text-black font-sans text-sm font-semibold tracking-tight transition flex items-center justify-between cursor-pointer group"
          >
            <span>This is the Data Center (Building {label})</span>
            <span className="font-mono text-xs text-zinc-500 group-hover:text-black transition">
              [Click Image or Press {label}] →
            </span>
          </button>
        ) : (
          <div className="space-y-3.5">
            {/* Classification Result */}
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 ${
                      facility.isDataCenter ? 'bg-emerald-400' : 'bg-zinc-500'
                    }`}
                  />
                  <span
                    className={`font-mono text-xs uppercase tracking-wider font-bold ${
                      facility.isDataCenter ? 'text-emerald-400' : 'text-zinc-400'
                    }`}
                  >
                    {facility.isDataCenter
                      ? `DATA CENTER — ${facility.subtype}`
                      : `NOT A DATA CENTER — ${facility.subtype}`}
                  </span>
                  {isSelected && (
                    <span
                      className={`font-mono text-[10px] uppercase tracking-widest px-1.5 py-0.5 border ${
                        facility.isDataCenter
                          ? 'border-emerald-500/60 text-emerald-300 bg-emerald-950/40'
                          : 'border-rose-500/60 text-rose-300 bg-rose-950/40'
                      }`}
                    >
                      {facility.isDataCenter ? 'YOUR PICK ✓' : 'YOUR PICK ✗'}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold text-white mt-1">
                  {facility.name}
                </h3>
                <div className="font-mono text-xs text-zinc-400">
                  {facility.city}, {facility.stateOrCountry} • {facility.operator}
                </div>
              </div>

              <div className="text-right font-mono text-[11px] text-zinc-400 shrink-0">
                {facility.powerCapacityMW && <div>{facility.powerCapacityMW}</div>}
                {facility.sqft && <div>{facility.sqft}</div>}
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {facility.summary}
            </p>

            {/* Visual Tells */}
            <div className="border border-zinc-800/90 bg-zinc-950/60 p-3 space-y-1.5">
              <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                WHY YOU CAN TELL FROM SATELLITE:
              </div>
              <ul className="space-y-1">
                {facility.visualTells.map((tell, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-zinc-300 flex items-start gap-2"
                  >
                    <span className="font-mono text-[10px] text-zinc-500 mt-0.5 shrink-0">
                      0{idx + 1}
                    </span>
                    <span>{tell}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-end gap-4 pt-1 font-mono text-[11px]">
              <a
                href={`https://www.google.com/maps/@${facility.lat},${facility.lng},18z/data=!3m1!1e3`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition"
              >
                <span>GOOGLE MAPS</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
