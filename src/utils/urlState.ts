import {
  CURATED_PAIRS,
  FACILITY_LOCATIONS,
  type DataCenterSubtype,
  type DifficultyLevel,
  type FacilityPair,
} from '../data/facilities';
import { POWER_STATIONS } from '../data/powerGridData';

export type AppTab = 'arena' | 'taxonomy' | 'power' | 'atlas' | 'walkthrough';

const VALID_TABS: AppTab[] = ['arena', 'taxonomy', 'power', 'atlas', 'walkthrough'];

const VALID_ZONING_SUBTYPES: DataCenterSubtype[] = [
  'Hyperscale',
  'AI Supercluster',
  'Colocation (COLO)',
  'Enterprise Data Center',
  'Edge / Small Data Hub',
  'Suspected Small-Scale Server Room',
];

const VALID_DIFFICULTIES: DifficultyLevel[] = ['easy', 'medium', 'hard'];

const NON_CT_REGIONS = new Set(['ashburn', 'columbia', 'quincy', 'memphis']);

export interface ParsedUrlState {
  tab: AppTab;
  connecticutOnly: boolean;
  excludeHyperscalers: boolean;
  zoningSubtypeFilter: DataCenterSubtype | 'all';
  // Arena state
  pairId: string | null;
  customPair: FacilityPair | null;
  showPowerLines: boolean;
  showMapLabels: boolean;
  showClue: boolean;
  // Power Grid state
  facilityId: string | null;
  plantId: string | null;
  regionId: string | null;
  ledgerMode: 'datacenters' | 'stations' | 'lines';
  // Litchfield Walkthrough state
  walkthroughTownId: string | null;
  walkthroughAcres: number | null;
  walkthroughGpuPct: number | null;
  // Shared / Atlas filters
  searchQuery: string;
  atlasTypeFilter: 'all' | 'datacenter' | 'decoy';
  atlasSubtypeFilter: string;
  atlasDifficultyFilter: DifficultyLevel | 'all';
  // Modals
  modal: 'guide' | 'accuracy' | null;
}

export function parseUrlState(search: string = window.location.search): ParsedUrlState {
  const params = new URLSearchParams(search);

  const rawTab = params.get('tab') as AppTab | null;
  const tab: AppTab = rawTab && VALID_TABS.includes(rawTab) ? rawTab : 'arena';

  const ctParam = params.get('ct');
  const hyperParam = params.get('hyper');

  let connecticutOnly = ctParam === '0' ? false : true;
  let excludeHyperscalers = hyperParam === '1' ? false : true;

  const rawTier = params.get('tier') as DataCenterSubtype | null;
  const zoningSubtypeFilter: DataCenterSubtype | 'all' =
    rawTier && VALID_ZONING_SUBTYPES.includes(rawTier) ? rawTier : 'all';

  if (
    zoningSubtypeFilter === 'Hyperscale' ||
    zoningSubtypeFilter === 'AI Supercluster'
  ) {
    excludeHyperscalers = false;
  }

  // Arena pair / custom pair resolution
  const pairId = params.get('pair');
  const dcId = params.get('dc');
  const decoyId = params.get('decoy');

  let customPair: FacilityPair | null = null;
  if (dcId) {
    const dc = FACILITY_LOCATIONS.find((f) => f.id === dcId);
    const decoy = decoyId
      ? FACILITY_LOCATIONS.find((f) => f.id === decoyId)
      : FACILITY_LOCATIONS.find(
          (f) =>
            !f.isDataCenter &&
            (dc?.stateOrCountry.includes('CT')
              ? f.stateOrCountry.includes('CT')
              : true)
        );

    if (dc && decoy) {
      if (!dc.stateOrCountry.includes('CT') || !decoy.stateOrCountry.includes('CT')) {
        connecticutOnly = false;
      }
      if (dc.subtype === 'Hyperscale' || dc.subtype === 'AI Supercluster') {
        excludeHyperscalers = false;
      }
      customPair = {
        id: `link-${dc.id}-${decoy.id}`,
        title: `${dc.subtype} vs. ${decoy.subtype}`,
        difficulty: dc.difficulty,
        categoryTag: `${dc.subtype} // ${decoy.subtype}`,
        comparisonLesson: `Direct comparison between ${dc.name} (${dc.city}, ${dc.stateOrCountry}) and ${decoy.name} (${decoy.city}, ${decoy.stateOrCountry}).`,
        dataCenter: dc,
        decoy: decoy,
      };
    }
  } else if (pairId) {
    const matchedPair = CURATED_PAIRS.find((p) => p.id === pairId);
    if (matchedPair) {
      const isCT =
        matchedPair.dataCenter.stateOrCountry.includes('CT') &&
        matchedPair.decoy.stateOrCountry.includes('CT');
      if (!isCT && ctParam === null) {
        connecticutOnly = false;
      }
      if (
        (matchedPair.dataCenter.subtype === 'Hyperscale' ||
          matchedPair.dataCenter.subtype === 'AI Supercluster') &&
        hyperParam === null
      ) {
        excludeHyperscalers = false;
      }
    }
  }

  // Power Grid state resolution
  const facilityId = params.get('facility');
  if (facilityId) {
    const fac = FACILITY_LOCATIONS.find((f) => f.id === facilityId);
    if (fac) {
      if (!fac.stateOrCountry.includes('CT') && ctParam === null) {
        connecticutOnly = false;
      }
      if (
        (fac.subtype === 'Hyperscale' || fac.subtype === 'AI Supercluster') &&
        hyperParam === null
      ) {
        excludeHyperscalers = false;
      }
    }
  }

  const plantId = params.get('plant');
  if (plantId) {
    const plant = POWER_STATIONS.find((p) => p.id === plantId);
    if (plant && !plant.isConnecticut && ctParam === null) {
      connecticutOnly = false;
    }
  }

  const regionId = params.get('region');
  if (regionId && NON_CT_REGIONS.has(regionId)) {
    if (ctParam === null) connecticutOnly = false;
    if (hyperParam === null) excludeHyperscalers = false;
  }

  const rawLedger = params.get('ledger');
  const ledgerMode: 'datacenters' | 'stations' | 'lines' =
    rawLedger === 'stations'
      ? 'stations'
      : rawLedger === 'lines'
        ? 'lines'
        : 'datacenters';

  // Walkthrough params
  const walkthroughTownId = params.get('town');
  const rawAcres = params.get('acres');
  const walkthroughAcres = rawAcres ? Number(rawAcres) : null;
  const rawGpu = params.get('gpu');
  const walkthroughGpuPct = rawGpu !== null ? Number(rawGpu) : null;

  // Atlas filters
  const searchQuery = params.get('q') ?? '';
  const rawType = params.get('type');
  const atlasTypeFilter: 'all' | 'datacenter' | 'decoy' =
    rawType === 'datacenter' || rawType === 'decoy' ? rawType : 'all';
  const atlasSubtypeFilter = params.get('subtype') ?? 'all';
  const rawDiff = params.get('diff') as DifficultyLevel | null;
  const atlasDifficultyFilter: DifficultyLevel | 'all' =
    rawDiff && VALID_DIFFICULTIES.includes(rawDiff) ? rawDiff : 'all';

  const rawModal = params.get('modal');
  const modal: 'guide' | 'accuracy' | null =
    rawModal === 'guide' || rawModal === 'accuracy' ? rawModal : null;

  return {
    tab,
    connecticutOnly,
    excludeHyperscalers,
    zoningSubtypeFilter,
    pairId,
    customPair,
    showPowerLines: params.get('lines') === '1',
    showMapLabels: params.get('labels') === '1',
    showClue: params.get('hint') === '1',
    facilityId,
    plantId,
    regionId,
    ledgerMode,
    walkthroughTownId,
    walkthroughAcres,
    walkthroughGpuPct,
    searchQuery,
    atlasTypeFilter,
    atlasSubtypeFilter,
    atlasDifficultyFilter,
    modal,
  };
}

export interface SerializableAppState {
  tab: AppTab;
  connecticutOnly: boolean;
  excludeHyperscalers: boolean;
  zoningSubtypeFilter: DataCenterSubtype | 'all';
  // Arena
  currentPairId?: string | null;
  customPair?: FacilityPair | null;
  showPowerLines?: boolean;
  showMapLabels?: boolean;
  showClue?: boolean;
  // Power Grid
  facilityId?: string | null;
  plantId?: string | null;
  regionId?: string | null;
  ledgerMode?: 'datacenters' | 'stations' | 'lines';
  // Walkthrough
  walkthroughTownId?: string | null;
  walkthroughAcres?: number | null;
  walkthroughGpuPct?: number | null;
  // Search & Atlas
  searchQuery?: string;
  atlasTypeFilter?: 'all' | 'datacenter' | 'decoy';
  atlasSubtypeFilter?: string;
  atlasDifficultyFilter?: DifficultyLevel | 'all';
  // Modals
  modal?: 'guide' | 'accuracy' | null;
}

export function buildUrlSearch(state: SerializableAppState): string {
  const params = new URLSearchParams();

  if (state.tab !== 'arena') {
    params.set('tab', state.tab);
  }

  if (!state.connecticutOnly) {
    params.set('ct', '0');
  }

  if (!state.excludeHyperscalers) {
    params.set('hyper', '1');
  }

  if (state.zoningSubtypeFilter !== 'all') {
    params.set('tier', state.zoningSubtypeFilter);
  }

  if (state.tab === 'arena') {
    if (state.customPair) {
      params.set('dc', state.customPair.dataCenter.id);
      params.set('decoy', state.customPair.decoy.id);
    } else if (state.currentPairId) {
      params.set('pair', state.currentPairId);
    }
    if (state.showPowerLines) params.set('lines', '1');
    if (state.showMapLabels) params.set('labels', '1');
    if (state.showClue) params.set('hint', '1');
  } else if (state.tab === 'power') {
    if (state.plantId) {
      params.set('plant', state.plantId);
    } else if (state.facilityId) {
      params.set('facility', state.facilityId);
    }
    if (state.regionId && state.regionId !== 'ct-grid' && state.regionId !== 'custom') {
      params.set('region', state.regionId);
    }
    if (state.ledgerMode === 'stations' || state.ledgerMode === 'lines') {
      params.set('ledger', state.ledgerMode);
    }
    if (state.searchQuery?.trim()) {
      params.set('q', state.searchQuery.trim());
    }
  } else if (state.tab === 'walkthrough') {
    if (state.walkthroughTownId && state.walkthroughTownId !== 'litchfield') {
      params.set('town', state.walkthroughTownId);
    }
    if (state.walkthroughAcres && state.walkthroughAcres !== 20) {
      params.set('acres', String(state.walkthroughAcres));
    }
    if (
      state.walkthroughGpuPct !== null &&
      state.walkthroughGpuPct !== undefined &&
      state.walkthroughGpuPct !== 40
    ) {
      params.set('gpu', String(state.walkthroughGpuPct));
    }
  } else if (state.tab === 'atlas') {
    if (state.atlasTypeFilter && state.atlasTypeFilter !== 'all') {
      params.set('type', state.atlasTypeFilter);
    }
    if (state.atlasSubtypeFilter && state.atlasSubtypeFilter !== 'all') {
      params.set('subtype', state.atlasSubtypeFilter);
    }
    if (state.atlasDifficultyFilter && state.atlasDifficultyFilter !== 'all') {
      params.set('diff', state.atlasDifficultyFilter);
    }
    if (state.searchQuery?.trim()) {
      params.set('q', state.searchQuery.trim());
    }
  }

  if (state.modal) {
    params.set('modal', state.modal);
  }

  const str = params.toString();
  return str ? `?${str}` : window.location.pathname;
}
