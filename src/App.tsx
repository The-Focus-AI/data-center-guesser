import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  CURATED_PAIRS,
  FACILITY_LOCATIONS,
  type DataCenterSubtype,
  type FacilityLocation,
  type FacilityPair,
} from './data/facilities';
import { SatellitePane } from './components/SatellitePane';
import { AtlasDirectory } from './components/AtlasDirectory';
import { FieldGuideModal } from './components/FieldGuideModal';
import { TaxonomyView } from './components/TaxonomyView';
import { AccuracyModal } from './components/AccuracyModal';
import {
  loadAnalyticsStore,
  recordGuessAnalytics,
  resetAnalyticsStore,
  BASELINE_BENCHMARK_ACCURACY,
  type AnalyticsStore,
} from './utils/analytics';

export function App() {
  const [activeTab, setActiveTab] = useState<'arena' | 'taxonomy' | 'atlas'>('arena');

  // Default to Connecticut Only + No Hyperscalers as requested
  const [connecticutOnly, setConnecticutOnly] = useState(true);
  const [excludeHyperscalers, setExcludeHyperscalers] = useState(true);
  const [zoningSubtypeFilter, setZoningSubtypeFilter] = useState<DataCenterSubtype | 'all'>('all');

  const [roundIndex, setRoundIndex] = useState(0);
  const [customPair, setCustomPair] = useState<FacilityPair | null>(null);
  const [swapSides, setSwapSides] = useState<boolean>(() => Math.random() > 0.5);

  // Game state
  const [selectedSide, setSelectedSide] = useState<'A' | 'B' | null>(null);
  const [showClue, setShowClue] = useState(false);
  const [showMapLabels, setShowMapLabels] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAccuracyOpen, setIsAccuracyOpen] = useState(false);

  // Persistent Analytics + Session Scoreboard
  const [analytics, setAnalytics] = useState<AnalyticsStore>(() =>
    loadAnalyticsStore()
  );

  const filteredPairs = useMemo(() => {
    const matches = CURATED_PAIRS.filter((p) => {
      if (connecticutOnly) {
        const isCT =
          p.dataCenter.stateOrCountry.includes('CT') &&
          p.decoy.stateOrCountry.includes('CT');
        if (!isCT) return false;
      }
      if (excludeHyperscalers) {
        if (
          p.dataCenter.subtype === 'Hyperscale' ||
          p.dataCenter.subtype === 'AI Supercluster'
        ) {
          return false;
        }
      }
      if (zoningSubtypeFilter !== 'all') {
        if (p.dataCenter.subtype !== zoningSubtypeFilter) {
          return false;
        }
      }
      return true;
    });

    return matches.length > 0 ? matches : CURATED_PAIRS;
  }, [connecticutOnly, excludeHyperscalers, zoningSubtypeFilter]);

  const currentPair: FacilityPair = useMemo(() => {
    if (customPair) return customPair;
    return filteredPairs[roundIndex % filteredPairs.length] || CURATED_PAIRS[0];
  }, [customPair, filteredPairs, roundIndex]);

  const facilityA = swapSides ? currentPair.decoy : currentPair.dataCenter;
  const facilityB = swapSides ? currentPair.dataCenter : currentPair.decoy;
  const isRevealed = selectedSide !== null;

  const isCorrectGuess =
    (selectedSide === 'A' && facilityA.isDataCenter) ||
    (selectedSide === 'B' && facilityB.isDataCenter);

  const handleSelectSide = useCallback(
    (side: 'A' | 'B') => {
      if (selectedSide !== null) return;
      setSelectedSide(side);

      const pickedFacility = side === 'A' ? facilityA : facilityB;
      const isRight = pickedFacility.isDataCenter;

      const updatedStore = recordGuessAnalytics(
        currentPair,
        isRight,
        pickedFacility.name
      );
      setAnalytics(updatedStore);
    },
    [selectedSide, facilityA, facilityB, currentPair]
  );

  const handleNextRound = useCallback(() => {
    setCustomPair(null);
    setSelectedSide(null);
    setShowClue(false);
    setSwapSides(Math.random() > 0.5);
    setRoundIndex((prev) => (prev + 1) % Math.max(1, filteredPairs.length));
  }, [filteredPairs.length]);

  const handleRandomMixPair = useCallback(() => {
    const dcs = FACILITY_LOCATIONS.filter((f) => {
      if (!f.isDataCenter) return false;
      if (connecticutOnly && !f.stateOrCountry.includes('CT')) return false;
      if (
        excludeHyperscalers &&
        (f.subtype === 'Hyperscale' || f.subtype === 'AI Supercluster')
      ) {
        return false;
      }
      if (zoningSubtypeFilter !== 'all' && f.subtype !== zoningSubtypeFilter) {
        return false;
      }
      return true;
    });
    const decoys = FACILITY_LOCATIONS.filter((f) => {
      if (f.isDataCenter) return false;
      if (connecticutOnly && !f.stateOrCountry.includes('CT')) return false;
      return true;
    });

    const randomDC = dcs[Math.floor(Math.random() * dcs.length)] || FACILITY_LOCATIONS[0];
    const randomDecoy =
      decoys[Math.floor(Math.random() * decoys.length)] ||
      FACILITY_LOCATIONS.find((f) => !f.isDataCenter)!;

    setCustomPair({
      id: `custom-${Date.now()}`,
      title: `${randomDC.subtype} vs. ${randomDecoy.subtype}`,
      difficulty: randomDC.difficulty,
      categoryTag: `${randomDC.subtype} // ${randomDecoy.subtype}`,
      comparisonLesson: `Compare ${randomDC.name} (${randomDC.city}, ${randomDC.stateOrCountry}) with ${randomDecoy.name} (${randomDecoy.city}, ${randomDecoy.stateOrCountry}).`,
      dataCenter: randomDC,
      decoy: randomDecoy,
    });
    setSelectedSide(null);
    setShowClue(false);
    setSwapSides(Math.random() > 0.5);
  }, [connecticutOnly, excludeHyperscalers, zoningSubtypeFilter]);

  const handlePlayFacilityFromAtlas = useCallback(
    (facility: FacilityLocation) => {
      const opponents = FACILITY_LOCATIONS.filter((f) => {
        if (f.isDataCenter === facility.isDataCenter) return false;
        if (connecticutOnly && !f.stateOrCountry.includes('CT')) return false;
        if (
          excludeHyperscalers &&
          f.isDataCenter &&
          (f.subtype === 'Hyperscale' || f.subtype === 'AI Supercluster')
        ) {
          return false;
        }
        return true;
      });
      const fallbackOpponents = FACILITY_LOCATIONS.filter(
        (f) => f.isDataCenter !== facility.isDataCenter
      );
      const pool = opponents.length > 0 ? opponents : fallbackOpponents;
      const randomOpponent = pool[Math.floor(Math.random() * pool.length)];

      const dc = facility.isDataCenter ? facility : randomOpponent;
      const decoy = facility.isDataCenter ? randomOpponent : facility;

      setCustomPair({
        id: `atlas-${facility.id}`,
        title: `${dc.subtype} vs. ${decoy.subtype}`,
        difficulty: facility.difficulty,
        categoryTag: `${dc.subtype} // ${decoy.subtype}`,
        comparisonLesson: `Direct comparison between ${dc.name} (${dc.city}, ${dc.stateOrCountry}) and ${decoy.name} (${decoy.city}, ${decoy.stateOrCountry}).`,
        dataCenter: dc,
        decoy: decoy,
      });
      setSelectedSide(null);
      setShowClue(false);
      setSwapSides(Math.random() > 0.5);
      setActiveTab('arena');
    },
    [connecticutOnly, excludeHyperscalers]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isGuideOpen) {
        setIsGuideOpen(false);
        return;
      }
      if (activeTab !== 'arena' || isGuideOpen) return;
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }
      if (!isRevealed) {
        if (e.key.toLowerCase() === 'a' || e.key === '1') {
          handleSelectSide('A');
        } else if (e.key.toLowerCase() === 'b' || e.key === '2') {
          handleSelectSide('B');
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNextRound();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTab, isGuideOpen, isRevealed, handleSelectSide, handleNextRound]);

  // Preset Mode Helpers
  const isCTMode = connecticutOnly && excludeHyperscalers && activeTab === 'arena';
  const isAllUSNoHyper = !connecticutOnly && excludeHyperscalers && activeTab === 'arena';
  const isAllWithHyper = !connecticutOnly && !excludeHyperscalers && activeTab === 'arena';

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-[#fafafa]">
      {/* Single Clean Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-[#09090b]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left Brand */}
          <a
            href="https://thefocus.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 hover:opacity-80 transition"
          >
            <span className="w-2 h-2 bg-white inline-block" />
            <span className="font-mono text-xs font-bold tracking-widest uppercase text-white">
              THEFOCUS.AI
            </span>
          </a>

          {/* Center / Right Clean Mode Navigation */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto font-mono text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab('arena');
                setCustomPair(null);
                setConnecticutOnly(true);
                setExcludeHyperscalers(true);
                setZoningSubtypeFilter('all');
                setRoundIndex(0);
                setSelectedSide(null);
              }}
              className={`px-3 py-1.5 transition cursor-pointer whitespace-nowrap ${
                isCTMode
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              CT Only (No Hyperscalers)
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('arena');
                setCustomPair(null);
                setConnecticutOnly(false);
                setExcludeHyperscalers(true);
                setZoningSubtypeFilter('all');
                setRoundIndex(0);
                setSelectedSide(null);
              }}
              className={`px-3 py-1.5 transition cursor-pointer whitespace-nowrap ${
                isAllUSNoHyper
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All US (No Hyperscalers)
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('arena');
                setCustomPair(null);
                setConnecticutOnly(false);
                setExcludeHyperscalers(false);
                setZoningSubtypeFilter('all');
                setRoundIndex(0);
                setSelectedSide(null);
              }}
              className={`px-3 py-1.5 transition cursor-pointer whitespace-nowrap ${
                isAllWithHyper
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All US (+ Hyperscalers)
            </button>

            <span className="text-zinc-800 px-1">|</span>

            <button
              type="button"
              onClick={() => setActiveTab('taxonomy')}
              className={`px-3 py-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'taxonomy'
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Size &amp; Energy Taxonomy
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('atlas')}
              className={`px-3 py-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'atlas'
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Atlas ({FACILITY_LOCATIONS.length})
            </button>

            <button
              type="button"
              onClick={() => setIsAccuracyOpen(true)}
              className="px-3 py-1.5 text-emerald-400 hover:text-emerald-300 transition cursor-pointer whitespace-nowrap"
            >
              Accuracy %
              {analytics.totalGuesses > 0 &&
                ` (${Math.round((analytics.totalCorrect / analytics.totalGuesses) * 100)}%)`}
            </button>

            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="px-3 py-1.5 text-zinc-400 hover:text-white transition cursor-pointer whitespace-nowrap"
            >
              Field Guide
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pb-12">
        {activeTab === 'taxonomy' ? (
          <TaxonomyView
            onSelectTierForAtlas={(subtype) => {
              setConnecticutOnly(false);
              if (subtype === 'Hyperscale' || subtype === 'AI Supercluster') {
                setExcludeHyperscalers(false);
              }
              setZoningSubtypeFilter(subtype);
              setActiveTab('atlas');
            }}
            onPlayFacility={handlePlayFacilityFromAtlas}
          />
        ) : activeTab === 'atlas' ? (
          <AtlasDirectory
            connecticutOnly={connecticutOnly}
            onToggleConnecticutOnly={() => setConnecticutOnly((p) => !p)}
            excludeHyperscalers={excludeHyperscalers}
            onToggleExcludeHyperscalers={() => setExcludeHyperscalers((p) => !p)}
            zoningSubtypeFilter={zoningSubtypeFilter}
            onChangeZoningSubtypeFilter={setZoningSubtypeFilter}
            onPlayFacility={handlePlayFacilityFromAtlas}
          />
        ) : (
          <div className="border-x border-b border-zinc-800">
            {/* Simple Hero Prompt Header */}
            <div className="px-6 py-6 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#09090b]">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  Which one is a data center?
                </h1>
                <p className="text-sm text-zinc-400 mt-1">
                  Click directly on either satellite image (or use zoom controls) to pick the building that houses servers.
                </p>
              </div>

              {/* Minimal Right Status & Controls */}
              <div className="flex items-center flex-wrap gap-2 font-mono text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAccuracyOpen(true)}
                  className="px-3 py-1.5 border border-zinc-800 hover:border-zinc-600 text-zinc-300 transition cursor-pointer"
                >
                  RIGHT %:{' '}
                  <strong className="text-emerald-400">
                    {analytics.totalGuesses > 0
                      ? `${Math.round((analytics.totalCorrect / analytics.totalGuesses) * 100)}% (${analytics.totalCorrect}/${analytics.totalGuesses})`
                      : '—'}
                  </strong>
                </button>

                <button
                  type="button"
                  onClick={() => setShowClue((prev) => !prev)}
                  className={`px-3 py-1.5 border transition cursor-pointer ${
                    showClue
                      ? 'border-white text-white bg-zinc-900'
                      : 'border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {showClue ? 'Hide Hint' : 'Hint'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowMapLabels((prev) => !prev)}
                  className={`px-3 py-1.5 border transition cursor-pointer ${
                    showMapLabels
                      ? 'border-white text-white bg-zinc-900'
                      : 'border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Labels {showMapLabels ? 'On' : 'Off'}
                </button>

                <button
                  type="button"
                  onClick={handleRandomMixPair}
                  className="px-3 py-1.5 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  Shuffle
                </button>

                {isRevealed && (
                  <button
                    type="button"
                    onClick={handleNextRound}
                    className="px-4 py-1.5 bg-white hover:bg-zinc-200 text-black font-semibold uppercase tracking-wider transition cursor-pointer"
                  >
                    Next Pair →
                  </button>
                )}
              </div>
            </div>

            {/* Optional Hint Strip */}
            {showClue && !isRevealed && (
              <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-950 text-xs text-zinc-300 flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-widest px-1.5 py-0.5 border border-zinc-700 text-zinc-400">
                  HINT
                </span>
                <span>{currentPair.dataCenter.clue}</span>
              </div>
            )}

            {/* Post-Guess Verdict Banner */}
            {isRevealed && (
              <div
                className={`px-6 py-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCorrectGuess ? 'bg-emerald-950/25' : 'bg-rose-950/25'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-wider font-bold">
                    <span className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 ${
                          isCorrectGuess ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      />
                      <span
                        className={
                          isCorrectGuess ? 'text-emerald-400' : 'text-rose-400'
                        }
                      >
                        {isCorrectGuess
                          ? `CORRECT — BUILDING ${selectedSide} IS THE DATA CENTER (${currentPair.dataCenter.subtype})`
                          : `INCORRECT — BUILDING ${selectedSide} IS A ${selectedSide === 'A' ? facilityA.subtype.toUpperCase() : facilityB.subtype.toUpperCase()}`}
                      </span>
                    </span>

                    <span className="px-2 py-0.5 border border-zinc-700 bg-zinc-950/80 text-[10px] text-zinc-300 font-normal">
                      TIER BENCHMARK ACCURACY:{' '}
                      <strong className="text-white">
                        {BASELINE_BENCHMARK_ACCURACY[currentPair.dataCenter.subtype] ?? 65}%
                      </strong>
                      {analytics.byPair[currentPair.id] && (
                        <>
                          {' '}• YOUR RATE ON THIS PAIR:{' '}
                          <strong className="text-emerald-400">
                            {Math.round(
                              (analytics.byPair[currentPair.id].correct /
                                analytics.byPair[currentPair.id].total) *
                                100
                            )}
                            %
                          </strong>
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed max-w-4xl">
                    {currentPair.comparisonLesson}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleNextRound}
                  className="shrink-0 px-5 py-2.5 bg-white hover:bg-zinc-200 text-black font-mono text-xs font-semibold uppercase tracking-widest transition cursor-pointer"
                >
                  Next Pair [Space] →
                </button>
              </div>
            )}

            {/* Side-by-Side Two Choices */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
              <SatellitePane
                key={`${currentPair.id}-A-${facilityA.id}`}
                facility={facilityA}
                label="A"
                showLabels={showMapLabels}
                isRevealed={isRevealed}
                isSelected={selectedSide === 'A'}
                onSelect={() => handleSelectSide('A')}
              />
              <SatellitePane
                key={`${currentPair.id}-B-${facilityB.id}`}
                facility={facilityB}
                label="B"
                showLabels={showMapLabels}
                isRevealed={isRevealed}
                isSelected={selectedSide === 'B'}
                onSelect={() => handleSelectSide('B')}
              />
            </div>
          </div>
        )}
      </main>

      {/* Field Guide Modal */}
      <FieldGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Accuracy & Plausible Telemetry Modal */}
      <AccuracyModal
        isOpen={isAccuracyOpen}
        onClose={() => setIsAccuracyOpen(false)}
        analytics={analytics}
        onReset={() => {
          setAnalytics(resetAnalyticsStore());
        }}
      />
    </div>
  );
}

export default App;
