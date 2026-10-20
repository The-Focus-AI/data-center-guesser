import L from 'leaflet';
import { isZeroCarbonFuel, type FuelSourceType } from '../data/powerGridData';

export interface FuelVisualConfig {
  color: string;
  strokeColor: string;
  bgColor: string;
  label: string;
  shortLabel: string;
  isZeroCarbon: boolean;
}

export function getFuelVisual(fuel: FuelSourceType): FuelVisualConfig {
  switch (fuel) {
    case 'nuclear':
      return {
        color: '#c084fc',
        strokeColor: '#e9d5ff',
        bgColor: '#3b0764',
        label: 'Nuclear (0-CO₂)',
        shortLabel: 'Nuclear',
        isZeroCarbon: true,
      };
    case 'hydro':
    case 'pumped storage':
      return {
        color: '#22d3ee',
        strokeColor: '#a5f3fc',
        bgColor: '#083344',
        label:
          fuel === 'pumped storage'
            ? 'Pumped Hydro (0-CO₂)'
            : 'Hydroelectric (0-CO₂)',
        shortLabel: 'Hydro / Pumped',
        isZeroCarbon: true,
      };
    case 'solar':
      return {
        color: '#facc15',
        strokeColor: '#fef08a',
        bgColor: '#422006',
        label: 'Solar PV (0-CO₂)',
        shortLabel: 'Solar',
        isZeroCarbon: true,
      };
    case 'wind':
    case 'battery':
      return {
        color: '#2dd4bf',
        strokeColor: '#99f6e4',
        bgColor: '#042f2e',
        label: fuel === 'wind' ? 'Wind (0-CO₂)' : 'Battery Storage (0-CO₂)',
        shortLabel: 'Wind / Battery',
        isZeroCarbon: true,
      };
    case 'natural gas':
      return {
        color: '#fb923c',
        strokeColor: '#fed7aa',
        bgColor: '#1c1917',
        label: 'Natural Gas (Fossil)',
        shortLabel: 'Natural Gas',
        isZeroCarbon: false,
      };
    case 'petroleum':
    case 'coal':
    case 'biomass':
    default:
      return {
        color: '#f43f5e',
        strokeColor: '#fecdd3',
        bgColor: '#1c1917',
        label:
          fuel === 'coal'
            ? 'Coal (Fossil)'
            : fuel === 'biomass'
              ? 'Biomass / Waste (Emitting)'
              : 'Petroleum / Oil (Fossil)',
        shortLabel: 'Oil / Coal / Waste',
        isZeroCarbon: false,
      };
  }
}

export function getFuelInnerSvg(fuel: FuelSourceType, color: string): string {
  switch (fuel) {
    case 'nuclear':
      return `
        <circle cx="12" cy="12" r="2.2" fill="${color}" />
        <path d="M12 9.2 L9.2 4.4 A7.8 7.8 0 0 1 14.8 4.4 Z" fill="${color}" />
        <path d="M14.4 13.4 L19.9 13.4 A7.8 7.8 0 0 1 17.1 18.2 Z" fill="${color}" />
        <path d="M9.6 13.4 L6.9 18.2 A7.8 7.8 0 0 1 4.1 13.4 Z" fill="${color}" />
      `;
    case 'hydro':
    case 'pumped storage':
      return `
        <path d="M12 3.8 C12 3.8 6.5 10.2 6.5 14.2 A5.5 5.5 0 0 0 17.5 14.2 C17.5 10.2 12 3.8 12 3.8 Z" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" />
        <path d="M8.8 14.8 Q12 12.8 15.2 14.8" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" />
      `;
    case 'solar':
      return `
        <circle cx="12" cy="12" r="4" fill="${color}" />
        <g stroke="${color}" stroke-width="2" stroke-linecap="round">
          <line x1="12" y1="3" x2="12" y2="5.5" />
          <line x1="12" y1="18.5" x2="12" y2="21" />
          <line x1="3" y1="12" x2="5.5" y2="12" />
          <line x1="18.5" y1="12" x2="21" y2="12" />
          <line x1="5.6" y1="5.6" x2="7.4" y2="7.4" />
          <line x1="16.6" y1="16.6" x2="18.4" y2="18.4" />
          <line x1="18.4" y1="5.6" x2="16.6" y2="7.4" />
          <line x1="7.4" y1="16.6" x2="5.6" y2="18.4" />
        </g>
      `;
    case 'wind':
    case 'battery':
      return `
        <circle cx="12" cy="11" r="1.8" fill="${color}" />
        <path d="M12 9.2 L12 3.2 M13.5 11.9 L18.7 14.9 M10.5 11.9 L5.3 14.9" stroke="${color}" stroke-width="2.2" stroke-linecap="round" />
        <line x1="12" y1="12.8" x2="12" y2="20.5" stroke="${color}" stroke-width="1.8" stroke-linecap="round" />
      `;
    case 'natural gas':
      return `
        <path d="M12 3.5 C12 3.5 17.2 8.2 17.2 13.5 A5.2 5.2 0 0 1 6.8 13.5 C6.8 10.2 9.2 8.2 9.8 6.5 C10.3 8.5 11.5 9 12 3.5 Z" fill="${color}" fill-opacity="0.28" stroke="${color}" stroke-width="2" stroke-linejoin="round" />
        <circle cx="12" cy="15.2" r="1.8" fill="${color}" />
      `;
    case 'petroleum':
    case 'coal':
    case 'biomass':
    default:
      return `
        <path d="M6 19.5 L8 10.5 L12.5 10.5 L14.5 19.5 Z" fill="${color}" fill-opacity="0.3" stroke="${color}" stroke-width="1.9" stroke-linejoin="round" />
        <path d="M10.5 7.5 Q13 5 16 6.2 Q18.5 7 19.5 4.8" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" />
      `;
  }
}

export function buildPowerPlantMarkerSvg(
  fuel: FuelSourceType,
  sizePx: number,
  isSelected = false
): string {
  const vis = getFuelVisual(fuel);
  const zero = isZeroCarbonFuel(fuel);
  const isNuclear = fuel === 'nuclear';
  const strokeW = isSelected ? 2.4 : isNuclear ? 2.0 : 1.75;
  const outerBorder = isSelected ? '#ffffff' : vis.color;

  if (zero) {
    const haloColor = isSelected
      ? '#ffffff'
      : isNuclear
        ? '#c084fc'
        : '#22d3ee';
    return `
      <svg width="${sizePx}" height="${sizePx}" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.85));">
        <circle cx="14" cy="14" r="12.8" fill="none" stroke="${haloColor}" stroke-width="${isNuclear || isSelected ? '1.6' : '1.2'}" stroke-dasharray="${isNuclear ? 'none' : '3 1.5'}" opacity="${isSelected ? '1' : '0.9'}" />
        <circle cx="14" cy="14" r="10.2" fill="${vis.bgColor}" stroke="${outerBorder}" stroke-width="${strokeW}" />
        <g transform="translate(2, 2)">
          ${getFuelInnerSvg(fuel, isSelected ? '#ffffff' : vis.color)}
        </g>
      </svg>
    `;
  }

  return `
    <svg width="${sizePx}" height="${sizePx}" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.85));">
      <rect x="3.5" y="3.5" width="21" height="21" rx="2" fill="#141417" stroke="${outerBorder}" stroke-width="${strokeW}" />
      <g transform="translate(2, 2)">
        ${getFuelInnerSvg(fuel, isSelected ? '#ffffff' : vis.color)}
      </g>
    </svg>
  `;
}

export function buildDataCenterMarkerSvg(
  sizePx: number,
  isSelected = false
): string {
  const border = isSelected ? '#ffffff' : '#ecfdf5';
  const fill = isSelected ? '#059669' : '#065f46';
  const barColor = '#6ee7b7';
  return `
    <svg width="${sizePx}" height="${sizePx}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.9));">
      <rect x="2.5" y="2.5" width="19" height="19" rx="3.5" fill="${fill}" stroke="${border}" stroke-width="${isSelected ? '2.4' : '1.6'}" />
      <line x1="6.5" y1="8" x2="17.5" y2="8" stroke="${barColor}" stroke-width="2" stroke-linecap="round" />
      <line x1="6.5" y1="12" x2="17.5" y2="12" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
      <line x1="6.5" y1="16" x2="17.5" y2="16" stroke="${barColor}" stroke-width="2" stroke-linecap="round" />
    </svg>
  `;
}

const plantIconCache = new Map<string, L.DivIcon>();

export function getPowerPlantDivIcon(
  fuel: FuelSourceType,
  totalMW: number,
  isSelected: boolean
): L.DivIcon {
  const sizeBucket = isSelected
    ? 26
    : fuel === 'nuclear'
      ? 24
      : totalMW >= 500
        ? 21
        : totalMW >= 100
          ? 19
          : 17;

  const key = `${fuel}-${sizeBucket}-${isSelected ? 'sel' : 'norm'}`;
  const cached = plantIconCache.get(key);
  if (cached) return cached;

  const html = buildPowerPlantMarkerSvg(fuel, sizeBucket, isSelected);
  const icon = L.divIcon({
    className: 'custom-power-plant-marker',
    html,
    iconSize: [sizeBucket, sizeBucket],
    iconAnchor: [sizeBucket / 2, sizeBucket / 2],
  });
  plantIconCache.set(key, icon);
  return icon;
}

const dcIconCache = new Map<string, L.DivIcon>();

export function getDataCenterDivIcon(isSelected: boolean): L.DivIcon {
  const size = isSelected ? 22 : 18;
  const key = isSelected ? 'dc-sel' : 'dc-norm';
  const cached = dcIconCache.get(key);
  if (cached) return cached;

  const html = buildDataCenterMarkerSvg(size, isSelected);
  const icon = L.divIcon({
    className: 'custom-dc-marker',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
  dcIconCache.set(key, icon);
  return icon;
}
