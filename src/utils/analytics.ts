import type { FacilityPair } from '../data/facilities';

declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: { props?: Record<string, string | number | boolean> }
    ) => void;
  }
}

export interface PairStatRecord {
  pairId: string;
  title: string;
  dataCenterName: string;
  decoyName: string;
  dataCenterSubtype: string;
  decoySubtype: string;
  isConnecticut: boolean;
  correct: number;
  total: number;
}

export interface AnalyticsStore {
  totalCorrect: number;
  totalGuesses: number;
  bySubtype: Record<string, { correct: number; total: number }>;
  byPair: Record<string, PairStatRecord>;
  recentEvents: Array<{
    timestamp: string;
    pairId: string;
    result: 'Correct' | 'Incorrect';
    dataCenterName: string;
    pickedName: string;
    subtype: string;
  }>;
}

const STORAGE_KEY = 'thefocus_dc_recon_analytics_v1';

// Baseline benchmark priors by difficulty so visitors immediately see a meaningful comparison %
export const BASELINE_BENCHMARK_ACCURACY: Record<string, number> = {
  'Hyperscale': 84,
  'Colocation (COLO)': 74,
  'Enterprise Data Center': 69,
  'AI Supercluster': 66,
  'Edge / Small Data Hub': 58,
  'Suspected Small-Scale Server Room': 46,
};

export function loadAnalyticsStore(): AnalyticsStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as AnalyticsStore;
    }
  } catch {
    // ignore storage errors
  }
  return {
    totalCorrect: 0,
    totalGuesses: 0,
    bySubtype: {},
    byPair: {},
    recentEvents: [],
  };
}

export function recordGuessAnalytics(
  pair: FacilityPair,
  isCorrect: boolean,
  pickedName: string
): AnalyticsStore {
  const isCT =
    pair.dataCenter.stateOrCountry.includes('CT') &&
    pair.decoy.stateOrCountry.includes('CT');

  // 1. Fire Plausible custom event with rich props
  try {
    if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
      window.plausible('Guess', {
        props: {
          result: isCorrect ? 'Correct' : 'Incorrect',
          correct: isCorrect ? '1' : '0',
          pair_id: pair.id,
          pair_title: pair.title,
          dc_name: pair.dataCenter.name,
          dc_subtype: pair.dataCenter.subtype,
          decoy_name: pair.decoy.name,
          decoy_subtype: pair.decoy.subtype,
          picked_facility: pickedName,
          difficulty: pair.difficulty,
          region: isCT ? 'Connecticut' : 'US / Global',
        },
      });
    }
  } catch {
    // ignore analytics blocker errors
  }

  // 2. Update persistent local store
  const store = loadAnalyticsStore();
  store.totalGuesses += 1;
  if (isCorrect) store.totalCorrect += 1;

  const st = pair.dataCenter.subtype;
  if (!store.bySubtype[st]) {
    store.bySubtype[st] = { correct: 0, total: 0 };
  }
  store.bySubtype[st].total += 1;
  if (isCorrect) store.bySubtype[st].correct += 1;

  if (!store.byPair[pair.id]) {
    store.byPair[pair.id] = {
      pairId: pair.id,
      title: pair.title,
      dataCenterName: pair.dataCenter.name,
      decoyName: pair.decoy.name,
      dataCenterSubtype: pair.dataCenter.subtype,
      decoySubtype: pair.decoy.subtype,
      isConnecticut: isCT,
      correct: 0,
      total: 0,
    };
  }
  store.byPair[pair.id].total += 1;
  if (isCorrect) store.byPair[pair.id].correct += 1;

  store.recentEvents = [
    {
      timestamp: new Date().toLocaleTimeString(),
      pairId: pair.id,
      result: (isCorrect ? 'Correct' : 'Incorrect') as 'Correct' | 'Incorrect',
      dataCenterName: pair.dataCenter.name,
      pickedName,
      subtype: pair.dataCenter.subtype,
    },
    ...store.recentEvents.slice(0, 24),
  ];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }

  return store;
}

export function resetAnalyticsStore(): AnalyticsStore {
  const empty: AnalyticsStore = {
    totalCorrect: 0,
    totalGuesses: 0,
    bySubtype: {},
    byPair: {},
    recentEvents: [],
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
  } catch {
    // ignore
  }
  return empty;
}
