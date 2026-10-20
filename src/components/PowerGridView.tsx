import { useState, useMemo, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Marker,
  Tooltip,
  useMap,
} from 'react-leaflet';
import { ZoomIn, ZoomOut, RotateCcw, ArrowUpRight, Check } from 'lucide-react';
import {
  FACILITY_LOCATIONS,
  type FacilityLocation,
} from '../data/facilities';
import {
  POWER_STATIONS,
  POWER_SUBSTATIONS,
  computeDataCenterGridConnects,
  computeEnrichedTransmissionCorridors,
  isZeroCarbonFuel,
  isNamedSubstation,
  type PowerStation,
  type PowerSubstation,
  type DataCenterGridConnect,
  type EnrichedTransmissionCorridor,
  type FuelSourceType,
} from '../data/powerGridData';
import {
  getFuelVisual,
  getPowerPlantDivIcon,
  getDataCenterDivIcon,
} from '../utils/mapIcons';
import { PlantFuelIcon, DataCenterIcon } from './MapIconBadges';

type CarbonFilterMode =
  | 'all'
  | 'nuclear'
  | 'hydro'
  | 'solar'
  | 'wind-battery'
  | 'natural-gas'
  | 'oil-coal-biomass';

function matchesFuelFilter(fuel: FuelSourceType, filter: CarbonFilterMode): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'nuclear':
      return fuel === 'nuclear';
    case 'hydro':
      return fuel === 'hydro' || fuel === 'pumped storage';
    case 'solar':
      return fuel === 'solar';
    case 'wind-battery':
      return fuel === 'wind' || fuel === 'battery';
    case 'natural-gas':
      return fuel === 'natural gas';
    case 'oil-coal-biomass':
      return fuel === 'petroleum' || fuel === 'coal' || fuel === 'biomass';
  }
}

interface PowerGridViewProps {
  connecticutOnly: boolean;
  onToggleConnecticutOnly: () => void;
  excludeHyperscalers: boolean;
  onToggleExcludeHyperscalers: () => void;
  selectedFacilityId?: string | null;
  selectedPlantId?: string | null;
  initialRegionId?: string | null;
  initialLedgerMode?: 'datacenters' | 'stations' | 'lines';
  initialSearchQuery?: string;
  onSelectFacilityId?: (facilityId: string | null) => void;
  onSelectPlantId?: (plantId: string | null) => void;
  onChangeRegionId?: (regionId: string) => void;
  onChangeLedgerMode?: (mode: 'datacenters' | 'stations' | 'lines') => void;
  onChangeSearchQuery?: (q: string) => void;
  onPlayFacility: (facility: FacilityLocation) => void;
}

interface RegionPreset {
  id: string;
  label: string;
  lat: number;
  lng: number;
  zoom: number;
  isCT: boolean;
  highlightLineId?: string;
}

const REGION_PRESETS: RegionPreset[] = [
  { id: 'ct-grid', label: 'CT · MA · Hudson Valley', lat: 41.88, lng: -72.92, zoom: 8, isCT: true },
  {
    id: 'torrington-cornwall',
    label: '🔍 Torrington → Cornwall (Route 4 & 7 Feeders)',
    lat: 41.845,
    lng: -73.285,
    zoom: 11,
    isCT: true,
    highlightLineId: 'line-es-14r31-goshen-cornwall',
  },
  { id: 'ct-sw', label: 'Connecticut (ISO-NE)', lat: 41.55, lng: -72.72, zoom: 9, isCT: true },
  { id: 'hudson-valley', label: 'Hudson Valley, NY', lat: 41.68, lng: -73.92, zoom: 9, isCT: true },
  { id: 'ma-west', label: 'Western MA / Berkshires', lat: 42.32, lng: -72.78, zoom: 9, isCT: true },
  { id: 'ma-east', label: 'Boston / I-495, MA', lat: 42.38, lng: -71.35, zoom: 9, isCT: true },
  { id: 'ashburn', label: 'Ashburn, VA', lat: 39.015, lng: -77.455, zoom: 12, isCT: false },
  { id: 'columbia', label: 'Columbia River, OR', lat: 45.64, lng: -120.95, zoom: 9, isCT: false },
  { id: 'quincy', label: 'Quincy, WA', lat: 47.24, lng: -119.86, zoom: 11, isCT: false },
  { id: 'memphis', label: 'Memphis, TN', lat: 35.06, lng: -90.02, zoom: 11, isCT: false },
];

function parseNumericMW(raw: string): number {
  const m = raw.match(/(\d+(\.\d+)?)/);
  return m ? parseFloat(m[1]) : 5;
}

function MapViewportController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 0.4 });
  }, [map, center, zoom]);

  return null;
}

function CustomZoomControls({
  lat,
  lng,
  defaultZoom,
}: {
  lat: number;
  lng: number;
  defaultZoom: number;
}) {
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

function LayerCheckbox({
  checked,
  onChange,
  accentClass = 'border-emerald-500/60 bg-emerald-950/20 text-zinc-100',
  boxCheckedClass = 'bg-emerald-500 border-emerald-400 text-black',
  children,
  title,
}: {
  checked: boolean;
  onChange: () => void;
  accentClass?: string;
  boxCheckedClass?: string;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <label
      title={title}
      className={`inline-flex items-center gap-2 px-2.5 py-1.5 border transition cursor-pointer select-none ${
        checked
          ? accentClass
          : 'border-zinc-800/80 bg-zinc-950/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        className={`w-3.5 h-3.5 rounded-[2px] border flex items-center justify-center shrink-0 transition ${
          checked
            ? boxCheckedClass
            : 'border-zinc-700 bg-zinc-900/90 text-transparent'
        }`}
      >
        <Check className="w-2.5 h-2.5 stroke-[3]" />
      </span>
      <span className="inline-flex items-center gap-1.5">{children}</span>
    </label>
  );
}

export function PowerGridView({
  connecticutOnly,
  onToggleConnecticutOnly,
  excludeHyperscalers,
  onToggleExcludeHyperscalers,
  selectedFacilityId,
  selectedPlantId,
  initialRegionId,
  initialLedgerMode = 'datacenters',
  initialSearchQuery = '',
  onSelectFacilityId,
  onSelectPlantId,
  onChangeRegionId,
  onChangeLedgerMode,
  onChangeSearchQuery,
  onPlayFacility,
}: PowerGridViewProps) {
  const allGridConnects = useMemo(
    () => computeDataCenterGridConnects(FACILITY_LOCATIONS),
    []
  );

  const allCorridors = useMemo(
    () => computeEnrichedTransmissionCorridors(),
    []
  );

  const initialPlant = useMemo(
    () =>
      selectedPlantId
        ? POWER_STATIONS.find((p) => p.id === selectedPlantId) ?? null
        : null,
    [selectedPlantId]
  );

  const initialConnect = useMemo(
    () =>
      selectedFacilityId
        ? allGridConnects.find((c) => c.facilityId === selectedFacilityId) ??
          allGridConnects[0]
        : allGridConnects.find((c) => c.isConnecticut) ?? allGridConnects[0],
    [selectedFacilityId, allGridConnects]
  );

  const initialPreset = useMemo(
    () =>
      initialRegionId
        ? REGION_PRESETS.find((r) => r.id === initialRegionId) ?? null
        : null,
    [initialRegionId]
  );

  const [mapCenter, setMapCenter] = useState<[number, number]>(() => {
    if (initialPlant) return [initialPlant.lat, initialPlant.lng];
    if (selectedFacilityId && initialConnect) {
      return [initialConnect.facilityLat, initialConnect.facilityLng];
    }
    if (initialPreset) return [initialPreset.lat, initialPreset.lng];
    return [41.58, -72.85];
  });
  const [mapZoom, setMapZoom] = useState<number>(() => {
    if (initialPlant) return 13;
    if (selectedFacilityId) return 13;
    if (initialPreset) return initialPreset.zoom;
    return 9;
  });
  const [activePresetId, setActivePresetId] = useState<string>(() => {
    if (initialPlant || selectedFacilityId) return 'custom';
    return initialPreset?.id ?? 'ct-grid';
  });

  // Explicit Checkboxes for Turning Layers ON / OFF
  const [showDataCenters, setShowDataCenters] = useState(true);
  const [showPowerPlants, setShowPowerPlants] = useState(true);
  const [showZeroCarbonPlants, setShowZeroCarbonPlants] = useState(true);
  const [showFossilPlants, setShowFossilPlants] = useState(true);
  const [showBackbone345kV, setShowBackbone345kV] = useState(true);
  const [showMinor115kV, setShowMinor115kV] = useState(true);
  const [showTownFeeders, setShowTownFeeders] = useState(true);
  const [showSubstations, setShowSubstations] = useState(true);
  const [showAllPlants, setShowAllPlants] = useState<boolean>(
    () =>
      Boolean(
        (initialPlant && initialPlant.totalMW < 25) ||
          initialPreset?.id === 'torrington-cornwall'
      )
  );
  const [showAllTieIns, setShowAllTieIns] = useState(false);
  const [showLabels, setShowLabels] = useState(true);

  // Specific Fuel Filter
  const [carbonFilter, setCarbonFilter] = useState<CarbonFilterMode>('all');

  const [ledgerMode, setLedgerMode] = useState<
    'datacenters' | 'stations' | 'lines'
  >(() =>
    initialPreset?.highlightLineId
      ? 'lines'
      : initialPlant
        ? 'stations'
        : initialLedgerMode
  );
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  const [selectedConnect, setSelectedConnect] =
    useState<DataCenterGridConnect | null>(() =>
      initialPlant || initialPreset?.highlightLineId
        ? null
        : initialConnect ?? null
    );
  const [selectedPlant, setSelectedPlant] = useState<PowerStation | null>(
    () => initialPlant
  );
  const [selectedLine, setSelectedLine] =
    useState<EnrichedTransmissionCorridor | null>(() =>
      initialPreset?.highlightLineId
        ? allCorridors.find((l) => l.id === initialPreset.highlightLineId) ??
          null
        : null
    );

  const filteredConnects = useMemo(() => {
    return allGridConnects.filter((c) => {
      if (connecticutOnly && !c.isConnecticut) return false;
      if (
        excludeHyperscalers &&
        (c.subtype === 'Hyperscale' || c.subtype === 'AI Supercluster')
      ) {
        return false;
      }
      if (searchQuery.trim() && ledgerMode === 'datacenters') {
        const q = searchQuery.toLowerCase();
        return (
          c.facilityName.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.nearestSubstationName.toLowerCase().includes(q) ||
          c.nearestPlantName.toLowerCase().includes(q) ||
          c.nearestZeroCarbonPlantName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [
    allGridConnects,
    connecticutOnly,
    excludeHyperscalers,
    searchQuery,
    ledgerMode,
  ]);

  // Base pool of plants in scope (for counts)
  const scopedPlants = useMemo(() => {
    const isSpecificFuel = carbonFilter !== 'all';
    return POWER_STATIONS.filter((p) => {
      if (connecticutOnly && !p.isConnecticut) return false;
      if (
        !showAllPlants &&
        !isSpecificFuel &&
        p.totalMW < 25 &&
        selectedPlant?.id !== p.id
      ) {
        return false;
      }
      return true;
    });
  }, [connecticutOnly, showAllPlants, carbonFilter, selectedPlant]);

  // Visible power plants after applying 0-Carbon / Fossil checkboxes, fuel filter, and search
  const visiblePlants = useMemo(() => {
    return scopedPlants.filter((p) => {
      const zero = isZeroCarbonFuel(p.primaryFuel);
      if (zero && !showZeroCarbonPlants) return false;
      if (!zero && !showFossilPlants) return false;
      if (!matchesFuelFilter(p.primaryFuel, carbonFilter)) return false;
      if (searchQuery.trim() && ledgerMode === 'stations') {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.primaryFuel.toLowerCase().includes(q) ||
          p.utility.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [
    scopedPlants,
    showZeroCarbonPlants,
    showFossilPlants,
    carbonFilter,
    searchQuery,
    ledgerMode,
  ]);

  // Zero-carbon vs fossil stats in current scope
  const plantBreakdown = useMemo(() => {
    let zeroCarbonCount = 0;
    let zeroCarbonMW = 0;
    let fossilCount = 0;
    let fossilMW = 0;
    for (const p of scopedPlants) {
      if (isZeroCarbonFuel(p.primaryFuel)) {
        zeroCarbonCount++;
        zeroCarbonMW += p.totalMW;
      } else {
        fossilCount++;
        fossilMW += p.totalMW;
      }
    }
    return {
      zeroCarbonCount,
      zeroCarbonMW: Math.round(zeroCarbonMW),
      fossilCount,
      fossilMW: Math.round(fossilMW),
    };
  }, [scopedPlants]);

  // Separate backbone (345–500 kV), regional (115–230 kV), and sub-transmission / primary town feeders (< 100 kV)
  const backboneLines = useMemo(
    () =>
      showBackbone345kV
        ? allCorridors.filter(
            (l) => (!connecticutOnly || l.isConnecticut) && l.voltageKV >= 345
          )
        : [],
    [allCorridors, connecticutOnly, showBackbone345kV]
  );

  const secondaryLines = useMemo(
    () =>
      showMinor115kV
        ? allCorridors.filter(
            (l) =>
              (!connecticutOnly || l.isConnecticut) &&
              l.voltageKV >= 100 &&
              l.voltageKV < 345
          )
        : [],
    [allCorridors, connecticutOnly, showMinor115kV]
  );

  const townFeederLines = useMemo(
    () =>
      showTownFeeders
        ? allCorridors.filter(
            (l) => (!connecticutOnly || l.isConnecticut) && l.voltageKV < 100
          )
        : [],
    [allCorridors, connecticutOnly, showTownFeeders]
  );

  // Filtered transmission corridors for Table 3 (deduplicating identical sub1-sub2 pairs for cleaner table reading while keeping all segments)
  const filteredCorridors = useMemo(() => {
    const pool = allCorridors.filter((l) => {
      if (connecticutOnly && !l.isConnecticut) return false;
      if (!showBackbone345kV && l.voltageKV >= 345) return false;
      if (!showMinor115kV && l.voltageKV >= 100 && l.voltageKV < 345) return false;
      if (!showTownFeeders && l.voltageKV < 100) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSub =
          l.sub1.toLowerCase().includes(q) ||
          l.sub2.toLowerCase().includes(q) ||
          l.corridorName.toLowerCase().includes(q) ||
          l.owner.toLowerCase().includes(q) ||
          l.type.toLowerCase().includes(q) ||
          String(l.voltageKV).includes(q);
        const matchesTown = l.townsTraversed.some((t) =>
          t.toLowerCase().includes(q)
        );
        const matchesPlant = l.nearbyStations.some((s) =>
          s.name.toLowerCase().includes(q)
        );
        return matchesSub || matchesTown || matchesPlant;
      }
      return isNamedSubstation(l.sub1) || isNamedSubstation(l.sub2);
    });

    // Sort so Cornwall / Torrington / Goshen sub-transmission & primary feeders appear at the very top
    return [...pool].sort((a, b) => {
      const aCornwall = a.id.startsWith('line-es-') ? 2 : a.townsTraversed.some(
        (t) => t.includes('Cornwall') || t.includes('Torrington') || t.includes('Goshen')
      )
        ? 1
        : 0;
      const bCornwall = b.id.startsWith('line-es-') ? 2 : b.townsTraversed.some(
        (t) => t.includes('Cornwall') || t.includes('Torrington') || t.includes('Goshen')
      )
        ? 1
        : 0;
      if (aCornwall !== bCornwall) return bCornwall - aCornwall;
      return b.lengthMiles - a.lengthMiles;
    });
  }, [
    allCorridors,
    connecticutOnly,
    showBackbone345kV,
    showMinor115kV,
    showTownFeeders,
    searchQuery,
  ]);

  // Show named substations (345 kV + named 115 kV switching stations)
  const visibleSubstations = useMemo(
    () =>
      showSubstations
        ? POWER_SUBSTATIONS.filter(
            (s) =>
              (!connecticutOnly || s.isConnecticut) &&
              isNamedSubstation(s.name) &&
              (s.maxVoltageKV >= 345 || s.connectedLines >= 2)
          )
        : [],
    [connecticutOnly, showSubstations]
  );

  const isZeroCarbonFocus =
    (showZeroCarbonPlants && !showFossilPlants) ||
    carbonFilter === 'nuclear' ||
    carbonFilter === 'hydro' ||
    carbonFilter === 'solar' ||
    carbonFilter === 'wind-battery';

  const handleSelectPreset = (preset: RegionPreset) => {
    setActivePresetId(preset.id);
    onChangeRegionId?.(preset.id);
    if (!preset.isCT && connecticutOnly) onToggleConnecticutOnly();
    if (!preset.isCT && excludeHyperscalers) onToggleExcludeHyperscalers();
    setMapCenter([preset.lat, preset.lng]);
    setMapZoom(preset.zoom);

    if (preset.highlightLineId) {
      const targetLine = allCorridors.find(
        (l) => l.id === preset.highlightLineId
      );
      if (targetLine) {
        setShowMinor115kV(true);
        setShowTownFeeders(true);
        setShowAllPlants(true);
        setSelectedLine(targetLine);
        setSelectedConnect(null);
        setSelectedPlant(null);
        setLedgerMode('lines');
        onChangeLedgerMode?.('lines');
      }
    }
  };

  const handleSelectConnect = (conn: DataCenterGridConnect, zoomIn = false) => {
    setSelectedConnect(conn);
    setSelectedPlant(null);
    setSelectedLine(null);
    onSelectFacilityId?.(conn.facilityId);
    onSelectPlantId?.(null);
    if (zoomIn) {
      setMapCenter([conn.facilityLat, conn.facilityLng]);
      setMapZoom(12);
      setActivePresetId('custom');
    }
  };

  const handleSelectPlant = (plant: PowerStation, zoomIn = false) => {
    setSelectedPlant(plant);
    setSelectedConnect(null);
    setSelectedLine(null);
    onSelectPlantId?.(plant.id);
    onSelectFacilityId?.(null);
    if (zoomIn) {
      setMapCenter([plant.lat, plant.lng]);
      setMapZoom(12);
      setActivePresetId('custom');
    }
  };

  const handleSelectLine = (
    line: EnrichedTransmissionCorridor,
    zoomIn = false
  ) => {
    setSelectedLine(line);
    setSelectedPlant(null);
    setSelectedConnect(null);
    onSelectPlantId?.(null);
    onSelectFacilityId?.(null);
    if (zoomIn && line.coordinates.length > 0) {
      const midIdx = Math.floor(line.coordinates.length / 2);
      setMapCenter(line.coordinates[midIdx]);
      setMapZoom(11);
      setActivePresetId('custom');
    }
  };

  return (
    <div className="bg-[#09090b] text-zinc-200 pt-8 pb-16 space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col lg:flex-row lg:items-baseline justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="space-y-1.5 max-w-2xl">
          <h1 className="text-xl sm:text-2xl font-normal tracking-tight text-white">
            High-Voltage Transmission Corridors &amp; Data Center Interconnects
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Spatial relationship between compute loads, utility step-down substations, and generating stations (U.S. EIA-860 &amp; DHS HIFLD). Use the checkboxes below to turn layers on/off, distinguish carbon-neutral (0-CO₂) vs. fossil power plants, or click any transmission line to trace its town-by-town route.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px]">
          <button
            type="button"
            onClick={onToggleConnecticutOnly}
            className="px-3 py-1.5 border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white transition cursor-pointer"
          >
            Scope:{' '}
            <strong className="text-white">
              {connecticutOnly ? 'CT · MA · Hudson Valley' : 'All U.S.'}
            </strong>
          </button>
          <button
            type="button"
            onClick={() => setShowAllPlants((p) => !p)}
            className={`px-3 py-1.5 border transition cursor-pointer ${
              showAllPlants
                ? 'border-zinc-400 text-white bg-zinc-900'
                : 'border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Toggle between major baseload plants (>= 25 MW) and all smaller solar/hydro/peaker generators (including Torrington Terminal 17.4 MW & Falls Village 9.9 MW)"
          >
            Plant Size:{' '}
            {showAllPlants
              ? 'All Generators (≥ 1 MW)'
              : 'Major Baseload (≥ 25 MW)'}
          </button>
        </div>
      </div>

      {/* Control Strip 1: Interactive Map Layer Checkboxes */}
      <div className="border border-zinc-800/90 bg-zinc-950/70 px-4 py-3.5 space-y-3.5">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="text-[10px] uppercase tracking-widest text-zinc-400 mr-1">
            LAYER CHECKBOXES:
          </span>

          {/* Checkbox: Data Centers */}
          <LayerCheckbox
            checked={showDataCenters}
            onChange={() => setShowDataCenters((p) => !p)}
            accentClass="border-emerald-500/60 bg-emerald-950/25 text-white"
            boxCheckedClass="bg-emerald-400 border-emerald-300 text-black"
            title="Turn Data Centers ON or OFF on the map"
          >
            <DataCenterIcon size={15} />
            <span>
              Data Centers ({showDataCenters ? filteredConnects.length : 0})
            </span>
          </LayerCheckbox>

          {/* Checkbox: Power Stations Master */}
          <LayerCheckbox
            checked={showPowerPlants}
            onChange={() => setShowPowerPlants((p) => !p)}
            accentClass="border-zinc-500 bg-zinc-900 text-white"
            boxCheckedClass="bg-white border-white text-black"
            title="Turn all Power Generating Stations ON or OFF on the map"
          >
            <span>
              Power Plants ({showPowerPlants ? visiblePlants.length : 0})
            </span>
          </LayerCheckbox>

          {/* Checkbox: 0-Carbon / Carbon-Neutral Plants */}
          <LayerCheckbox
            checked={showPowerPlants && showZeroCarbonPlants}
            onChange={() => {
              if (!showPowerPlants) {
                setShowPowerPlants(true);
                setShowZeroCarbonPlants(true);
              } else {
                setShowZeroCarbonPlants((p) => !p);
              }
            }}
            accentClass="border-cyan-500/60 bg-cyan-950/25 text-cyan-200"
            boxCheckedClass="bg-cyan-400 border-cyan-300 text-black"
            title="Toggle Carbon-Neutral / 0-CO₂ Power Plants (Circular Halo Icons: Nuclear, Hydro, Solar, Wind)"
          >
            <span className="w-3 h-3 rounded-full border-2 border-cyan-400 bg-cyan-950 inline-block shrink-0" />
            <span>
              0-CO₂ Carbon-Neutral ({plantBreakdown.zeroCarbonCount} ·{' '}
              {plantBreakdown.zeroCarbonMW.toLocaleString()} MW)
            </span>
          </LayerCheckbox>

          {/* Checkbox: Fossil / Carbon-Emitting Plants */}
          <LayerCheckbox
            checked={showPowerPlants && showFossilPlants}
            onChange={() => {
              if (!showPowerPlants) {
                setShowPowerPlants(true);
                setShowFossilPlants(true);
              } else {
                setShowFossilPlants((p) => !p);
              }
            }}
            accentClass="border-orange-500/60 bg-orange-950/25 text-orange-200"
            boxCheckedClass="bg-orange-400 border-orange-300 text-black"
            title="Toggle Carbon-Emitting / Fossil Power Plants (Square Industrial Icons: Natural Gas, Oil, Coal, Waste)"
          >
            <span className="w-3 h-3 rounded-[1px] border-2 border-orange-400 bg-zinc-950 inline-block shrink-0" />
            <span>
              Fossil / Emitting ({plantBreakdown.fossilCount} ·{' '}
              {plantBreakdown.fossilMW.toLocaleString()} MW)
            </span>
          </LayerCheckbox>

          {/* Checkbox: 345-500 kV Backbone */}
          <LayerCheckbox
            checked={showBackbone345kV}
            onChange={() => setShowBackbone345kV((p) => !p)}
            accentClass="border-amber-500/50 bg-amber-950/20 text-zinc-100"
            boxCheckedClass="bg-amber-400 border-amber-300 text-black"
          >
            <span
              className="w-4 h-[2.5px] inline-block"
              style={{
                backgroundColor: showBackbone345kV ? '#f59e0b' : '#52525b',
              }}
            />
            <span>345–500 kV Backbone ({backboneLines.length})</span>
          </LayerCheckbox>

          {/* Checkbox: 115-230 kV Regional */}
          <LayerCheckbox
            checked={showMinor115kV}
            onChange={() => setShowMinor115kV((p) => !p)}
            accentClass="border-sky-500/40 bg-sky-950/20 text-zinc-100"
            boxCheckedClass="bg-sky-400 border-sky-300 text-black"
          >
            <span
              className="w-4 h-[1.5px] inline-block"
              style={{
                backgroundColor: showMinor115kV ? '#7dd3fc' : '#52525b',
              }}
            />
            <span>115–230 kV Regional ({secondaryLines.length})</span>
          </LayerCheckbox>

          {/* Checkbox: 13-69 kV Sub-Transmission & Town Feeders */}
          <LayerCheckbox
            checked={showTownFeeders}
            onChange={() => setShowTownFeeders((p) => !p)}
            accentClass="border-teal-500/50 bg-teal-950/25 text-teal-100"
            boxCheckedClass="bg-teal-400 border-teal-300 text-black"
            title="Toggle 13–69 kV Sub-Transmission & 3-Phase Town Feeders (Eversource GIS & OSM: includes Route 4 & Route 7 lines into Cornwall, West Cornwall & Cornwall Bridge)"
          >
            <span
              className="w-4 h-[2px] inline-block"
              style={{
                backgroundColor: showTownFeeders ? '#2dd4bf' : '#52525b',
              }}
            />
            <span>13–69 kV Town Feeders ({townFeederLines.length})</span>
          </LayerCheckbox>

          {/* Checkbox: Substations */}
          <LayerCheckbox
            checked={showSubstations}
            onChange={() => setShowSubstations((p) => !p)}
            accentClass="border-amber-400/40 bg-zinc-900 text-zinc-100"
            boxCheckedClass="bg-amber-300 border-amber-200 text-black"
          >
            <span
              className="w-2.5 h-2.5 rounded-full border inline-block"
              style={{
                borderColor: showSubstations ? '#fbbf24' : '#52525b',
                backgroundColor: '#18181b',
              }}
            />
            <span>Substations ({visibleSubstations.length})</span>
          </LayerCheckbox>

          {/* Checkbox: Feeder Tie-Ins */}
          <LayerCheckbox
            checked={showAllTieIns}
            onChange={() => setShowAllTieIns((p) => !p)}
            accentClass="border-emerald-400/50 bg-emerald-950/20 text-zinc-100"
            boxCheckedClass="bg-emerald-400 border-emerald-300 text-black"
          >
            <span className="w-3.5 border-t border-dashed border-emerald-400 inline-block" />
            <span>Feeder Tie-Ins</span>
          </LayerCheckbox>

          {/* Checkbox: Labels */}
          <LayerCheckbox
            checked={showLabels}
            onChange={() => setShowLabels((p) => !p)}
            accentClass="border-zinc-700 bg-zinc-900 text-zinc-200"
            boxCheckedClass="bg-zinc-200 border-white text-black"
          >
            <span>Map Labels</span>
          </LayerCheckbox>
        </div>

        {/* Control Strip 2: Power Plant Icons & Carbon-Neutral vs. Emitting Visual Legend + Filter */}
        <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 mr-1">
              PLANT ICONS (CIRCLE HALO = 0-CO₂ · SQUARE = FOSSIL):
            </span>

            <button
              type="button"
              onClick={() => setCarbonFilter('all')}
              className={`px-2.5 py-1 border transition cursor-pointer ${
                carbonFilter === 'all'
                  ? 'bg-white text-black border-white font-semibold'
                  : 'border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              All Fuel Types ({scopedPlants.length})
            </button>

            {(
              [
                {
                  id: 'nuclear',
                  label: 'Nuclear',
                  fuel: 'nuclear' as FuelSourceType,
                  zero: true,
                },
                {
                  id: 'hydro',
                  label: 'Hydro / Pumped',
                  fuel: 'hydro' as FuelSourceType,
                  zero: true,
                },
                {
                  id: 'solar',
                  label: 'Solar',
                  fuel: 'solar' as FuelSourceType,
                  zero: true,
                },
                {
                  id: 'wind-battery',
                  label: 'Wind / Battery',
                  fuel: 'wind' as FuelSourceType,
                  zero: true,
                },
                {
                  id: 'natural-gas',
                  label: 'Natural Gas',
                  fuel: 'natural gas' as FuelSourceType,
                  zero: false,
                },
                {
                  id: 'oil-coal-biomass',
                  label: 'Oil / Coal / Waste',
                  fuel: 'petroleum' as FuelSourceType,
                  zero: false,
                },
              ] as const
            ).map((item) => {
              const isActive = carbonFilter === item.id;
              const count = scopedPlants.filter((p) =>
                matchesFuelFilter(p.primaryFuel, item.id)
              ).length;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setCarbonFilter((prev) =>
                      prev === item.id ? 'all' : item.id
                    )
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 border transition cursor-pointer ${
                    isActive
                      ? 'border-white bg-zinc-800 text-white font-semibold'
                      : item.zero
                        ? 'border-cyan-900/70 bg-cyan-950/15 text-zinc-200 hover:border-cyan-500/60 hover:text-white'
                        : 'border-zinc-800/90 bg-zinc-900/50 text-zinc-300 hover:border-orange-500/50 hover:text-white'
                  }`}
                >
                  <PlantFuelIcon fuel={item.fuel} size={18} />
                  <span>{item.label}</span>
                  {item.zero ? (
                    <span className="text-[9px] px-1 bg-cyan-950/80 text-cyan-300 border border-cyan-700/60">
                      0-CO₂
                    </span>
                  ) : (
                    <span className="text-[9px] px-1 bg-orange-950/60 text-orange-300 border border-orange-800/60">
                      CO₂
                    </span>
                  )}
                  <span className="text-zinc-500">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Map + Marginalia Annotation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Columns: Dark Political Base + High-Contrast Vector Map */}
        <div className="lg:col-span-8 space-y-2.5">
          {/* Region & Featured Corridor Links */}
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-zinc-500">
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
              {REGION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`transition cursor-pointer ${
                    activePresetId === preset.id
                      ? 'text-white border-b border-white pb-0.5 font-semibold'
                      : preset.highlightLineId
                        ? 'text-sky-300 hover:text-white'
                        : 'hover:text-zinc-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <span className="text-[10px] text-zinc-500">
              Click any power line, station, or data center to inspect
            </span>
          </div>

          {/* Map Viewport */}
          <div className="relative h-[500px] sm:h-[540px] w-full bg-[#1b1d20] border border-zinc-800 overflow-hidden">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              minZoom={4}
              maxZoom={18}
              zoomControl={false}
              scrollWheelZoom={true}
              className="h-full w-full z-0 bg-[#1b1d20]"
            >
              <MapViewportController center={mapCenter} zoom={mapZoom} />

              {/* ESRI Dark Gray Canvas Base */}
              <TileLayer
                attribution="ESRI"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                maxNativeZoom={16}
                maxZoom={18}
              />

              {/* Political Boundaries & Place Labels */}
              {showLabels && (
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                  maxNativeZoom={16}
                  maxZoom={18}
                  opacity={0.9}
                />
              )}

              <CustomZoomControls
                lat={mapCenter[0]}
                lng={mapCenter[1]}
                defaultZoom={mapZoom}
              />

              {/* Layer 0: 13–69 kV Sub-Transmission & 3-Phase Primary Town Feeders (Eversource GIS & OSM) */}
              {townFeederLines.map((line) => {
                const isSelected = selectedLine?.id === line.id;
                const isCornwallFeeder = line.id.startsWith('line-es-');
                return (
                  <Polyline
                    key={line.id}
                    positions={line.coordinates}
                    pathOptions={{
                      color: isSelected
                        ? '#ffffff'
                        : isCornwallFeeder
                          ? '#2dd4bf'
                          : '#34d399',
                      weight: isSelected ? 3.75 : isCornwallFeeder ? 2.5 : 1.8,
                      opacity: isSelected ? 1 : 0.9,
                      dashArray: line.voltageKV < 25 && !isSelected ? '5 3' : undefined,
                    }}
                    eventHandlers={{
                      click: () => handleSelectLine(line),
                    }}
                  >
                    <Tooltip sticky>
                      <div className="font-mono text-[11px] space-y-0.5">
                        <div>
                          <strong className="text-teal-300">
                            {line.voltageKV} kV Feeder
                          </strong>{' '}
                          · {line.sub1} ↔ {line.sub2} ({line.lengthMiles} mi)
                        </div>
                        <div className="text-[10px] text-zinc-300">
                          {line.owner} · {line.type}
                        </div>
                        {line.townsTraversed.length > 0 && (
                          <div className="text-[10px] text-teal-300">
                            Towns: {line.townsTraversed.join(' → ')}
                          </div>
                        )}
                        <div className="text-[9px] text-zinc-400">
                          Click line to inspect route &amp; substations
                        </div>
                      </div>
                    </Tooltip>
                  </Polyline>
                );
              })}

              {/* Layer 1: 115–230 kV Regional Sub-transmission — Clickable Corridors */}
              {secondaryLines.map((line) => {
                const isSelected = selectedLine?.id === line.id;
                return (
                  <Polyline
                    key={line.id}
                    positions={line.coordinates}
                    pathOptions={{
                      color: isSelected ? '#ffffff' : '#7dd3fc',
                      weight: isSelected ? 3.5 : 1.75,
                      opacity: isSelected ? 1 : 0.72,
                    }}
                    eventHandlers={{
                      click: () => handleSelectLine(line),
                    }}
                  >
                    <Tooltip sticky>
                      <div className="font-mono text-[11px] space-y-0.5">
                        <div>
                          <strong>{line.voltageKV} kV</strong> · {line.sub1} ↔{' '}
                          {line.sub2} ({line.lengthMiles} mi)
                        </div>
                        {line.townsTraversed.length > 0 && (
                          <div className="text-[10px] text-sky-300">
                            Towns: {line.townsTraversed.join(' → ')}
                          </div>
                        )}
                        <div className="text-[9px] text-zinc-400">
                          Click line to inspect route &amp; substations
                        </div>
                      </div>
                    </Tooltip>
                  </Polyline>
                );
              })}

              {/* Layer 2: 345–500 kV Bulk Backbone — Clickable Corridors */}
              {backboneLines.map((line) => {
                const isSelected = selectedLine?.id === line.id;
                return (
                  <Polyline
                    key={line.id}
                    positions={line.coordinates}
                    pathOptions={{
                      color: isSelected ? '#ffffff' : '#f59e0b',
                      weight: isSelected ? 4 : 2.5,
                      opacity: isSelected ? 1 : 0.92,
                    }}
                    eventHandlers={{
                      click: () => handleSelectLine(line),
                    }}
                  >
                    <Tooltip sticky>
                      <div className="font-mono text-[11px] space-y-0.5">
                        <div>
                          <strong>{line.voltageKV} kV Backbone</strong> ·{' '}
                          {line.sub1} ↔ {line.sub2} ({line.lengthMiles} mi)
                        </div>
                        {line.townsTraversed.length > 0 && (
                          <div className="text-[10px] text-amber-300">
                            Towns: {line.townsTraversed.join(' → ')}
                          </div>
                        )}
                        <div className="text-[9px] text-zinc-400">
                          Click line to inspect route &amp; substations
                        </div>
                      </div>
                    </Tooltip>
                  </Polyline>
                );
              })}

              {/* Highlighted Selected Transmission Line & GPS Right-of-Way Vertices */}
              {selectedLine && (
                <>
                  <Polyline
                    positions={selectedLine.coordinates}
                    pathOptions={{
                      color: '#38bdf8',
                      weight: 5,
                      opacity: 0.4,
                    }}
                  />
                  {selectedLine.coordinates.map(([lat, lng], idx) => {
                    const isEndpoint =
                      idx === 0 || idx === selectedLine.coordinates.length - 1;
                    return (
                      <CircleMarker
                        key={`v-${idx}`}
                        center={[lat, lng]}
                        radius={isEndpoint ? 5.5 : 3}
                        pathOptions={{
                          color: '#ffffff',
                          fillColor: isEndpoint ? '#f59e0b' : '#0284c7',
                          fillOpacity: 1,
                          weight: isEndpoint ? 2 : 1.25,
                        }}
                      >
                        <Tooltip direction="top">
                          <span className="font-mono text-[10px]">
                            ROW Vertex #{idx + 1} ({lat.toFixed(4)}°N,{' '}
                            {Math.abs(lng).toFixed(4)}°W)
                          </span>
                        </Tooltip>
                      </CircleMarker>
                    );
                  })}
                </>
              )}

              {/* Layer 3: Utility Substations (345 kV amber, 115 kV sky, & <100 kV teal town nodes) */}
              {visibleSubstations.map((sub: PowerSubstation) => {
                const is345 = sub.maxVoltageKV >= 345;
                const isTownSub = sub.maxVoltageKV < 100;
                const isCornwallHighlight =
                  (activePresetId === 'torrington-cornwall' ||
                    selectedLine?.id.startsWith('line-es-') ||
                    selectedLine?.id === 'line-28008' ||
                    selectedLine?.id === 'line-1349') &&
                  (sub.id === 'sub-ct-cornwall-37j' ||
                    sub.id === 'sub-ct-west-goshen-33m' ||
                    sub.id === 'sub-ct-cornwall-bridge' ||
                    sub.id === 'sub-ct-west-cornwall' ||
                    sub.id === 'sub-ct-torrington-terminal' ||
                    sub.id === 'sub-ct-falls-village');
                return (
                  <CircleMarker
                    key={sub.id}
                    center={[sub.lat, sub.lng]}
                    radius={
                      isCornwallHighlight
                        ? 5
                        : is345
                          ? 3.2
                          : isTownSub
                            ? 3.5
                            : 2.5
                    }
                    pathOptions={{
                      color: is345
                        ? '#fbbf24'
                        : isTownSub
                          ? '#2dd4bf'
                          : '#38bdf8',
                      fillColor: isCornwallHighlight ? '#042f2e' : '#18181b',
                      fillOpacity: 1,
                      weight: isCornwallHighlight ? 2 : is345 ? 1.5 : 1.2,
                    }}
                  >
                    <Tooltip
                      permanent={isCornwallHighlight}
                      direction="top"
                      offset={[0, -5]}
                    >
                      <span className="font-mono text-[10px]">
                        <strong>{sub.name}</strong> ({sub.maxVoltageKV} kV)
                      </span>
                    </Tooltip>
                  </CircleMarker>
                );
              })}

              {/* Optional: All Data Center -> Substation Tie-In Vectors */}
              {showAllTieIns &&
                filteredConnects.map((conn) => (
                  <Polyline
                    key={`tie-${conn.facilityId}`}
                    positions={[
                      [conn.facilityLat, conn.facilityLng],
                      [conn.nearestSubstationLat, conn.nearestSubstationLng],
                    ]}
                    pathOptions={{
                      color: '#34d399',
                      weight: 1.2,
                      dashArray: '3 4',
                      opacity: 0.65,
                    }}
                  />
                ))}

              {/* Layer 4: Active Selection Feeder Vector */}
              {selectedConnect && (
                <>
                  {/* Data Center -> Nearest Substation Feeder */}
                  <Polyline
                    positions={[
                      [
                        selectedConnect.facilityLat,
                        selectedConnect.facilityLng,
                      ],
                      [
                        selectedConnect.nearestSubstationLat,
                        selectedConnect.nearestSubstationLng,
                      ],
                    ]}
                    pathOptions={{
                      color: '#ffffff',
                      weight: 2,
                      dashArray: '4 4',
                      opacity: 1,
                    }}
                  />
                  {/* Data Center -> Nearest Baseload Power Station */}
                  <Polyline
                    positions={[
                      [
                        selectedConnect.facilityLat,
                        selectedConnect.facilityLng,
                      ],
                      isZeroCarbonFocus
                        ? [
                            selectedConnect.nearestZeroCarbonPlantLat,
                            selectedConnect.nearestZeroCarbonPlantLng,
                          ]
                        : [
                            selectedConnect.nearestPlantLat,
                            selectedConnect.nearestPlantLng,
                          ],
                    ]}
                    pathOptions={{
                      color: getFuelVisual(
                        isZeroCarbonFocus
                          ? selectedConnect.nearestZeroCarbonPlantFuel
                          : selectedConnect.nearestPlantFuel
                      ).color,
                      weight: 1.75,
                      dashArray: '2 5',
                      opacity: 0.9,
                    }}
                  />
                  {/* Highlighted Nearest Substation Endpoint */}
                  <CircleMarker
                    center={[
                      selectedConnect.nearestSubstationLat,
                      selectedConnect.nearestSubstationLng,
                    ]}
                    radius={5}
                    pathOptions={{
                      color: '#ffffff',
                      fillColor: '#09090b',
                      fillOpacity: 1,
                      weight: 2,
                    }}
                  >
                    <Tooltip permanent direction="top" offset={[0, -6]}>
                      <span className="font-mono text-[10px]">
                        {selectedConnect.nearestSubstationName} (
                        {selectedConnect.nearestSubstationVoltageKV} kV ·{' '}
                        {selectedConnect.distanceToSubstationMiles} mi)
                      </span>
                    </Tooltip>
                  </CircleMarker>
                </>
              )}

              {/* Layer 5: Power Generating Stations — Custom Compact Fuel & Carbon Icons */}
              {showPowerPlants &&
                visiblePlants.map((plant) => {
                  const fuelVis = getFuelVisual(plant.primaryFuel);
                  const isSelected =
                    selectedPlant?.id === plant.id ||
                    (isZeroCarbonFocus
                      ? selectedConnect?.nearestZeroCarbonPlantName ===
                        plant.name
                      : selectedConnect?.nearestPlantName === plant.name);
                  const icon = getPowerPlantDivIcon(
                    plant.primaryFuel,
                    plant.totalMW,
                    isSelected
                  );
                  return (
                    <Marker
                      key={plant.id}
                      position={[plant.lat, plant.lng]}
                      icon={icon}
                      eventHandlers={{
                        click: () => handleSelectPlant(plant),
                      }}
                    >
                      <Tooltip direction="top" offset={[0, -8]}>
                        <span className="font-mono text-[11px]">
                          <strong>{plant.name}</strong> · {plant.totalMW} MW (
                          {fuelVis.label}) — {plant.city}, {plant.state}
                        </span>
                      </Tooltip>
                    </Marker>
                  );
                })}

              {/* Layer 6: Data Centers — Custom Compact Server Rack Icons */}
              {showDataCenters &&
                filteredConnects.map((conn) => {
                  const isSelected =
                    selectedConnect?.facilityId === conn.facilityId;
                  return (
                    <Marker
                      key={conn.facilityId}
                      position={[conn.facilityLat, conn.facilityLng]}
                      icon={getDataCenterDivIcon(isSelected)}
                      eventHandlers={{
                        click: () => handleSelectConnect(conn),
                      }}
                    >
                      <Tooltip direction="top" offset={[0, -8]}>
                        <span className="font-mono text-[11px]">
                          <strong>{conn.facilityName}</strong> (
                          {conn.powerCapacityMW}) · {conn.city}
                        </span>
                      </Tooltip>
                    </Marker>
                  );
                })}
            </MapContainer>
          </div>
        </div>

        {/* Right 4 Columns: Tufte Marginalia / Active Specimen Callout */}
        <div className="lg:col-span-4 space-y-6 pt-6">
          {selectedLine ? (
            <div className="space-y-5 border-t border-sky-500/60 pt-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-sky-400">
                  <span>
                    TRANSMISSION CORRIDOR · {selectedLine.voltageKV} KV{' '}
                    {selectedLine.type}
                  </span>
                </div>
                <h2 className="text-lg font-normal text-white leading-snug">
                  {selectedLine.corridorName}
                </h2>
                <div className="font-mono text-xs text-zinc-400">
                  {selectedLine.owner} · {selectedLine.lengthMiles} mi right-of-way
                </div>
              </div>

              {/* Towns Traversed Callout */}
              <div className="border border-sky-900/70 bg-sky-950/20 p-3 space-y-2">
                <div className="font-mono text-[10px] uppercase tracking-wider text-sky-300">
                  Towns Traversed Along Route (Start → End)
                </div>
                {selectedLine.townsTraversed.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-white">
                    {selectedLine.townsTraversed.map((townName, idx) => (
                      <span key={townName} className="inline-flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-100">
                          {townName}
                        </span>
                        {idx < selectedLine.townsTraversed.length - 1 && (
                          <span className="text-sky-400">→</span>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="font-mono text-xs text-zinc-400">
                    {selectedLine.sub1} → {selectedLine.sub2}
                  </div>
                )}
              </div>

              <dl className="divide-y divide-zinc-900 border-y border-zinc-800/80 font-mono text-xs">
                <div className="py-2.5 flex justify-between">
                  <dt className="text-zinc-500">Operating Voltage</dt>
                  <dd className="text-amber-400 font-semibold tabular-nums">
                    {selectedLine.voltageKV} kV ({selectedLine.type})
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-zinc-500">Terminal Substations</dt>
                  <dd className="text-white text-right">
                    {selectedLine.sub1} ↔ {selectedLine.sub2}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-zinc-500">Corridor Length / Vertices</dt>
                  <dd className="text-zinc-200 tabular-nums">
                    {selectedLine.lengthMiles} mi ({selectedLine.coordinates.length} GPS pts)
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-zinc-500">Start / End Coordinates</dt>
                  <dd className="text-zinc-400 tabular-nums text-right">
                    {selectedLine.coordinates[0][0].toFixed(3)}°N,{' '}
                    {selectedLine.coordinates[0][1].toFixed(3)}°W →{' '}
                    {selectedLine.coordinates[
                      selectedLine.coordinates.length - 1
                    ][0].toFixed(3)}
                    °N,{' '}
                    {selectedLine.coordinates[
                      selectedLine.coordinates.length - 1
                    ][1].toFixed(3)}
                    °W
                  </dd>
                </div>
              </dl>

              {/* Connected / Nearby Generating Stations along this line */}
              {selectedLine.nearbyStations.length > 0 && (
                <div className="space-y-2">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    Generating Stations Along This Corridor (≤ 3.5 mi)
                  </div>
                  <div className="space-y-1.5">
                    {selectedLine.nearbyStations.map((st) => {
                      const fullPlant = POWER_STATIONS.find(
                        (p) => p.id === st.id
                      );
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            if (fullPlant) {
                              if (fullPlant.totalMW < 25) setShowAllPlants(true);
                              handleSelectPlant(fullPlant, true);
                            }
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 border border-zinc-800/90 bg-zinc-950 hover:border-zinc-600 text-left font-mono text-xs transition cursor-pointer"
                        >
                          <span className="inline-flex items-center gap-2 text-zinc-200">
                            <PlantFuelIcon fuel={st.primaryFuel} size={16} />
                            <span>{st.name}</span>
                            <span className="text-zinc-500">({st.city})</span>
                          </span>
                          <span className="text-zinc-400 tabular-nums">
                            {st.totalMW} MW · {st.distanceMiles} mi
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Interactive Cornwall & Litchfield Hills Feeder Topology Switcher */}
              <div className="border border-teal-800/70 bg-teal-950/20 p-3 space-y-2.5">
                <div className="font-mono text-[10px] uppercase tracking-wider text-teal-300">
                  Cornwall &amp; NW CT Feeder Topology (Click to Trace)
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  {[
                    {
                      id: 'line-es-14r31-torrington-goshen',
                      badge: '27.6 kV',
                      label: 'Torrington Terminal → West Goshen 33M (Rt 4)',
                    },
                    {
                      id: 'line-es-14r31-goshen-cornwall',
                      badge: '27.6 kV',
                      label: 'West Goshen 33M → Cornwall 37J Sub (Rt 4)',
                    },
                    {
                      id: 'line-es-37j1-cornwall-bridge',
                      badge: '8.32 kV',
                      label: 'Cornwall 37J → Cornwall Center → Cornwall Bridge',
                    },
                    {
                      id: 'line-es-37j1-west-cornwall',
                      badge: '8.32 kV',
                      label: 'Cornwall 37J → Cornwall Center → West Cornwall',
                    },
                    {
                      id: 'line-es-4l09-falls-village-west-cornwall',
                      badge: '13.2 kV',
                      label: 'Falls Village 4L → West Cornwall (US Rt 7)',
                    },
                    {
                      id: 'line-es-23r1-bulls-bridge-cornwall-bridge',
                      badge: '22.8 kV',
                      label: 'Bulls Bridge / Kent → Cornwall Bridge (US Rt 7)',
                    },
                    {
                      id: 'line-28008',
                      badge: '115 kV',
                      label: 'East Ridge Bypass (Torrington ↔ Falls Village)',
                    },
                  ].map((item) => {
                    const target = allCorridors.find((c) => c.id === item.id);
                    if (!target) return null;
                    const active = selectedLine.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectLine(target, false)}
                        className={`w-full flex items-center justify-between px-2 py-1 border text-left transition cursor-pointer ${
                          active
                            ? 'border-teal-400 bg-teal-950/70 text-white font-semibold'
                            : 'border-zinc-800/90 bg-zinc-950/80 text-zinc-300 hover:border-teal-500/60 hover:text-white'
                        }`}
                      >
                        <span className="truncate pr-2">{item.label}</span>
                        <span
                          className={`shrink-0 text-[10px] px-1.5 py-0.5 border ${
                            item.badge === '115 kV'
                              ? 'border-sky-700/70 bg-sky-950/60 text-sky-300'
                              : 'border-teal-700/70 bg-teal-950/60 text-teal-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Methodology Explanation: Why Federal Bulk Maps Miss Cornwall & How We Found the Real Lines */}
              <div className="border border-zinc-800 bg-zinc-950/80 p-3.5 space-y-2 text-[11px] leading-relaxed text-zinc-400">
                <div className="font-mono text-[10px] uppercase tracking-wider text-amber-400">
                  How We Figure Out Power Lines to Cornwall (HIFLD vs. Eversource GIS)
                </div>
                <p>
                  <strong className="text-zinc-200">1. Why the 115 kV Line Misses Cornwall:</strong>{' '}
                  Federal DHS HIFLD data only tracks bulk transmission (≥69 kV). Eversource&apos;s{' '}
                  <code className="text-sky-300">Lines 689 &amp; 693</code> (
                  <code className="text-zinc-200">TORRINGTON TERMINAL ↔ FALLS VILLAGE</code>) cut diagonally across the eastern ridge through{' '}
                  <strong className="text-white">Mohawk Mountain / Cornwall Hollow</strong>—5 miles east of Cornwall Village, West Cornwall, and Cornwall Bridge, without stepping down!
                </p>
                <p>
                  <strong className="text-zinc-200">2. How Power Actually Reaches Cornwall:</strong>{' '}
                  By querying Eversource&apos;s Connecticut Hosting Capacity GIS (<code className="text-teal-300">DG_Hosting_CT_Final</code>), we traced the real{' '}
                  <strong className="text-teal-300">27.6 kV sub-transmission line (Circuit 14R31)</strong> from Campville &amp; Torrington west along <strong className="text-white">CT Route 4</strong> through{' '}
                  <strong className="text-white">West Goshen Substation (33M)</strong> directly into{' '}
                  <strong className="text-white">Cornwall Substation (37J · 41.8481°N, 73.3124°W)</strong>.
                </p>
                <p>
                  <strong className="text-zinc-200">3. Cornwall 3-Phase Primary Feeders:</strong>{' '}
                  From <code className="text-teal-300">CORNWALL 37J</code>, 8.32 kV 3-phase backbone{' '}
                  <code className="text-teal-300">Circuit 37J1</code> feeds <strong className="text-white">Cornwall Center</strong>, branching down Route 4 to{' '}
                  <strong className="text-white">Cornwall Bridge</strong> (where it meets Bulls Bridge/Kent 22.8 kV <code className="text-teal-300">Circuit 23R1</code>) and up Route 125 to{' '}
                  <strong className="text-white">West Cornwall</strong> (meeting Falls Village 13.2 kV <code className="text-teal-300">Circuit 4L09</code>).
                </p>
              </div>
            </div>
          ) : selectedPlant ? (
            <div className="space-y-5 border-t border-zinc-800 pt-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
                  <PlantFuelIcon fuel={selectedPlant.primaryFuel} size={20} />
                  <span
                    style={{
                      color: getFuelVisual(selectedPlant.primaryFuel).color,
                    }}
                  >
                    Generating Station · EIA-860
                  </span>
                  {isZeroCarbonFuel(selectedPlant.primaryFuel) ? (
                    <span className="px-1.5 py-0.5 bg-cyan-950/80 text-cyan-300 border border-cyan-800/70 text-[9px]">
                      0-CO₂ CARBON-NEUTRAL
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-orange-950/70 text-orange-300 border border-orange-800/70 text-[9px]">
                      FOSSIL / EMITTING
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-normal text-white leading-snug">
                  {selectedPlant.name}
                </h2>
                <div className="font-mono text-xs text-zinc-400">
                  {selectedPlant.city}, {selectedPlant.state} ·{' '}
                  {selectedPlant.utility}
                </div>
              </div>

              <dl className="divide-y divide-zinc-900 border-y border-zinc-800/80 font-mono text-xs">
                <div className="py-2.5 flex justify-between">
                  <dt className="text-zinc-500">Nameplate Capacity</dt>
                  <dd className="text-white tabular-nums">
                    {selectedPlant.totalMW} MW
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <dt className="text-zinc-500">Primary Fuel</dt>
                  <dd className="text-zinc-200 capitalize inline-flex items-center gap-2">
                    <PlantFuelIcon fuel={selectedPlant.primaryFuel} size={18} />
                    <span>
                      {getFuelVisual(selectedPlant.primaryFuel).label}
                    </span>
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-zinc-500">Prime Mover</dt>
                  <dd className="text-zinc-300 text-right">
                    {selectedPlant.techDescription}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-zinc-500">Coordinates</dt>
                  <dd className="text-zinc-400 tabular-nums">
                    {selectedPlant.lat.toFixed(4)},{' '}
                    {selectedPlant.lng.toFixed(4)}
                  </dd>
                </div>
              </dl>

              <div className="flex items-center justify-between font-mono text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMapCenter([selectedPlant.lat, selectedPlant.lng]);
                    setMapZoom(17);
                  }}
                  className="text-zinc-300 hover:text-white underline underline-offset-4 cursor-pointer"
                >
                  Zoom to switchyard (17z)
                </button>
                <a
                  href={`https://www.google.com/maps/@${selectedPlant.lat},${selectedPlant.lng},17z/data=!3m1!1e3`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-200"
                >
                  <span>Satellite</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : selectedConnect ? (
            <div className="space-y-5 border-t border-zinc-800 pt-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                  <DataCenterIcon size={16} />
                  <span>Selected Compute Node · {selectedConnect.subtype}</span>
                </div>
                <h2 className="text-lg font-normal text-white leading-snug">
                  {selectedConnect.facilityName}
                </h2>
                <div className="font-mono text-xs text-zinc-400">
                  {selectedConnect.city}, {selectedConnect.stateOrCountry} ·{' '}
                  {selectedConnect.operator}
                </div>
              </div>

              {/* Clean Tufte Key-Value Ledger */}
              <dl className="divide-y divide-zinc-900 border-y border-zinc-800/80 font-mono text-xs">
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-zinc-500">Estimated IT Load</dt>
                  <dd className="text-white tabular-nums">
                    {selectedConnect.powerCapacityMW}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-zinc-500">Utility Territory</dt>
                  <dd className="text-zinc-300 text-right">
                    {selectedConnect.utilityTerritory}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-zinc-500">Nearest Substation</dt>
                  <dd className="text-white text-right tabular-nums">
                    {selectedConnect.nearestSubstationName} (
                    {selectedConnect.nearestSubstationVoltageKV} kV)
                    <span className="block text-[11px] text-zinc-500">
                      {selectedConnect.distanceToSubstationMiles} mi crow-flies
                    </span>
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-zinc-500">Transmission Corridor</dt>
                  <dd className="text-zinc-300 text-right tabular-nums">
                    {selectedConnect.nearestLineCorridor}
                    <span className="block text-[11px] text-zinc-500">
                      {selectedConnect.distanceToLineMiles} mi to right-of-way
                    </span>
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-zinc-500">Nearest Baseload Plant</dt>
                  <dd className="text-right tabular-nums">
                    <span className="inline-flex items-center justify-end gap-1.5 text-zinc-100">
                      <PlantFuelIcon
                        fuel={selectedConnect.nearestPlantFuel}
                        size={16}
                      />
                      <span>
                        {selectedConnect.nearestPlantName} (
                        {selectedConnect.nearestPlantMW} MW)
                      </span>
                    </span>
                    <span className="block text-[11px] text-zinc-500 capitalize">
                      {getFuelVisual(selectedConnect.nearestPlantFuel).label} ·{' '}
                      {selectedConnect.distanceToPlantMiles} mi
                    </span>
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-cyan-400/90">Nearest 0-Carbon Plant</dt>
                  <dd className="text-right tabular-nums">
                    <span className="inline-flex items-center justify-end gap-1.5 text-cyan-200">
                      <PlantFuelIcon
                        fuel={selectedConnect.nearestZeroCarbonPlantFuel}
                        size={16}
                      />
                      <span>
                        {selectedConnect.nearestZeroCarbonPlantName} (
                        {selectedConnect.nearestZeroCarbonPlantMW} MW)
                      </span>
                    </span>
                    <span className="block text-[11px] text-zinc-500 capitalize">
                      {
                        getFuelVisual(
                          selectedConnect.nearestZeroCarbonPlantFuel
                        ).label
                      }{' '}
                      · {selectedConnect.distanceToZeroCarbonPlantMiles} mi
                    </span>
                  </dd>
                </div>
              </dl>

              <div className="flex items-center justify-between font-mono text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const fac = FACILITY_LOCATIONS.find(
                      (f) => f.id === selectedConnect.facilityId
                    );
                    if (fac) onPlayFacility(fac);
                  }}
                  className="text-white hover:text-zinc-300 underline underline-offset-4 cursor-pointer"
                >
                  Compare in Arena →
                </button>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setMapCenter([
                        selectedConnect.facilityLat,
                        selectedConnect.facilityLng,
                      ]);
                      setMapZoom(16);
                    }}
                    className="text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Zoom 16z
                  </button>
                  <a
                    href={`https://www.google.com/maps/@${selectedConnect.facilityLat},${selectedConnect.facilityLng},18z/data=!3m1!1e3`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-200"
                  >
                    <span>Satellite</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ) : null}

          {/* Quick Callout for Torrington <-> Cornwall Transmission Inquiry */}
          <div className="border border-zinc-800/90 bg-zinc-950/60 p-3.5 space-y-2 font-mono text-[11px]">
            <div className="flex items-center justify-between text-sky-300">
              <span>CORRIDOR TRACE: TORRINGTON ↔ CORNWALL</span>
              <button
                type="button"
                onClick={() => {
                  const preset = REGION_PRESETS.find(
                    (p) => p.id === 'torrington-cornwall'
                  );
                  if (preset) handleSelectPreset(preset);
                }}
                className="underline underline-offset-4 text-white hover:text-sky-300 cursor-pointer"
              >
                Inspect on Map →
              </button>
            </div>
            <p className="font-sans text-zinc-400 leading-relaxed">
              The 115 kV lines crossing from{' '}
              <strong className="text-zinc-200">Torrington</strong> through{' '}
              <strong className="text-zinc-200">Goshen</strong> and{' '}
              <strong className="text-zinc-200">Cornwall</strong> are Eversource’s{' '}
              <span className="font-mono text-zinc-200">
                TORRINGTON TERMINAL ↔ FALLS VILLAGE
              </span>{' '}
              circuits (19.2 mi). See{' '}
              <button
                type="button"
                onClick={() => {
                  setLedgerMode('lines');
                  onChangeLedgerMode?.('lines');
                }}
                className="text-sky-300 underline underline-offset-2 cursor-pointer"
              >
                Table 3 (Transmission Corridors)
              </button>{' '}
              below for the full town-by-town directory.
            </p>
          </div>
        </div>
      </div>

      {/* Tabular Ledgers: Table 1 (Data Centers), Table 2 (Power Stations), Table 3 (Transmission Lines & Town Corridors) */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col lg:flex-row lg:items-baseline justify-between gap-4 border-b border-zinc-800 pb-3">
          <div className="flex flex-wrap items-baseline gap-6 font-mono text-xs">
            <button
              type="button"
              onClick={() => {
                setLedgerMode('datacenters');
                onChangeLedgerMode?.('datacenters');
              }}
              className={`cursor-pointer transition ${
                ledgerMode === 'datacenters'
                  ? 'text-white border-b border-white pb-1 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Table 1. Data Center Tie-Ins ({filteredConnects.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setLedgerMode('stations');
                onChangeLedgerMode?.('stations');
              }}
              className={`cursor-pointer transition ${
                ledgerMode === 'stations'
                  ? 'text-white border-b border-white pb-1 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Table 2. Power Generating Stations ({visiblePlants.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setLedgerMode('lines');
                onChangeLedgerMode?.('lines');
              }}
              className={`cursor-pointer transition ${
                ledgerMode === 'lines'
                  ? 'text-sky-300 border-b border-sky-300 pb-1 font-semibold'
                  : 'text-sky-400/80 hover:text-sky-300'
              }`}
            >
              Table 3. Transmission Lines &amp; Town Corridors (
              {filteredCorridors.length})
            </button>
          </div>

          <div className="flex items-center gap-3">
            {searchQuery.trim() &&
              ledgerMode !== 'lines' &&
              filteredCorridors.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setLedgerMode('lines');
                    onChangeLedgerMode?.('lines');
                  }}
                  className="font-mono text-[11px] text-sky-400 hover:text-sky-300 underline underline-offset-4 cursor-pointer"
                >
                  {filteredCorridors.length} matching power lines in Table 3 →
                </button>
              )}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onChangeSearchQuery?.(e.target.value);
              }}
              placeholder="Filter by town (e.g. Cornwall, Torrington)..."
              className="bg-transparent border-b border-zinc-800 focus:border-zinc-400 py-1 font-mono text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none w-72"
            />
          </div>
        </div>

        {ledgerMode === 'datacenters' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-zinc-700 text-[10px] uppercase tracking-wider text-zinc-500">
                  <th className="py-2.5 pr-4 font-normal">Facility</th>
                  <th className="py-2.5 px-4 font-normal">Municipality</th>
                  <th className="py-2.5 px-4 font-normal text-right">Est. Load</th>
                  <th className="py-2.5 px-4 font-normal">Nearest Substation</th>
                  <th className="py-2.5 px-4 font-normal text-right">
                    Substation Dist.
                  </th>
                  <th className="py-2.5 px-4 font-normal text-right">Line kV</th>
                  <th className="py-2.5 px-4 font-normal">
                    Nearest Baseload Station
                  </th>
                  <th className="py-2.5 pl-4 font-normal text-cyan-400/90">
                    Nearest 0-Carbon Station
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filteredConnects.map((conn) => {
                  const isSelected =
                    selectedConnect?.facilityId === conn.facilityId;
                  const mwNum = parseNumericMW(conn.powerCapacityMW);
                  const mwBarPct = Math.min(
                    100,
                    Math.max(4, (mwNum / 60) * 100)
                  );
                  const distBarPct = Math.min(
                    100,
                    Math.max(4, (conn.distanceToSubstationMiles / 8) * 100)
                  );

                  return (
                    <tr
                      key={conn.facilityId}
                      onClick={() => handleSelectConnect(conn, true)}
                      className={`transition cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-900/90 text-white'
                          : 'hover:bg-zinc-950 text-zinc-300'
                      }`}
                    >
                      <td className="py-2.5 pr-4 font-sans text-xs text-white">
                        <span className="inline-flex items-center gap-2">
                          <DataCenterIcon size={14} />
                          <span>{conn.facilityName}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-zinc-400 whitespace-nowrap">
                        {conn.city},{' '}
                        {conn.stateOrCountry.replace(', USA', '')}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2">
                          <span className="text-zinc-200">
                            {conn.powerCapacityMW}
                          </span>
                          <span className="w-12 h-1 bg-zinc-900 inline-block overflow-hidden">
                            <span
                              className="block h-full bg-zinc-400"
                              style={{ width: `${mwBarPct}%` }}
                            />
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-zinc-300 whitespace-nowrap">
                        {conn.nearestSubstationName}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2">
                          <span>
                            {conn.distanceToSubstationMiles.toFixed(2)} mi
                          </span>
                          <span className="w-10 h-1 bg-zinc-900 inline-block overflow-hidden">
                            <span
                              className="block h-full bg-zinc-500"
                              style={{ width: `${distBarPct}%` }}
                            />
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums whitespace-nowrap">
                        <span
                          className={
                            conn.nearestLineVoltageKV >= 345
                              ? 'text-amber-400'
                              : 'text-zinc-400'
                          }
                        >
                          {conn.nearestLineVoltageKV} kV
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-zinc-300 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <PlantFuelIcon
                            fuel={conn.nearestPlantFuel}
                            size={15}
                          />
                          <span>{conn.nearestPlantName}</span>
                          <span className="text-zinc-600">
                            ({conn.nearestPlantMW} MW ·{' '}
                            {conn.distanceToPlantMiles} mi)
                          </span>
                        </span>
                      </td>
                      <td className="py-2.5 pl-4 text-cyan-200/90 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <PlantFuelIcon
                            fuel={conn.nearestZeroCarbonPlantFuel}
                            size={15}
                          />
                          <span>{conn.nearestZeroCarbonPlantName}</span>
                          <span className="text-zinc-500">
                            ({conn.nearestZeroCarbonPlantMW} MW ·{' '}
                            {conn.distanceToZeroCarbonPlantMiles} mi)
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : ledgerMode === 'stations' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-zinc-700 text-[10px] uppercase tracking-wider text-zinc-500">
                  <th className="py-2.5 pr-4 font-normal">Station Name</th>
                  <th className="py-2.5 px-4 font-normal">Municipality</th>
                  <th className="py-2.5 px-4 font-normal text-right">
                    Nameplate MW
                  </th>
                  <th className="py-2.5 px-4 font-normal">
                    Icon, Fuel &amp; Carbon Class
                  </th>
                  <th className="py-2.5 px-4 font-normal">Technology</th>
                  <th className="py-2.5 pl-4 font-normal">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {visiblePlants.map((plant) => {
                  const isSelected = selectedPlant?.id === plant.id;
                  const capPct = Math.min(
                    100,
                    Math.max(2, (plant.totalMW / 2150) * 100)
                  );
                  const fuelVis = getFuelVisual(plant.primaryFuel);
                  return (
                    <tr
                      key={plant.id}
                      onClick={() => handleSelectPlant(plant, true)}
                      className={`transition cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-900/90 text-white'
                          : 'hover:bg-zinc-950 text-zinc-300'
                      }`}
                    >
                      <td className="py-2.5 pr-4 font-sans text-xs text-white">
                        {plant.name}
                      </td>
                      <td className="py-2.5 px-4 text-zinc-400 whitespace-nowrap">
                        {plant.city}, {plant.state}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2.5">
                          <span className="text-white">
                            {plant.totalMW.toFixed(1)} MW
                          </span>
                          <span className="w-16 h-1 bg-zinc-900 inline-block overflow-hidden">
                            <span
                              className="block h-full"
                              style={{
                                width: `${capPct}%`,
                                backgroundColor: fuelVis.color,
                              }}
                            />
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-zinc-200 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <PlantFuelIcon fuel={plant.primaryFuel} size={18} />
                          <span className="capitalize">
                            {plant.primaryFuel}
                          </span>
                          {fuelVis.isZeroCarbon ? (
                            <span className="text-[9px] px-1.5 py-0.5 bg-cyan-950/70 text-cyan-300 border border-cyan-800/60">
                              0-CO₂ NEUTRAL
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 bg-orange-950/60 text-orange-300 border border-orange-800/60">
                              FOSSIL CO₂
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-zinc-500 whitespace-nowrap">
                        {plant.techDescription}
                      </td>
                      <td className="py-2.5 pl-4 text-zinc-400 whitespace-nowrap">
                        {plant.utility}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 border border-teal-900/60 bg-teal-950/15 font-mono text-[11px] text-zinc-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                <strong>Why HIFLD misses rural towns &amp; how we solved it:</strong> Federal DHS HIFLD only tracks ≥69 kV bulk lines (like <code className="text-sky-300">TORRINGTON TERMINAL ↔ FALLS VILLAGE</code> on the eastern ridge that bypasses Cornwall). We combined HIFLD with <strong>Eversource&apos;s Connecticut Hosting Capacity GIS (<code className="text-teal-300">DG_Hosting_CT_Final</code>)</strong> to map the real <strong className="text-teal-300">27.6 kV sub-transmission (14R31)</strong> and <strong className="text-teal-300">8.32–22.8 kV 3-phase feeders (37J1, 4L09, 23R1)</strong> into <strong className="text-white">Cornwall Center, West Cornwall &amp; Cornwall Bridge</strong>.
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('Cornwall')}
                className="shrink-0 px-2.5 py-1 border border-teal-500/50 bg-teal-950/40 text-teal-200 hover:text-white cursor-pointer"
              >
                Filter: Cornwall &amp; Route 4/7
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-zinc-700 text-[10px] uppercase tracking-wider text-zinc-500">
                    <th className="py-2.5 pr-4 font-normal">
                      Corridor (Substation A ↔ B)
                    </th>
                    <th className="py-2.5 px-4 font-normal text-right">
                      Voltage
                    </th>
                    <th className="py-2.5 px-4 font-normal">
                      Towns Traversed Along Route (Start → End)
                    </th>
                    <th className="py-2.5 px-4 font-normal text-right">
                      Length
                    </th>
                    <th className="py-2.5 px-4 font-normal">
                      Connected / Nearby Stations
                    </th>
                    <th className="py-2.5 pl-4 font-normal">Utility / Circuit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {filteredCorridors.slice(0, 120).map((line) => {
                    const isSelected = selectedLine?.id === line.id;
                    return (
                      <tr
                        key={line.id}
                        onClick={() => handleSelectLine(line, true)}
                        className={`transition cursor-pointer ${
                          isSelected
                            ? 'bg-teal-950/40 text-white'
                            : 'hover:bg-zinc-950 text-zinc-300'
                        }`}
                      >
                        <td className="py-2.5 pr-4 font-sans text-xs text-white whitespace-nowrap">
                          {line.corridorName}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums whitespace-nowrap">
                          <span
                            className={
                              line.voltageKV >= 345
                                ? 'text-amber-400 font-semibold'
                                : line.voltageKV < 100
                                  ? 'text-teal-300 font-semibold'
                                  : 'text-sky-300'
                            }
                          >
                            {line.voltageKV} kV
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-zinc-300">
                          {line.townsTraversed.length > 0 ? (
                            <span className="text-zinc-200">
                              {line.townsTraversed.join(' → ')}
                            </span>
                          ) : (
                            <span className="text-zinc-500">
                              Local Substation Tie
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums whitespace-nowrap text-zinc-300">
                          {line.lengthMiles} mi
                        </td>
                        <td className="py-2.5 px-4 text-zinc-400 whitespace-nowrap">
                          {line.nearbyStations.length > 0 ? (
                            <span className="inline-flex items-center gap-2">
                              <PlantFuelIcon
                                fuel={line.nearbyStations[0].primaryFuel}
                                size={15}
                              />
                              <span>
                                {line.nearbyStations
                                  .slice(0, 2)
                                  .map((s) => `${s.name} (${s.totalMW} MW)`)
                                  .join(', ')}
                              </span>
                            </span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="py-2.5 pl-4 text-zinc-500 whitespace-nowrap">
                          {line.owner}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
