import { useState, useMemo, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  CircleMarker,
  Marker,
  Tooltip,
  useMap,
} from 'react-leaflet';
import { ZoomIn, ZoomOut, RotateCcw, Check } from 'lucide-react';
import {
  LITCHFIELD_COUNTY_TOWNS,
  TOTAL_LITCHFIELD_COUNTY_HOUSEHOLDS,
  type LitchfieldTown,
} from '../data/litchfieldTowns';
import { FACILITY_LOCATIONS } from '../data/facilities';
import {
  POWER_STATIONS,
  POWER_SUBSTATIONS,
  computeEnrichedTransmissionCorridors,
  isNamedSubstation,
} from '../data/powerGridData';
import {
  getFuelVisual,
  getPowerPlantDivIcon,
  getDataCenterDivIcon,
} from '../utils/mapIcons';
import { PlantFuelIcon, DataCenterIcon } from './MapIconBadges';

interface SiteWalkthroughViewProps {
  initialTownId?: string | null;
  initialAcres?: number | null;
  initialGpuPct?: number | null;
  onChangeParams?: (params: {
    townId: string;
    acres: number;
    gpuPct: number;
  }) => void;
}

function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Convert a centered square/rectangle of (widthFeet, heightFeet) around (lat, lng) into [lat, lng][] polygon coords
function buildCenteredBoxLatLng(
  centerLat: number,
  centerLng: number,
  widthFeet: number,
  heightFeet: number
): [number, number][] {
  const feetPerDegLat = 364000;
  const feetPerDegLng = 364000 * Math.cos((centerLat * Math.PI) / 180);
  const halfLat = heightFeet / 2 / feetPerDegLat;
  const halfLng = widthFeet / 2 / feetPerDegLng;

  return [
    [centerLat + halfLat, centerLng - halfLng],
    [centerLat + halfLat, centerLng + halfLng],
    [centerLat - halfLat, centerLng + halfLng],
    [centerLat - halfLat, centerLng - halfLng],
  ];
}

function MapViewportUpdater({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 0.55 });
  }, [map, center, zoom]);
  return null;
}

function MapZoomButtons({
  center,
  defaultZoom,
}: {
  center: [number, number];
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
        onClick={() => map.setView(center, defaultZoom, { animate: true })}
        title="Reset view"
        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function formatCompactCurrency(dollars: number): string {
  if (dollars >= 1e9) return `$${(dollars / 1e9).toFixed(2)}B`;
  if (dollars >= 1e6) return `$${(dollars / 1e6).toFixed(1)}M`;
  if (dollars >= 1e3) return `$${(dollars / 1e3).toFixed(0)}k`;
  return `$${dollars.toFixed(0)}`;
}

export function SiteWalkthroughView({
  initialTownId,
  initialAcres,
  initialGpuPct,
  onChangeParams,
}: SiteWalkthroughViewProps) {
  const [selectedTownId, setSelectedTownId] = useState<string>(() => {
    if (
      initialTownId &&
      LITCHFIELD_COUNTY_TOWNS.some((t) => t.id === initialTownId)
    ) {
      return initialTownId;
    }
    return 'litchfield';
  });

  const [parcelAcres, setParcelAcres] = useState<number>(() =>
    initialAcres && initialAcres >= 2 && initialAcres <= 120 ? initialAcres : 20
  );

  const [gpuMixPct, setGpuMixPct] = useState<number>(() =>
    initialGpuPct !== null &&
    initialGpuPct !== undefined &&
    initialGpuPct >= 0 &&
    initialGpuPct <= 100
      ? initialGpuPct
      : 40
  );

  const [activeStep, setActiveStep] = useState<number>(1);
  const [showSatelliteOnParcel, setShowSatelliteOnParcel] = useState<boolean>(false);
  const [showMapLines, setShowMapLines] = useState<boolean>(true);
  const [showMapPlants, setShowMapPlants] = useState<boolean>(true);
  const [showMapDataCenters, setShowMapDataCenters] = useState<boolean>(true);
  const [showMapSubstations, setShowMapSubstations] = useState<boolean>(true);

  const allCorridors = useMemo(
    () => computeEnrichedTransmissionCorridors(),
    []
  );
  const ctCorridors = useMemo(
    () => allCorridors.filter((l) => l.isConnecticut),
    [allCorridors]
  );
  const ctPlants = useMemo(
    () => POWER_STATIONS.filter((p) => p.isConnecticut),
    []
  );
  const ctDataCenters = useMemo(
    () =>
      FACILITY_LOCATIONS.filter(
        (f) => f.isDataCenter && f.stateOrCountry.includes('CT')
      ),
    []
  );
  const ctNamedSubstations = useMemo(
    () =>
      POWER_SUBSTATIONS.filter(
        (s) => s.isConnecticut && isNamedSubstation(s.name)
      ),
    []
  );

  const stepRefs = useRef<(HTMLElement | null)[]>([]);

  const town: LitchfieldTown = useMemo(
    () =>
      LITCHFIELD_COUNTY_TOWNS.find((t) => t.id === selectedTownId) ??
      LITCHFIELD_COUNTY_TOWNS[9],
    [selectedTownId]
  );

  const handleUpdateTown = (newTownId: string) => {
    setSelectedTownId(newTownId);
    onChangeParams?.({ townId: newTownId, acres: parcelAcres, gpuPct: gpuMixPct });
  };

  const handleUpdateAcres = (newAcres: number) => {
    setParcelAcres(newAcres);
    onChangeParams?.({ townId: selectedTownId, acres: newAcres, gpuPct: gpuMixPct });
  };

  const handleUpdateGpuMix = (newGpuPct: number) => {
    setGpuMixPct(newGpuPct);
    onChangeParams?.({ townId: selectedTownId, acres: parcelAcres, gpuPct: newGpuPct });
  };

  // Scroll spy for the 6 walkthrough steps
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const stepAttr = entry.target.getAttribute('data-step');
            if (stepAttr) {
              setActiveStep(Number(stepAttr));
            }
          }
        });
      },
      {
        rootMargin: '-25% 0px -45% 0px',
        threshold: 0.15,
      }
    );

    stepRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToStep = (stepNumber: number) => {
    setActiveStep(stepNumber);
    const el = stepRefs.current[stepNumber - 1];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // ============================================================================
  // ENGINEERING & ARCHITECTURAL MODEL (Steps 1 -> 6)
  // ============================================================================
  const model = useMemo(() => {
    // Step 1: Gross Land Plot
    const grossSqFt = parcelAcres * 43560;
    const footballFields = parcelAcres / 1.32;
    // Aspect ratio 1.35 : 1 rectangle
    const parcelHeightFt = Math.sqrt(grossSqFt / 1.35);
    const parcelWidthFt = parcelHeightFt * 1.35;

    // Step 2: Municipal Setbacks, Wetlands & Lot Coverage
    const innerWidthAfterSetbackFt = Math.max(
      60,
      parcelWidthFt - town.sideRearSetbackFt * 2
    );
    const innerHeightAfterSetbackFt = Math.max(
      60,
      parcelHeightFt - (town.frontSetbackFt + town.sideRearSetbackFt)
    );
    const areaAfterSetbacksSqFt =
      innerWidthAfterSetbackFt * innerHeightAfterSetbackFt;
    const setbackLossSqFt = Math.max(0, grossSqFt - areaAfterSetbacksSqFt);

    // Wetlands & stormwater retention ponds
    const wetlandLossSqFt = grossSqFt * (town.wetlandBufferPct / 100);
    const netDevelopableEnvelopeSqFt = Math.max(
      grossSqFt * 0.12,
      areaAfterSetbacksSqFt - wetlandLossSqFt * 0.65
    );

    // Municipal max building footprint cap (e.g., 18%–40% of gross parcel)
    const zoningMaxBuildingSqFt = grossSqFt * (town.maxLotCoveragePct / 100);
    // Actual single-story data hall building footprint (respecting both envelope & coverage cap)
    const buildingFootprintSqFt = Math.min(
      zoningMaxBuildingSqFt,
      netDevelopableEnvelopeSqFt * 0.58
    );
    const buildingAcres = buildingFootprintSqFt / 43560;
    const buildingHeightFt = Math.sqrt(buildingFootprintSqFt / 1.45);
    const buildingWidthFt = buildingHeightFt * 1.45;

    // Step 3: Building Interior Allocation (Computers vs. Support Equipment)
    const whiteSpacePct = 0.42; // 42% Server White Space (Hot/Cold aisles)
    const electricalRoomPct = 0.24; // 24% UPS, Batteries, Switchgear, PDUs
    const coolingPlantPct = 0.20; // 20% Chillers, CDUs, Pump Skids, Thermal Storage
    const supportAdminPct = 0.14; // 14% Loading docks, security, NOC, staging

    const whiteSpaceSqFt = buildingFootprintSqFt * whiteSpacePct;
    const electricalSqFt = buildingFootprintSqFt * electricalRoomPct;
    const coolingSqFt = buildingFootprintSqFt * coolingPlantPct;
    const adminSqFt = buildingFootprintSqFt * supportAdminPct;

    // 1 standard 42U/48U cabinet requires ~32 sq ft of white space (including hot/cold aisle containment & clearance)
    const totalRacks = Math.max(4, Math.floor(whiteSpaceSqFt / 32));

    // Step 4: CPU vs. GPU Hardware Mix & Cost
    const gpuRacks = Math.round(totalRacks * (gpuMixPct / 100));
    const cpuRacks = totalRacks - gpuRacks;

    // Hardware specs per rack:
    // CPU Rack: 12 kW/rack, 32 dual-socket servers (64 CPUs), ~$160,000/rack
    // AI GPU Rack (NVIDIA GB200 NVL72 / H200 class): 95 kW/rack, 72 GPUs/rack, ~$2,900,000/rack
    const kwPerCpuRack = 12;
    const kwPerGpuRack = 95;
    const costPerCpuRack = 160_000;
    const costPerGpuRack = 2_900_000;

    const totalCpus = cpuRacks * 64;
    const totalGpus = gpuRacks * 72;

    const cpuHardwareCost = cpuRacks * costPerCpuRack;
    const gpuHardwareCost = gpuRacks * costPerGpuRack;
    const totalHardwareCost = cpuHardwareCost + gpuHardwareCost;

    // Step 5: Electricity Demand, Cooling PUE & Diesel Backup
    const itLoadKW = cpuRacks * kwPerCpuRack + gpuRacks * kwPerGpuRack;
    const itLoadMW = itLoadKW / 1000;
    const avgKwPerRack = totalRacks > 0 ? itLoadKW / totalRacks : 0;

    // PUE in Litchfield County (1.18 in cool high-elevation towns like Norfolk/Colebrook, ~1.22 typical)
    const pue =
      town.id === 'norfolk' || town.id === 'colebrook' || town.id === 'goshen'
        ? 1.18
        : 1.22;
    const coolingAndLossMW = itLoadMW * (pue - 1);
    const totalFacilityMW = itLoadMW * pue;

    // Shell + MEP construction cost (~$11.5M per MW of IT load + $320/sq ft shell)
    const shellAndMepCost =
      buildingFootprintSqFt * 320 + itLoadMW * 11_200_000;
    const totalProjectCapEx = shellAndMepCost + totalHardwareCost;

    // Annual GWh (85% average utilization factor across 8,760 hours)
    const annualGWh = totalFacilityMW * 8760 * 0.85 * 0.001;
    // Equivalent CT homes (10.5 MWh/yr per household)
    const equivHouseholds = Math.round((annualGWh * 1000) / 10.5);
    const multipleOfTownHomes = equivHouseholds / Math.max(1, town.households);
    const pctOfCountyHomes =
      (equivHouseholds / TOTAL_LITCHFIELD_COUNTY_HOUSEHOLDS) * 100;

    // Backup diesel generators (2.75 MW Tier-4 Caterpillar 3516E / C175-20 gensets at N+1)
    const dieselGensetsCount = Math.max(
      2,
      Math.ceil(totalFacilityMW / 2.75) + 1
    );
    const dieselGalPerHour = Math.round(totalFacilityMW * 195);

    // Step 6: Nearest Substation, Transmission Line & Baseload Station from real HIFLD/EIA dataset
    const subPool =
      ctNamedSubstations.length > 0 ? ctNamedSubstations : POWER_SUBSTATIONS;
    let nearestSub = subPool[0];
    let nearestSubDist = Infinity;
    let nearest345Sub = subPool[0];
    let nearest345Dist = Infinity;

    for (const sub of subPool) {
      if (!sub.isConnecticut) continue;
      const d = haversineMiles(town.lat, town.lng, sub.lat, sub.lng);
      if (d < nearestSubDist) {
        nearestSubDist = d;
        nearestSub = sub;
      }
      if (sub.maxVoltageKV >= 345 && d < nearest345Dist) {
        nearest345Dist = d;
        nearest345Sub = sub;
      }
    }

    let nearestPlant = POWER_STATIONS[0];
    let nearestPlantDist = Infinity;
    for (const plant of POWER_STATIONS) {
      if (!plant.isConnecticut) continue;
      const d = haversineMiles(town.lat, town.lng, plant.lat, plant.lng);
      if (d < nearestPlantDist) {
        nearestPlantDist = d;
        nearestPlant = plant;
      }
    }

    // Nearest Transmission Corridor & all corridors passing through or near this town
    let nearestCorridor = ctCorridors[0];
    let nearestLineDist = Infinity;
    let nearestLineTap: [number, number] = [nearestSub.lat, nearestSub.lng];

    const scoredCorridors: {
      corridor: (typeof ctCorridors)[number];
      minDistMiles: number;
      tapPoint: [number, number];
      passesThroughTown: boolean;
    }[] = [];

    for (const corr of ctCorridors) {
      let minD = Infinity;
      let bestPt: [number, number] = corr.coordinates[0] || [town.lat, town.lng];
      for (const [ptLat, ptLng] of corr.coordinates) {
        const d = haversineMiles(town.lat, town.lng, ptLat, ptLng);
        if (d < minD) {
          minD = d;
          bestPt = [ptLat, ptLng];
        }
      }
      if (minD < nearestLineDist) {
        nearestLineDist = minD;
        nearestCorridor = corr;
        nearestLineTap = bestPt;
      }
      const passesThroughTown = corr.townsTraversed.some(
        (tName) =>
          tName.toLowerCase() === town.name.toLowerCase() ||
          town.name.toLowerCase().includes(tName.toLowerCase()) ||
          tName.toLowerCase().includes(town.name.toLowerCase())
      );
      if (passesThroughTown || minD <= 8.5) {
        scoredCorridors.push({
          corridor: corr,
          minDistMiles: Number(minD.toFixed(1)),
          tapPoint: bestPt,
          passesThroughTown,
        });
      }
    }

    scoredCorridors.sort((a, b) => {
      if (a.passesThroughTown !== b.passesThroughTown) {
        return a.passesThroughTown ? -1 : 1;
      }
      return a.minDistMiles - b.minDistMiles;
    });

    // Deduplicate by corridorName
    const uniqueTownCorridors: typeof scoredCorridors = [];
    const seenNames = new Set<string>();
    for (const item of scoredCorridors) {
      const key = `${item.corridor.corridorName}-${item.corridor.voltageKV}`;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        uniqueTownCorridors.push(item);
      }
    }

    // Grid feasibility classification
    let gridVerdict: 'LOCAL_FEEDER_OK' | 'SUBTRANSMISSION_115KV' | 'BULK_345KV_REQUIRED';
    let gridVerdictTitle: string;
    let gridVerdictSummary: string;

    if (totalFacilityMW <= town.estLocalFeederSpareMW && totalFacilityMW <= 5) {
      gridVerdict = 'LOCAL_FEEDER_OK';
      gridVerdictTitle = 'Feasible on Local Utility Feeder / Step-Down Tap';
      gridVerdictSummary = `At ${totalFacilityMW.toFixed(1)} MW total load, this facility fits within ${town.name}'s estimated ${town.estLocalFeederSpareMW} MW local feeder envelope (${town.localFeederVoltageKV} kV) without building a new high-voltage transmission corridor.`;
    } else if (totalFacilityMW <= 60) {
      gridVerdict = 'SUBTRANSMISSION_115KV';
      gridVerdictTitle = 'Requires Dedicated 115 kV Substation & Line Extension';
      gridVerdictSummary = `At ${totalFacilityMW.toFixed(1)} MW, this exceeds local distribution feeders. It requires a dedicated 115 kV step-down substation and a ${nearestSubDist.toFixed(1)}-mile high-voltage tap to ${nearestSub.name} (${nearestSub.maxVoltageKV} kV).`;
    } else {
      gridVerdict = 'BULK_345KV_REQUIRED';
      gridVerdictTitle = 'Exceeds Regional 115 kV Grid — Requires 345 kV Bulk Backbone';
      gridVerdictSummary = `At ${totalFacilityMW.toFixed(1)} MW (${equivHouseholds.toLocaleString()} homes equivalent), this load exceeds Litchfield County's 115 kV sub-transmission network. It requires a ${nearest345Dist.toFixed(1)}-mile 345 kV transmission line to ${nearest345Sub.name} Substation and an ISO-NE cluster study.`;
    }

    return {
      grossSqFt,
      footballFields,
      parcelWidthFt,
      parcelHeightFt,
      innerWidthAfterSetbackFt,
      innerHeightAfterSetbackFt,
      areaAfterSetbacksSqFt,
      setbackLossSqFt,
      wetlandLossSqFt,
      netDevelopableEnvelopeSqFt,
      zoningMaxBuildingSqFt,
      buildingFootprintSqFt,
      buildingAcres,
      buildingWidthFt,
      buildingHeightFt,
      whiteSpaceSqFt,
      electricalSqFt,
      coolingSqFt,
      adminSqFt,
      totalRacks,
      cpuRacks,
      gpuRacks,
      totalCpus,
      totalGpus,
      cpuHardwareCost,
      gpuHardwareCost,
      totalHardwareCost,
      shellAndMepCost,
      totalProjectCapEx,
      itLoadMW,
      avgKwPerRack,
      pue,
      coolingAndLossMW,
      totalFacilityMW,
      annualGWh,
      equivHouseholds,
      multipleOfTownHomes,
      pctOfCountyHomes,
      dieselGensetsCount,
      dieselGalPerHour,
      nearestSub,
      nearestSubDist,
      nearest345Sub,
      nearest345Dist,
      nearestPlant,
      nearestPlantDist,
      nearestCorridor,
      nearestLineDist,
      nearestLineTap,
      uniqueTownCorridors: uniqueTownCorridors.slice(0, 5),
      gridVerdict,
      gridVerdictTitle,
      gridVerdictSummary,
    };
  }, [parcelAcres, gpuMixPct, town, ctNamedSubstations, ctCorridors]);

  // Polygons for the selected town center on the Leaflet map
  const parcelPolygon = useMemo(
    () =>
      buildCenteredBoxLatLng(
        town.lat,
        town.lng,
        model.parcelWidthFt,
        model.parcelHeightFt
      ),
    [town.lat, town.lng, model.parcelWidthFt, model.parcelHeightFt]
  );

  const setbackEnvelopePolygon = useMemo(
    () =>
      buildCenteredBoxLatLng(
        town.lat,
        town.lng,
        model.innerWidthAfterSetbackFt,
        model.innerHeightAfterSetbackFt
      ),
    [
      town.lat,
      town.lng,
      model.innerWidthAfterSetbackFt,
      model.innerHeightAfterSetbackFt,
    ]
  );

  const buildingPolygon = useMemo(
    () =>
      buildCenteredBoxLatLng(
        town.lat,
        town.lng,
        model.buildingWidthFt,
        model.buildingHeightFt
      ),
    [town.lat, town.lng, model.buildingWidthFt, model.buildingHeightFt]
  );

  // White space sub-box inside the building polygon for Step 3/4
  const whiteSpacePolygon = useMemo(
    () =>
      buildCenteredBoxLatLng(
        town.lat,
        town.lng,
        model.buildingWidthFt * 0.65,
        model.buildingHeightFt * 0.65
      ),
    [town.lat, town.lng, model.buildingWidthFt, model.buildingHeightFt]
  );

  // Dynamic map center & zoom based on active walkthrough step
  const mapViewport = useMemo((): { center: [number, number]; zoom: number } => {
    if (activeStep === 6) {
      // Frame both the town center and the nearest substation
      const midLat = (town.lat + model.nearestSub.lat) / 2;
      const midLng = (town.lng + model.nearestSub.lng) / 2;
      const zoom = model.nearestSubDist > 10 ? 10 : model.nearestSubDist > 4 ? 11 : 12;
      return { center: [midLat, midLng], zoom };
    }
    // Zoom scaled to parcel acreage so the parcel fills the viewport nicely
    const zoom =
      parcelAcres <= 8 ? 16 : parcelAcres <= 35 ? 15 : parcelAcres <= 80 ? 14 : 13;
    return { center: [town.lat, town.lng], zoom };
  }, [activeStep, town.lat, town.lng, model.nearestSub, model.nearestSubDist, parcelAcres]);

  return (
    <div className="bg-[#09090b] text-zinc-200 pt-6 pb-24 space-y-8">
      {/* Editorial Title & Litchfield County Town Center Selector */}
      <div className="border-b border-zinc-800 pb-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="font-mono text-[10px] uppercase tracking-widest text-amber-400">
              INTERACTIVE ENGINEERING WALKTHROUGH // LITCHFIELD COUNTY, CONNECTICUT (26 TOWNS)
            </div>
            <h1 className="text-xl sm:text-2xl font-normal tracking-tight text-white">
              Anatomy of Siting a Data Center: From Raw Acreage to Grid Interconnection
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Select any of the 26 town centers in Litchfield County below and scroll through the six engineering stages: land footprint, municipal zoning setbacks, server white space vs. mechanical support, CPU vs. AI GPU hardware cost, electrical load, and local Eversource substation capacity.
            </p>
          </div>

          <div className="font-mono text-xs text-zinc-400 shrink-0">
            Selected Town:{' '}
            <strong className="text-white">{town.name}</strong> ({town.villageCenterLabel})
          </div>
        </div>

        {/* All 26 Litchfield County Towns Selector Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            <span>Select a Litchfield County Town Center (All 26 Municipalities)</span>
            <span>
              Pop. {town.population.toLocaleString()} · {town.households.toLocaleString()} Households · Max Lot Coverage {town.maxLotCoveragePct}%
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {LITCHFIELD_COUNTY_TOWNS.map((t) => {
              const isSelected = t.id === town.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleUpdateTown(t.id)}
                  className={`px-2.5 py-1 font-mono text-[11px] border transition cursor-pointer ${
                    isSelected
                      ? 'bg-white text-black border-white font-semibold'
                      : 'bg-zinc-950/80 text-zinc-400 border-zinc-800/90 hover:border-zinc-600 hover:text-zinc-200'
                  }`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky Parameter & Step Bar */}
      <div className="sticky top-14 z-40 bg-[#09090b]/95 backdrop-blur-md border-b border-zinc-800 py-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* 6-Step Progress Pills */}
          <div className="flex items-center gap-1 overflow-x-auto font-mono text-[11px]">
            {[
              { step: 1, label: '1. Land Plot' },
              { step: 2, label: '2. Setbacks' },
              { step: 3, label: '3. White Space' },
              { step: 4, label: '4. CPU vs GPU' },
              { step: 5, label: '5. Power (MW)' },
              { step: 6, label: '6. Grid Feed' },
            ].map((item) => (
              <button
                key={item.step}
                type="button"
                onClick={() => scrollToStep(item.step)}
                className={`px-2.5 py-1 transition cursor-pointer whitespace-nowrap ${
                  activeStep === item.step
                    ? 'bg-amber-400 text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Live Sliders for Parcel Acres & GPU/CPU Hardware Mix */}
          <div className="flex flex-wrap items-center gap-6 font-mono text-xs">
            <label className="flex items-center gap-2.5">
              <span className="text-zinc-400">Plot Size:</span>
              <input
                type="range"
                min={2}
                max={120}
                step={1}
                value={parcelAcres}
                onChange={(e) => handleUpdateAcres(Number(e.target.value))}
                className="w-28 accent-amber-400 cursor-pointer"
              />
              <span className="text-white font-semibold tabular-nums w-14">
                {parcelAcres} ac
              </span>
            </label>

            <label className="flex items-center gap-2.5">
              <span className="text-zinc-400">AI GPU Mix:</span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={gpuMixPct}
                onChange={(e) => handleUpdateGpuMix(Number(e.target.value))}
                className="w-28 accent-emerald-400 cursor-pointer"
              />
              <span className="text-emerald-400 font-semibold tabular-nums w-12">
                {gpuMixPct}%
              </span>
            </label>

            <div className="hidden sm:flex items-center gap-4 border-l border-zinc-800 pl-4 tabular-nums">
              <span>
                Racks: <strong className="text-white">{model.totalRacks.toLocaleString()}</strong>
              </span>
              <span>
                CapEx: <strong className="text-white">{formatCompactCurrency(model.totalProjectCapEx)}</strong>
              </span>
              <span>
                Load: <strong className="text-amber-400">{model.totalFacilityMW.toFixed(1)} MW</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Scrollytelling Grid: Left Scrolling Narrative (5 cols) + Right Sticky Stage (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* LEFT COLUMN: 6 Scrolling Engineering Chapters */}
        <div className="lg:col-span-5 space-y-24 pb-24">
          {/* ================================================================
              STEP 1: THE PLOT OF LAND
             ================================================================ */}
          <section
            ref={(el) => {
              stepRefs.current[0] = el;
            }}
            data-step="1"
            className={`border-t pt-6 space-y-5 transition-opacity duration-300 ${
              activeStep === 1 ? 'border-amber-400 opacity-100' : 'border-zinc-800 opacity-65'
            }`}
          >
            <div className="space-y-1">
              <div className="font-mono text-[10px] uppercase tracking-widest text-amber-400">
                STAGE 01 // PARCEL ACQUISITION &amp; TOWN SCALE
              </div>
              <h2 className="text-lg font-normal text-white">
                1. The Plot of Land in {town.name} ({parcelAcres} Acres)
              </h2>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Every data center begins with a contiguous parcel of land. Placing a{' '}
              <strong className="text-white">{parcelAcres}-acre</strong> tract at{' '}
              <strong className="text-white">{town.villageCenterLabel}</strong> requires a rectangular plot measuring{' '}
              <span className="font-mono text-white">
                {Math.round(model.parcelWidthFt).toLocaleString()} ft ×{' '}
                {Math.round(model.parcelHeightFt).toLocaleString()} ft
              </span>{' '}
              ({Math.round(model.grossSqFt).toLocaleString()} sq ft)—equivalent to{' '}
              <strong className="text-white">{model.footballFields.toFixed(1)} football fields</strong>.
            </p>

            {/* Quick Parcel Size Presets */}
            <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
              {[
                { label: '4 ac (Edge)', val: 4 },
                { label: '12 ac (Enterprise)', val: 12 },
                { label: '20 ac (Regional COLO)', val: 20 },
                { label: '45 ac (Campus)', val: 45 },
                { label: '90 ac (Hyperscale)', val: 90 },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => handleUpdateAcres(p.val)}
                  className={`px-2.5 py-1 border transition cursor-pointer ${
                    parcelAcres === p.val
                      ? 'border-amber-400 text-amber-300 bg-amber-950/30'
                      : 'border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <dl className="divide-y divide-zinc-900 border-y border-zinc-800 font-mono text-xs">
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-500">Selected Municipality</dt>
                <dd className="text-white">{town.name}, CT</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-500">Town Center Coordinates</dt>
                <dd className="text-zinc-300 tabular-nums">
                  {town.lat.toFixed(4)}°N, {Math.abs(town.lng).toFixed(4)}°W
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-500">Gross Parcel Area</dt>
                <dd className="text-white tabular-nums">
                  {parcelAcres} acres ({Math.round(model.grossSqFt).toLocaleString()} sq ft)
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-500">Plot Dimensions</dt>
                <dd className="text-zinc-300 tabular-nums">
                  {Math.round(model.parcelWidthFt).toLocaleString()} ft × {Math.round(model.parcelHeightFt).toLocaleString()} ft
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-500">Equivalent Football Fields</dt>
                <dd className="text-amber-400 tabular-nums">
                  {model.footballFields.toFixed(1)} NFL fields
                </dd>
              </div>
            </dl>
          </section>

          {/* ================================================================
              STEP 2: SETBACKS, WETLANDS & LOT COVERAGE
             ================================================================ */}
          <section
            ref={(el) => {
              stepRefs.current[1] = el;
            }}
            data-step="2"
            className={`border-t pt-6 space-y-5 transition-opacity duration-300 ${
              activeStep === 2 ? 'border-amber-400 opacity-100' : 'border-zinc-800 opacity-65'
            }`}
          >
            <div className="space-y-1">
              <div className="font-mono text-[10px] uppercase tracking-widest text-amber-400">
                STAGE 02 // MUNICIPAL ZONING, SETBACKS &amp; BUFFERS
              </div>
              <h2 className="text-lg font-normal text-white">
                2. Setbacks, Inland Wetlands &amp; Lot Coverage
              </h2>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              You cannot build edge-to-edge on a parcel. Under{' '}
              <strong className="text-white">{town.name}</strong>’s{' '}
              <span className="text-zinc-200">{town.zoningDistrict}</span> parameters, perimeter setbacks ({town.frontSetbackFt} ft front, {town.sideRearSetbackFt} ft side/rear acoustic buffer), Connecticut Inland Wetlands review buffers ({town.wetlandBufferPct}%), stormwater detention basins, and the{' '}
              <strong className="text-white">{town.maxLotCoveragePct}% maximum building coverage cap</strong> shrink the buildable structure to{' '}
              <strong className="text-emerald-400">
                {model.buildingAcres.toFixed(2)} acres ({Math.round(model.buildingFootprintSqFt).toLocaleString()} sq ft)
              </strong>.
            </p>

            <dl className="divide-y divide-zinc-900 border-y border-zinc-800 font-mono text-xs">
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-500">Zoning Classification</dt>
                <dd className="text-zinc-300 text-right">{town.zoningDistrict}</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-500">Yard Setbacks (Front / Side)</dt>
                <dd className="text-zinc-300 tabular-nums">
                  {town.frontSetbackFt} ft / {town.sideRearSetbackFt} ft
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-500">Setback &amp; Perimeter Buffer Loss</dt>
                <dd className="text-zinc-400 tabular-nums">
                  −{(model.setbackLossSqFt / 43560).toFixed(2)} ac ({Math.round(model.setbackLossSqFt).toLocaleString()} sq ft)
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-500">Wetlands &amp; Stormwater Basins ({town.wetlandBufferPct}%)</dt>
                <dd className="text-zinc-400 tabular-nums">
                  −{(model.wetlandLossSqFt / 43560).toFixed(2)} ac
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-500">Max Building Coverage ({town.maxLotCoveragePct}%)</dt>
                <dd className="text-emerald-400 font-semibold tabular-nums">
                  {Math.round(model.buildingFootprintSqFt).toLocaleString()} sq ft ({model.buildingAcres.toFixed(2)} ac)
                </dd>
              </div>
            </dl>
          </section>

          {/* ================================================================
              STEP 3: COMPUTERS VS. SUPPORT INFRASTRUCTURE
             ================================================================ */}
          <section
            ref={(el) => {
              stepRefs.current[2] = el;
            }}
            data-step="3"
            className={`border-t pt-6 space-y-5 transition-opacity duration-300 ${
              activeStep === 3 ? 'border-amber-400 opacity-100' : 'border-zinc-800 opacity-65'
            }`}
          >
            <div className="space-y-1">
              <div className="font-mono text-[10px] uppercase tracking-widest text-amber-400">
                STAGE 03 // INTERIOR FLOORPLAN ALLOCATION
              </div>
              <h2 className="text-lg font-normal text-white">
                3. Computers vs. Support Equipment Inside the Shell
              </h2>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Less than half of a data center’s floor area actually holds server racks. Of the{' '}
              <strong className="text-white">
                {Math.round(model.buildingFootprintSqFt).toLocaleString()} sq ft
              </strong>{' '}
              building shell, only <strong className="text-emerald-400">42% ({Math.round(model.whiteSpaceSqFt).toLocaleString()} sq ft)</strong> is raised-floor or slab “White Space” for servers. Another <strong className="text-amber-400">44%</strong> is consumed by massive UPS battery rooms, switchgear, transformers, and closed-loop cooling plants.
            </p>

            <dl className="divide-y divide-zinc-900 border-y border-zinc-800 font-mono text-xs">
              <div className="py-2 flex justify-between">
                <dt className="text-emerald-400">42% Compute White Space (Servers)</dt>
                <dd className="text-white tabular-nums">
                  {Math.round(model.whiteSpaceSqFt).toLocaleString()} sq ft
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-amber-400">24% Electrical (UPS / Switchgear / PDU)</dt>
                <dd className="text-zinc-300 tabular-nums">
                  {Math.round(model.electricalSqFt).toLocaleString()} sq ft
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-sky-400">20% Cooling &amp; Mechanical (Chillers / CDUs)</dt>
                <dd className="text-zinc-300 tabular-nums">
                  {Math.round(model.coolingSqFt).toLocaleString()} sq ft
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-400">14% Loading Bays, Security &amp; NOC</dt>
                <dd className="text-zinc-400 tabular-nums">
                  {Math.round(model.adminSqFt).toLocaleString()} sq ft
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-200 font-semibold">Total Server Cabinets (32 sq ft / rack)</dt>
                <dd className="text-emerald-400 font-semibold tabular-nums">
                  {model.totalRacks.toLocaleString()} racks
                </dd>
              </div>
            </dl>
          </section>

          {/* ================================================================
              STEP 4: CPU VS. GPU HARDWARE MIX & COST
             ================================================================ */}
          <section
            ref={(el) => {
              stepRefs.current[3] = el;
            }}
            data-step="4"
            className={`border-t pt-6 space-y-5 transition-opacity duration-300 ${
              activeStep === 4 ? 'border-amber-400 opacity-100' : 'border-zinc-800 opacity-65'
            }`}
          >
            <div className="space-y-1">
              <div className="font-mono text-[10px] uppercase tracking-widest text-amber-400">
                STAGE 04 // SILICON DENSITY &amp; CAPITAL EXPENDITURE
              </div>
              <h2 className="text-lg font-normal text-white">
                4. CPU vs. AI GPU Hardware Mix &amp; Cost
              </h2>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              What goes inside those <strong className="text-white">{model.totalRacks.toLocaleString()} racks</strong> changes both the cost and power appetite by nearly <strong className="text-white">8× to 18×</strong>. A traditional cloud/enterprise CPU rack draws ~12 kW and costs ~$160k. An AI liquid-cooled GPU rack (NVIDIA H200 / GB200 NVL72 class) draws ~95 kW and costs ~$2.9M per cabinet.
            </p>

            {/* Quick Hardware Mix Presets */}
            <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
              {[
                { label: '0% GPU (Traditional Cloud CPU)', val: 0 },
                { label: '25% GPU (Hybrid Enterprise)', val: 25 },
                { label: '50% GPU (Balanced AI/Cloud)', val: 50 },
                { label: '100% GPU (AI Supercluster)', val: 100 },
              ].map((m) => (
                <button
                  key={m.val}
                  type="button"
                  onClick={() => handleUpdateGpuMix(m.val)}
                  className={`px-2.5 py-1 border transition cursor-pointer ${
                    gpuMixPct === m.val
                      ? 'border-emerald-400 text-emerald-300 bg-emerald-950/30'
                      : 'border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <dl className="divide-y divide-zinc-900 border-y border-zinc-800 font-mono text-xs">
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-400">Enterprise CPU Racks ({100 - gpuMixPct}% · 12 kW)</dt>
                <dd className="text-zinc-200 tabular-nums">
                  {model.cpuRacks.toLocaleString()} racks ({model.totalCpus.toLocaleString()} CPUs)
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-emerald-400">AI Liquid-Cooled GPU Racks ({gpuMixPct}% · 95 kW)</dt>
                <dd className="text-emerald-400 tabular-nums">
                  {model.gpuRacks.toLocaleString()} racks ({model.totalGpus.toLocaleString()} GPUs)
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-500">Building Shell + MEP Cost</dt>
                <dd className="text-zinc-300 tabular-nums">
                  {formatCompactCurrency(model.shellAndMepCost)}
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-500">IT Server &amp; GPU Silicon Cost</dt>
                <dd className="text-white tabular-nums">
                  {formatCompactCurrency(model.totalHardwareCost)}
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-200 font-semibold">Total Facility CapEx</dt>
                <dd className="text-amber-400 font-semibold tabular-nums">
                  {formatCompactCurrency(model.totalProjectCapEx)}
                </dd>
              </div>
            </dl>
          </section>

          {/* ================================================================
              STEP 5: ELECTRICITY DEMAND & HOUSEHOLD EQUIVALENT
             ================================================================ */}
          <section
            ref={(el) => {
              stepRefs.current[4] = el;
            }}
            data-step="5"
            className={`border-t pt-6 space-y-5 transition-opacity duration-300 ${
              activeStep === 5 ? 'border-amber-400 opacity-100' : 'border-zinc-800 opacity-65'
            }`}
          >
            <div className="space-y-1">
              <div className="font-mono text-[10px] uppercase tracking-widest text-amber-400">
                STAGE 05 // CONTINUOUS ELECTRICAL LOAD &amp; DIESEL BACKUP
              </div>
              <h2 className="text-lg font-normal text-white">
                5. How Much Electricity It Needs ({model.totalFacilityMW.toFixed(1)} MW)
              </h2>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              The servers alone draw <strong className="text-white">{model.itLoadMW.toFixed(1)} MW</strong> ({model.avgKwPerRack.toFixed(0)} kW/rack average). Adding cooling chillers, pumps, and transformer losses at a <strong className="text-white">{model.pue.toFixed(2)} PUE</strong> brings total continuous demand to{' '}
              <strong className="text-amber-400">{model.totalFacilityMW.toFixed(1)} MW</strong> ({model.annualGWh.toFixed(0)} GWh/year)—equivalent to{' '}
              <strong className="text-white">
                {model.equivHouseholds.toLocaleString()} Connecticut homes
              </strong>{' '}
              ({model.multipleOfTownHomes.toFixed(1)}× all households in {town.name}).
            </p>

            <dl className="divide-y divide-zinc-900 border-y border-zinc-800 font-mono text-xs">
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-500">Critical IT Server Load</dt>
                <dd className="text-white tabular-nums">{model.itLoadMW.toFixed(2)} MW</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-500">Cooling &amp; Electrical Overhead (PUE {model.pue})</dt>
                <dd className="text-sky-400 tabular-nums">+{model.coolingAndLossMW.toFixed(2)} MW</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-200 font-semibold">Total Continuous Utility Draw</dt>
                <dd className="text-amber-400 font-semibold tabular-nums">
                  {model.totalFacilityMW.toFixed(2)} MW ({model.annualGWh.toFixed(0)} GWh/yr)
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-500">Residential Equivalent vs. {town.name}</dt>
                <dd className="text-white tabular-nums">
                  {model.equivHouseholds.toLocaleString()} homes ({model.multipleOfTownHomes.toFixed(1)}× {town.name})
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-500">Share of All Litchfield County Homes</dt>
                <dd className="text-zinc-300 tabular-nums">
                  {model.pctOfCountyHomes.toFixed(1)}% of county ({TOTAL_LITCHFIELD_COUNTY_HOUSEHOLDS.toLocaleString()} homes)
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-500">Backup Diesel Fleet (2.75 MW Tier-4)</dt>
                <dd className="text-zinc-300 tabular-nums">
                  {model.dieselGensetsCount} gensets ({model.dieselGalPerHour.toLocaleString()} gal/hr)
                </dd>
              </div>
            </dl>
          </section>

          {/* ================================================================
              STEP 6: WHAT ELECTRICITY IS AVAILABLE FROM THE GRID
             ================================================================ */}
          <section
            ref={(el) => {
              stepRefs.current[5] = el;
            }}
            data-step="6"
            className={`border-t pt-6 space-y-5 transition-opacity duration-300 ${
              activeStep === 6 ? 'border-amber-400 opacity-100' : 'border-zinc-800 opacity-65'
            }`}
          >
            <div className="space-y-1">
              <div className="font-mono text-[10px] uppercase tracking-widest text-amber-400">
                STAGE 06 // EVERSOURCE SUBSTATION &amp; TRANSMISSION REALITY CHECK
              </div>
              <h2 className="text-lg font-normal text-white">
                6. What the Grid in {town.name} Can Actually Deliver
              </h2>
            </div>

            <div
              className={`p-3.5 border font-mono text-xs space-y-1.5 ${
                model.gridVerdict === 'LOCAL_FEEDER_OK'
                  ? 'border-emerald-700/80 bg-emerald-950/20 text-emerald-300'
                  : model.gridVerdict === 'SUBTRANSMISSION_115KV'
                  ? 'border-amber-600/80 bg-amber-950/20 text-amber-300'
                  : 'border-rose-700/80 bg-rose-950/20 text-rose-300'
              }`}
            >
              <div className="font-semibold uppercase tracking-wider">
                {model.gridVerdictTitle}
              </div>
              <p className="font-sans text-xs text-zinc-300 leading-relaxed">
                {model.gridVerdictSummary}
              </p>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              <strong className="text-zinc-200">Local Grid Context ({town.name}):</strong>{' '}
              {town.gridNote}
            </p>

            <dl className="divide-y divide-zinc-900 border-y border-zinc-800 font-mono text-xs">
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-500">Local Town Feeder Voltage / Est. Headroom</dt>
                <dd className="text-zinc-300 tabular-nums">
                  {town.localFeederVoltageKV} kV (~{town.estLocalFeederSpareMW} MW max)
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-500">Nearest Utility Substation</dt>
                <dd className="text-white tabular-nums text-right">
                  {model.nearestSub.name} ({model.nearestSub.maxVoltageKV} kV · {model.nearestSubDist.toFixed(1)} mi)
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-500">Nearest Transmission Right-of-Way</dt>
                <dd className="text-sky-300 tabular-nums text-right">
                  {model.nearestCorridor?.corridorName} ({model.nearestCorridor?.voltageKV} kV · {model.nearestLineDist.toFixed(1)} mi)
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-500">Nearest 345 kV Bulk Backbone Node</dt>
                <dd className="text-amber-400 tabular-nums text-right">
                  {model.nearest345Sub.name} (345 kV · {model.nearest345Dist.toFixed(1)} mi)
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-zinc-500">Nearest Power Generating Station</dt>
                <dd className="text-zinc-300 tabular-nums text-right inline-flex items-center gap-1.5">
                  <PlantFuelIcon fuel={model.nearestPlant.primaryFuel} size={15} />
                  <span>
                    {model.nearestPlant.name} ({model.nearestPlant.totalMW} MW {model.nearestPlant.primaryFuel} · {model.nearestPlantDist.toFixed(1)} mi)
                  </span>
                </dd>
              </div>
            </dl>

            {/* Transmission Lines Passing Through or Near Selected Town */}
            {model.uniqueTownCorridors.length > 0 && (
              <div className="border border-sky-900/60 bg-sky-950/15 p-3.5 space-y-2.5 font-mono text-xs">
                <div className="text-[10px] uppercase tracking-wider text-sky-300">
                  Transmission Corridors Crossing or Near {town.name} (HIFLD Right-of-Way Trace)
                </div>
                <div className="divide-y divide-zinc-800/80">
                  {model.uniqueTownCorridors.map((item) => (
                    <div key={item.corridor.id} className="py-2 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-white font-semibold">
                          {item.corridor.corridorName}
                        </span>
                        <span className="text-[11px] tabular-nums text-sky-300">
                          {item.corridor.voltageKV} kV · {item.corridor.lengthMiles} mi ({item.minDistMiles} mi from town center)
                        </span>
                      </div>
                      {item.corridor.townsTraversed.length > 0 && (
                        <div className="text-[11px] text-zinc-400">
                          Route: <span className="text-zinc-200">{item.corridor.townsTraversed.join(' → ')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="font-sans text-[11px] text-zinc-400 leading-relaxed pt-1 border-t border-zinc-800/80">
                  Note: Utility databases label corridors only by their two terminal switching stations (e.g., <code className="text-zinc-200">TORRINGTON TERMINAL ↔ FALLS VILLAGE</code>). By indexing all 14 GPS right-of-way vertices along the corridor, we trace how the 115 kV line runs from Torrington through Litchfield, Goshen, and Cornwall to Falls Village.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: Sticky Animated Map + Architectural & Power Stage (7 cols) */}
        <div className="lg:col-span-7 lg:sticky lg:top-28 space-y-3">
          {/* Top Stage Bar + Layer Checkboxes */}
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-zinc-400">
            <span>
              LIVE SPATIAL OVERLAY //{' '}
              <strong className="text-white">{town.name.toUpperCase()}</strong> (STAGE 0{activeStep})
            </span>
            <button
              type="button"
              onClick={() => setShowSatelliteOnParcel((p) => !p)}
              className="text-zinc-400 hover:text-white underline underline-offset-4 cursor-pointer"
            >
              Basemap: {showSatelliteOnParcel ? 'Aerial Satellite' : 'Cartographic Dark'}
            </button>
          </div>

          {/* Map Layer Checkboxes */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] bg-zinc-950/80 border border-zinc-800/90 px-3 py-2">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 mr-1">
              LAYERS:
            </span>
            <label className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-zinc-800 bg-zinc-900/70 text-zinc-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showMapPlants}
                onChange={() => setShowMapPlants((p) => !p)}
                className="sr-only"
              />
              <span
                className={`w-3.5 h-3.5 rounded-[2px] border flex items-center justify-center ${
                  showMapPlants
                    ? 'bg-cyan-400 border-cyan-300 text-black'
                    : 'border-zinc-700 bg-zinc-900 text-transparent'
                }`}
              >
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              <PlantFuelIcon fuel="nuclear" size={14} />
              <span>Power Plants ({ctPlants.length})</span>
            </label>

            <label className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-zinc-800 bg-zinc-900/70 text-zinc-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showMapDataCenters}
                onChange={() => setShowMapDataCenters((p) => !p)}
                className="sr-only"
              />
              <span
                className={`w-3.5 h-3.5 rounded-[2px] border flex items-center justify-center ${
                  showMapDataCenters
                    ? 'bg-emerald-400 border-emerald-300 text-black'
                    : 'border-zinc-700 bg-zinc-900 text-transparent'
                }`}
              >
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              <DataCenterIcon size={13} />
              <span>CT Data Centers ({ctDataCenters.length})</span>
            </label>

            <label className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-zinc-800 bg-zinc-900/70 text-zinc-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showMapLines}
                onChange={() => setShowMapLines((p) => !p)}
                className="sr-only"
              />
              <span
                className={`w-3.5 h-3.5 rounded-[2px] border flex items-center justify-center ${
                  showMapLines
                    ? 'bg-sky-400 border-sky-300 text-black'
                    : 'border-zinc-700 bg-zinc-900 text-transparent'
                }`}
              >
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              <span>Power Lines</span>
            </label>

            <label className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-zinc-800 bg-zinc-900/70 text-zinc-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showMapSubstations}
                onChange={() => setShowMapSubstations((p) => !p)}
                className="sr-only"
              />
              <span
                className={`w-3.5 h-3.5 rounded-[2px] border flex items-center justify-center ${
                  showMapSubstations
                    ? 'bg-amber-400 border-amber-300 text-black'
                    : 'border-zinc-700 bg-zinc-900 text-transparent'
                }`}
              >
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              <span>Substations</span>
            </label>
          </div>

          {/* Interactive Map Showing the Scaled Plot & Grid Tie-In in the Selected Litchfield County Town */}
          <div className="relative h-[320px] sm:h-[350px] w-full bg-[#1b1d20] border border-zinc-800 overflow-hidden">
            <MapContainer
              center={mapViewport.center}
              zoom={mapViewport.zoom}
              minZoom={7}
              maxZoom={18}
              zoomControl={false}
              scrollWheelZoom={true}
              className="h-full w-full z-0 bg-[#1b1d20]"
            >
              <MapViewportUpdater
                center={mapViewport.center}
                zoom={mapViewport.zoom}
              />

              {showSatelliteOnParcel ? (
                <TileLayer
                  attribution="ESRI / MAXAR"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  maxNativeZoom={18}
                  maxZoom={18}
                />
              ) : (
                <TileLayer
                  attribution="ESRI"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                  maxNativeZoom={16}
                  maxZoom={18}
                />
              )}

              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                maxNativeZoom={16}
                maxZoom={18}
                opacity={0.9}
              />

              <MapZoomButtons
                center={mapViewport.center}
                defaultZoom={mapViewport.zoom}
              />

              {/* All 26 Litchfield County Town Dots for Context */}
              {LITCHFIELD_COUNTY_TOWNS.map((t) => {
                const isCurrent = t.id === town.id;
                return (
                  <CircleMarker
                    key={t.id}
                    center={[t.lat, t.lng]}
                    radius={isCurrent ? 5 : 3}
                    pathOptions={{
                      color: isCurrent ? '#ffffff' : '#71717a',
                      fillColor: isCurrent ? '#f59e0b' : '#27272a',
                      fillOpacity: 0.9,
                      weight: isCurrent ? 2 : 1,
                    }}
                    eventHandlers={{
                      click: () => handleUpdateTown(t.id),
                    }}
                  >
                    <Tooltip>
                      <span className="font-mono text-[11px]">
                        {t.name} ({t.localFeederVoltageKV} kV local / {t.maxLotCoveragePct}% max coverage)
                      </span>
                    </Tooltip>
                  </CircleMarker>
                );
              })}

              {/* Transmission Lines (Highlighted in Stage 6, subtle in Stages 1–5) */}
              {showMapLines &&
                ctCorridors.map((line) => {
                  const isNearestCorridor =
                    activeStep === 6 &&
                    model.nearestCorridor?.id === line.id;
                  return (
                    <Polyline
                      key={line.id}
                      positions={line.coordinates}
                      pathOptions={{
                        color: isNearestCorridor
                          ? '#ffffff'
                          : line.voltageKV >= 345
                            ? '#f59e0b'
                            : '#7dd3fc',
                        weight: isNearestCorridor
                          ? 3
                          : activeStep === 6
                            ? line.voltageKV >= 345
                              ? 2.4
                              : 1.5
                            : 1.1,
                        opacity: isNearestCorridor
                          ? 1
                          : activeStep === 6
                            ? 0.85
                            : 0.45,
                      }}
                    >
                      <Tooltip sticky>
                        <div className="font-mono text-[11px] space-y-0.5">
                          <div>
                            <strong>{line.voltageKV} kV</strong> · {line.corridorName} ({line.lengthMiles} mi)
                          </div>
                          {line.townsTraversed.length > 0 && (
                            <div className="text-[10px] text-sky-300">
                              Route: {line.townsTraversed.join(' → ')}
                            </div>
                          )}
                        </div>
                      </Tooltip>
                    </Polyline>
                  );
                })}

              {/* Named Substations */}
              {showMapSubstations &&
                ctNamedSubstations.map((sub) => (
                  <CircleMarker
                    key={sub.id}
                    center={[sub.lat, sub.lng]}
                    radius={sub.maxVoltageKV >= 345 ? 3.5 : 2.5}
                    pathOptions={{
                      color: sub.maxVoltageKV >= 345 ? '#fbbf24' : '#38bdf8',
                      fillColor: '#18181b',
                      fillOpacity: 1,
                      weight: 1.3,
                    }}
                  >
                    <Tooltip>
                      <span className="font-mono text-[11px]">
                        {sub.name} Substation ({sub.maxVoltageKV} kV)
                      </span>
                    </Tooltip>
                  </CircleMarker>
                ))}

              {/* Power Plants with Custom Fuel & Carbon Icons */}
              {showMapPlants &&
                ctPlants.map((plant) => {
                  const fuelVis = getFuelVisual(plant.primaryFuel);
                  return (
                    <Marker
                      key={plant.id}
                      position={[plant.lat, plant.lng]}
                      icon={getPowerPlantDivIcon(
                        plant.primaryFuel,
                        plant.totalMW,
                        model.nearestPlant.id === plant.id && activeStep === 6
                      )}
                    >
                      <Tooltip direction="top" offset={[0, -8]}>
                        <span className="font-mono text-[11px]">
                          <strong>{plant.name}</strong> · {plant.totalMW} MW ({fuelVis.label}) — {plant.city}
                        </span>
                      </Tooltip>
                    </Marker>
                  );
                })}

              {/* CT Data Centers with Custom Server Rack Icons */}
              {showMapDataCenters &&
                ctDataCenters.map((dc) => (
                  <Marker
                    key={dc.id}
                    position={[dc.lat, dc.lng]}
                    icon={getDataCenterDivIcon(false)}
                  >
                    <Tooltip direction="top" offset={[0, -8]}>
                      <span className="font-mono text-[11px]">
                        <strong>{dc.name}</strong> ({dc.powerCapacityMW}) · {dc.city}
                      </span>
                    </Tooltip>
                  </Marker>
                ))}

              {/* Outer Gross Land Parcel Polygon (Stage 1+) */}
              <Polygon
                positions={parcelPolygon}
                pathOptions={{
                  color: '#f59e0b',
                  weight: 2,
                  dashArray: activeStep >= 2 ? '4 4' : undefined,
                  fillColor: '#f59e0b',
                  fillOpacity: activeStep === 1 ? 0.25 : 0.08,
                }}
              >
                <Tooltip sticky>
                  <span className="font-mono text-[11px]">
                    Gross Parcel: {parcelAcres} acres ({Math.round(model.parcelWidthFt)} ft × {Math.round(model.parcelHeightFt)} ft)
                  </span>
                </Tooltip>
              </Polygon>

              {/* Inner Setback Envelope Polygon (Stage 2+) */}
              {activeStep >= 2 && (
                <Polygon
                  positions={setbackEnvelopePolygon}
                  pathOptions={{
                    color: '#a1a1aa',
                    weight: 1,
                    dashArray: '2 3',
                    fillColor: '#52525b',
                    fillOpacity: 0.12,
                  }}
                />
              )}

              {/* Buildable Data Center Shell Polygon (Stage 2+) */}
              {activeStep >= 2 && (
                <Polygon
                  positions={buildingPolygon}
                  pathOptions={{
                    color: '#ffffff',
                    weight: 1.75,
                    fillColor: activeStep >= 3 ? '#27272a' : '#10b981',
                    fillOpacity: activeStep >= 3 ? 0.85 : 0.45,
                  }}
                >
                  <Tooltip sticky>
                    <span className="font-mono text-[11px]">
                      Building Footprint: {Math.round(model.buildingFootprintSqFt).toLocaleString()} sq ft ({model.buildingAcres.toFixed(2)} ac)
                    </span>
                  </Tooltip>
                </Polygon>
              )}

              {/* Compute White Space Core Polygon inside Building (Stage 3+) */}
              {activeStep >= 3 && (
                <Polygon
                  positions={whiteSpacePolygon}
                  pathOptions={{
                    color: '#10b981',
                    weight: 1.5,
                    fillColor: '#10b981',
                    fillOpacity: 0.65,
                  }}
                >
                  <Tooltip sticky>
                    <span className="font-mono text-[11px]">
                      42% Server White Space: {Math.round(model.whiteSpaceSqFt).toLocaleString()} sq ft ({model.totalRacks.toLocaleString()} racks)
                    </span>
                  </Tooltip>
                </Polygon>
              )}

              {/* Stage 6: Nearest Substation & Feeder Tie-In Vector */}
              {activeStep === 6 && (
                <>
                  {/* Vector to Nearest Transmission Line Right-of-Way Tap */}
                  <Polyline
                    positions={[
                      [town.lat, town.lng],
                      model.nearestLineTap,
                    ]}
                    pathOptions={{
                      color: '#38bdf8',
                      weight: 2,
                      dashArray: '3 4',
                      opacity: 0.95,
                    }}
                  >
                    <Tooltip sticky>
                      <span className="font-mono text-[10px]">
                        Tap to {model.nearestCorridor?.corridorName} ({model.nearestCorridor?.voltageKV} kV · {model.nearestLineDist.toFixed(1)} mi)
                      </span>
                    </Tooltip>
                  </Polyline>
                  <Polyline
                    positions={[
                      [town.lat, town.lng],
                      [model.nearestSub.lat, model.nearestSub.lng],
                    ]}
                    pathOptions={{
                      color: '#ffffff',
                      weight: 2,
                      dashArray: '5 5',
                      opacity: 0.95,
                    }}
                  />
                  <Polyline
                    positions={[
                      [town.lat, town.lng],
                      [model.nearest345Sub.lat, model.nearest345Sub.lng],
                    ]}
                    pathOptions={{
                      color: '#f59e0b',
                      weight: 1.5,
                      dashArray: '2 5',
                      opacity: 0.85,
                    }}
                  />
                  <CircleMarker
                    center={[model.nearestSub.lat, model.nearestSub.lng]}
                    radius={5.5}
                    pathOptions={{
                      color: '#ffffff',
                      fillColor: '#09090b',
                      fillOpacity: 1,
                      weight: 2,
                    }}
                  >
                    <Tooltip permanent direction="top" offset={[0, -6]}>
                      <span className="font-mono text-[10px]">
                        {model.nearestSub.name} ({model.nearestSub.maxVoltageKV} kV · {model.nearestSubDist.toFixed(1)} mi)
                      </span>
                    </Tooltip>
                  </CircleMarker>
                </>
              )}
            </MapContainer>
          </div>

          {/* Animated Architectural & Engineering Diagram Panel (Morphs with Active Step) */}
          <div className="border border-zinc-800 bg-zinc-950/60 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 font-mono text-xs">
              <span className="text-white font-semibold">
                {activeStep === 1 && 'ARCHITECTURAL DIAGRAM // PARCEL DIMENSIONS & SCALE'}
                {activeStep === 2 && 'ZONING ENVELOPE // SETBACKS, WETLANDS & COVERAGE CAP'}
                {activeStep === 3 && 'FLOORPLAN PARTITION // SERVER WHITE SPACE VS. MEP SUPPORT'}
                {activeStep === 4 && 'RACK MATRIX // CPU VS. AI GPU HARDWARE DENSITY & CAPEX'}
                {activeStep === 5 && 'ELECTRICAL LOAD // POWER FLOW & TOWN HOUSEHOLD COMPARISON'}
                {activeStep === 6 && 'GRID INTERCONNECTION // SUBSTATION CAPACITY VS. FACILITY DEMAND'}
              </span>
              <span className="text-zinc-500">Step {activeStep} of 6</span>
            </div>

            {/* Visual Proportional Blueprint SVG for Steps 1, 2, 3 */}
            {activeStep <= 3 && (
              <div className="space-y-3">
                <svg
                  viewBox="0 0 600 240"
                  className="w-full h-52 bg-[#09090b] border border-zinc-900"
                >
                  {/* Outer Gross Parcel Box */}
                  <rect
                    x="30"
                    y="16"
                    width="540"
                    height="208"
                    fill="rgba(245, 158, 11, 0.06)"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeDasharray={activeStep >= 2 ? '5 4' : 'none'}
                  />
                  <text
                    x="42"
                    y="34"
                    fill="#fbbf24"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    Gross Plot: {parcelAcres} ac ({Math.round(model.parcelWidthFt)} ft × {Math.round(model.parcelHeightFt)} ft)
                  </text>

                  {/* Stage 2+: Setback & Wetland Ring */}
                  {activeStep >= 2 && (
                    <>
                      <rect
                        x="75"
                        y="42"
                        width="450"
                        height="156"
                        fill="rgba(161, 161, 170, 0.05)"
                        stroke="#71717a"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                      <text
                        x="84"
                        y="56"
                        fill="#a1a1aa"
                        fontSize="9.5"
                        fontFamily="monospace"
                      >
                        Setback ({town.frontSetbackFt}ft) + Wetlands ({town.wetlandBufferPct}%) · Max Coverage {town.maxLotCoveragePct}%
                      </text>
                    </>
                  )}

                  {/* Stage 2: Single Buildable Footprint Box */}
                  {activeStep === 2 && (
                    <g>
                      <rect
                        x="145"
                        y="66"
                        width="310"
                        height="112"
                        fill="rgba(16, 185, 129, 0.2)"
                        stroke="#10b981"
                        strokeWidth="1.75"
                      />
                      <text
                        x="300"
                        y="118"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="11"
                        fontFamily="monospace"
                      >
                        Max Building Shell: {Math.round(model.buildingFootprintSqFt).toLocaleString()} sq ft
                      </text>
                      <text
                        x="300"
                        y="136"
                        textAnchor="middle"
                        fill="#34d399"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        ({model.buildingAcres.toFixed(2)} acres · {Math.round(model.buildingWidthFt)} ft × {Math.round(model.buildingHeightFt)} ft)
                      </text>
                    </g>
                  )}

                  {/* Stage 3: Subdivided Building Floorplan (42% White Space, 24% Electrical, 20% Cooling, 14% Admin) */}
                  {activeStep === 3 && (
                    <g>
                      {/* 42% Compute White Space */}
                      <rect
                        x="130"
                        y="64"
                        width="165"
                        height="116"
                        fill="rgba(16, 185, 129, 0.28)"
                        stroke="#10b981"
                        strokeWidth="1.5"
                      />
                      <text
                        x="212"
                        y="115"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        42% WHITE SPACE
                      </text>
                      <text
                        x="212"
                        y="130"
                        textAnchor="middle"
                        fill="#6ee7b7"
                        fontSize="9.5"
                        fontFamily="monospace"
                      >
                        {Math.round(model.whiteSpaceSqFt).toLocaleString()} sq ft
                      </text>
                      <text
                        x="212"
                        y="144"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9.5"
                        fontFamily="monospace"
                      >
                        ({model.totalRacks.toLocaleString()} Server Racks)
                      </text>

                      {/* 24% Electrical UPS / Switchgear */}
                      <rect
                        x="298"
                        y="64"
                        width="95"
                        height="116"
                        fill="rgba(245, 158, 11, 0.22)"
                        stroke="#f59e0b"
                        strokeWidth="1.2"
                      />
                      <text
                        x="345"
                        y="116"
                        textAnchor="middle"
                        fill="#fde68a"
                        fontSize="9.5"
                        fontFamily="monospace"
                      >
                        24% UPS &amp;
                      </text>
                      <text
                        x="345"
                        y="130"
                        textAnchor="middle"
                        fill="#fde68a"
                        fontSize="9.5"
                        fontFamily="monospace"
                      >
                        SWITCHGEAR
                      </text>

                      {/* 20% Cooling Plant */}
                      <rect
                        x="396"
                        y="64"
                        width="74"
                        height="72"
                        fill="rgba(56, 189, 248, 0.2)"
                        stroke="#38bdf8"
                        strokeWidth="1.2"
                      />
                      <text
                        x="433"
                        y="98"
                        textAnchor="middle"
                        fill="#bae6fd"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        20% CHILLERS
                      </text>
                      <text
                        x="433"
                        y="111"
                        textAnchor="middle"
                        fill="#bae6fd"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        &amp; COOLING
                      </text>

                      {/* 14% Loading / NOC / Security */}
                      <rect
                        x="396"
                        y="139"
                        width="74"
                        height="41"
                        fill="rgba(161, 161, 170, 0.2)"
                        stroke="#a1a1aa"
                        strokeWidth="1"
                      />
                      <text
                        x="433"
                        y="163"
                        textAnchor="middle"
                        fill="#e4e4e7"
                        fontSize="8.5"
                        fontFamily="monospace"
                      >
                        14% NOC/DOCK
                      </text>
                    </g>
                  )}

                  {activeStep === 1 && (
                    <text
                      x="300"
                      y="125"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="12"
                      fontFamily="monospace"
                    >
                      {Math.round(model.grossSqFt).toLocaleString()} sq ft ({model.footballFields.toFixed(1)} Football Fields)
                    </text>
                  )}
                </svg>
              </div>
            )}

            {/* Step 4 Visual: CPU vs GPU Rack Grid & Cost Breakdown */}
            {activeStep === 4 && (
              <div className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-300">
                      CPU Racks: {model.cpuRacks.toLocaleString()} ({100 - gpuMixPct}%)
                    </span>
                    <span className="text-emerald-400">
                      AI GPU Racks: {model.gpuRacks.toLocaleString()} ({gpuMixPct}%)
                    </span>
                  </div>
                  {/* Visual 50-cell rack array bar */}
                  <div className="grid grid-cols-25 gap-1 pt-1">
                    {Array.from({ length: 50 }).map((_, idx) => {
                      const isGpuCell = idx < Math.round(gpuMixPct / 2);
                      return (
                        <span
                          key={idx}
                          className={`h-3.5 block ${
                            isGpuCell
                              ? 'bg-emerald-400 border border-emerald-200'
                              : 'bg-zinc-700 border border-zinc-600'
                          }`}
                          title={
                            isGpuCell
                              ? 'AI GPU Rack (95 kW · $2.9M)'
                              : 'Enterprise CPU Rack (12 kW · $160k)'
                          }
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-zinc-800/80">
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase">Shell &amp; Cooling</div>
                    <div className="text-sm text-zinc-200 tabular-nums mt-0.5">
                      {formatCompactCurrency(model.shellAndMepCost)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase">CPU + GPU Silicon</div>
                    <div className="text-sm text-emerald-400 tabular-nums mt-0.5">
                      {formatCompactCurrency(model.totalHardwareCost)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase">Total CapEx</div>
                    <div className="text-sm text-amber-400 font-semibold tabular-nums mt-0.5">
                      {formatCompactCurrency(model.totalProjectCapEx)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5 Visual: Power Load vs. Town & County Households */}
            {activeStep === 5 && (
              <div className="space-y-4 font-mono text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Facility Continuous Demand</span>
                    <span className="text-amber-400 font-semibold tabular-nums">
                      {model.totalFacilityMW.toFixed(1)} MW ({model.equivHouseholds.toLocaleString()} Homes Equiv.)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-zinc-900 flex overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full"
                      style={{ width: `${(1 / model.pue) * 100}%` }}
                      title="IT Server Load"
                    />
                    <div
                      className="bg-sky-400 h-full"
                      style={{ width: `${((model.pue - 1) / model.pue) * 100}%` }}
                      title="Chillers, Pumps & Transformer Overhead"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>■ IT Racks: {model.itLoadMW.toFixed(1)} MW</span>
                    <span>■ Cooling &amp; PUE ({model.pue}): +{model.coolingAndLossMW.toFixed(1)} MW</span>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-zinc-800/80 pt-3">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">
                      All Households in {town.name} ({town.households.toLocaleString()} homes)
                    </span>
                    <span className="text-white tabular-nums">
                      Facility = {model.multipleOfTownHomes.toFixed(1)}× {town.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">
                      All Litchfield County Households ({TOTAL_LITCHFIELD_COUNTY_HOUSEHOLDS.toLocaleString()} homes)
                    </span>
                    <span className="text-amber-400 tabular-nums">
                      {model.pctOfCountyHomes.toFixed(1)}% of entire county
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6 Visual: Grid Feeder Capacity Gauge */}
            {activeStep === 6 && (
              <div className="space-y-3 font-mono text-xs">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2.5 border border-zinc-800 bg-[#09090b]">
                    <div className="text-[10px] text-zinc-500">LOCAL FEEDER</div>
                    <div className="text-sm text-zinc-200 mt-0.5 tabular-nums">
                      ~{town.estLocalFeederSpareMW} MW
                    </div>
                    <div className="text-[10px] text-zinc-500">{town.localFeederVoltageKV} kV</div>
                  </div>
                  <div className="p-2.5 border border-zinc-800 bg-[#09090b]">
                    <div className="text-[10px] text-zinc-500">NEAREST SUBSTATION</div>
                    <div className="text-sm text-sky-400 mt-0.5 tabular-nums">
                      {model.nearestSub.maxVoltageKV} kV
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">
                      {model.nearestSub.name} ({model.nearestSubDist.toFixed(1)} mi)
                    </div>
                  </div>
                  <div className="p-2.5 border border-zinc-800 bg-[#09090b]">
                    <div className="text-[10px] text-zinc-500">345 kV BACKBONE</div>
                    <div className="text-sm text-amber-400 mt-0.5 tabular-nums">
                      {model.nearest345Dist.toFixed(1)} mi
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">
                      {model.nearest345Sub.name}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
