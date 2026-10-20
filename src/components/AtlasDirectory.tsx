import { useState, useMemo } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';
import {
  FACILITY_LOCATIONS,
  type DataCenterSubtype,
  type FacilityLocation,
  type DifficultyLevel,
} from '../data/facilities';

interface AtlasDirectoryProps {
  connecticutOnly: boolean;
  onToggleConnecticutOnly: () => void;
  excludeHyperscalers: boolean;
  onToggleExcludeHyperscalers: () => void;
  zoningSubtypeFilter: DataCenterSubtype | 'all';
  onChangeZoningSubtypeFilter: (val: DataCenterSubtype | 'all') => void;
  initialSearchQuery?: string;
  initialTypeFilter?: 'all' | 'datacenter' | 'decoy';
  initialSubtypeFilter?: string;
  initialDifficultyFilter?: DifficultyLevel | 'all';
  onChangeSearchQuery?: (q: string) => void;
  onChangeTypeFilter?: (t: 'all' | 'datacenter' | 'decoy') => void;
  onChangeSubtypeFilter?: (st: string) => void;
  onChangeDifficultyFilter?: (d: DifficultyLevel | 'all') => void;
  onPlayFacility: (facility: FacilityLocation) => void;
  onInspectPowerGrid?: (facility: FacilityLocation) => void;
}

export function AtlasDirectory({
  connecticutOnly,
  onToggleConnecticutOnly,
  excludeHyperscalers,
  onToggleExcludeHyperscalers,
  zoningSubtypeFilter,
  onChangeZoningSubtypeFilter,
  initialSearchQuery = '',
  initialTypeFilter = 'all',
  initialSubtypeFilter = 'all',
  initialDifficultyFilter = 'all',
  onChangeSearchQuery,
  onChangeTypeFilter,
  onChangeSubtypeFilter,
  onChangeDifficultyFilter,
  onPlayFacility,
  onInspectPowerGrid,
}: AtlasDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [typeFilter, setTypeFilter] = useState<'all' | 'datacenter' | 'decoy'>(
    initialTypeFilter
  );
  const [subtypeFilter, setSubtypeFilter] = useState<string>(initialSubtypeFilter);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyLevel | 'all'>(
    initialDifficultyFilter
  );

  const allSubtypes = useMemo(() => {
    const set = new Set<string>();
    FACILITY_LOCATIONS.forEach((f) => set.add(f.subtype));
    return Array.from(set);
  }, []);

  const filteredLocations = useMemo(() => {
    return FACILITY_LOCATIONS.filter((loc) => {
      if (
        connecticutOnly &&
        !(
          loc.stateOrCountry.includes('CT') ||
          loc.stateOrCountry.includes('MA') ||
          loc.stateOrCountry.includes('NY')
        )
      ) {
        return false;
      }
      if (
        excludeHyperscalers &&
        loc.isDataCenter &&
        (loc.subtype === 'Hyperscale' || loc.subtype === 'AI Supercluster')
      ) {
        return false;
      }
      if (zoningSubtypeFilter !== 'all') {
        if (!loc.isDataCenter || loc.subtype !== zoningSubtypeFilter) return false;
      }
      if (typeFilter === 'datacenter' && !loc.isDataCenter) return false;
      if (typeFilter === 'decoy' && loc.isDataCenter) return false;
      if (subtypeFilter !== 'all' && loc.subtype !== subtypeFilter) return false;
      if (difficultyFilter !== 'all' && loc.difficulty !== difficultyFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = loc.name.toLowerCase().includes(q);
        const matchOp = loc.operator.toLowerCase().includes(q);
        const matchCity = `${loc.city} ${loc.stateOrCountry}`.toLowerCase().includes(q);
        const matchSubtype = loc.subtype.toLowerCase().includes(q);
        return matchName || matchOp || matchCity || matchSubtype;
      }
      return true;
    });
  }, [
    connecticutOnly,
    excludeHyperscalers,
    zoningSubtypeFilter,
    searchQuery,
    typeFilter,
    subtypeFilter,
    difficultyFilter,
  ]);

  const dcCount = filteredLocations.filter((l) => l.isDataCenter).length;
  const decoyCount = filteredLocations.filter((l) => !l.isDataCenter).length;

  return (
    <div className="border-x border-b border-zinc-800 bg-[#09090b]">
      {/* Swiss Index Header */}
      <div className="p-6 border-b border-zinc-800 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            INDEX // VERIFIED SATELLITE INFRASTRUCTURE REGISTRY
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Facility Classification & Zoning Atlas
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Indexed across five municipal zoning tiers: Hyperscale Cloud, Colocation (COLO), Enterprise Data Centers, Regional Edge Hubs, and Suspected Small-Scale Server Rooms (&lt; 3 MW accessory IT suites).
          </p>
        </div>

        <div className="grid grid-cols-3 border border-zinc-800 divide-x divide-zinc-800 font-mono shrink-0">
          <div className="px-4 py-2.5">
            <div className="text-base font-semibold text-white">
              {filteredLocations.length}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">
              TOTAL
            </div>
          </div>
          <div className="px-4 py-2.5">
            <div className="text-base font-semibold text-emerald-400">{dcCount}</div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">
              COMPUTE
            </div>
          </div>
          <div className="px-4 py-2.5">
            <div className="text-base font-semibold text-zinc-400">{decoyCount}</div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">
              DECOY
            </div>
          </div>
        </div>
      </div>

      {/* Zoning Preset Bar */}
      <div className="px-6 py-3 border-b border-zinc-800 flex flex-wrap items-center gap-2 bg-zinc-950/50">
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mr-2">
          ZONING FILTERS:
        </span>
        <button
          type="button"
          onClick={onToggleConnecticutOnly}
          className={`px-3 py-1 font-mono text-[11px] uppercase tracking-wider border transition cursor-pointer ${
            connecticutOnly
              ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold'
              : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200'
          }`}
        >
          CT · MA · HUDSON VALLEY {connecticutOnly ? '[×]' : ''}
        </button>

        <button
          type="button"
          onClick={onToggleExcludeHyperscalers}
          className={`px-3 py-1 font-mono text-[11px] uppercase tracking-wider border transition cursor-pointer ${
            excludeHyperscalers
              ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold'
              : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200'
          }`}
        >
          NO HYPERSCALERS {excludeHyperscalers ? '[×]' : ''}
        </button>

        <button
          type="button"
          onClick={() =>
            onChangeZoningSubtypeFilter(
              zoningSubtypeFilter === 'Suspected Small-Scale Server Room'
                ? 'all'
                : 'Suspected Small-Scale Server Room'
            )
          }
          className={`px-3 py-1 font-mono text-[11px] uppercase tracking-wider border transition cursor-pointer ${
            zoningSubtypeFilter === 'Suspected Small-Scale Server Room'
              ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold'
              : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200'
          }`}
        >
          SUSPECTED SMALL-SCALE SERVER ROOMS (&lt; 3 MW){' '}
          {zoningSubtypeFilter === 'Suspected Small-Scale Server Room' ? '[×]' : ''}
        </button>
      </div>

      {/* Search & Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-zinc-800 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onChangeSearchQuery?.(e.target.value);
            }}
            placeholder="SEARCH CITY, OPERATOR, ADDRESS..."
            className="w-full pl-10 pr-4 py-3 bg-transparent font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          />
        </div>

        <div className="flex divide-x divide-zinc-800 font-mono text-[11px] uppercase">
          <button
            type="button"
            onClick={() => {
              setTypeFilter('all');
              onChangeTypeFilter?.('all');
            }}
            className={`flex-1 py-3 transition cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-zinc-900 text-white font-semibold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            ALL ({filteredLocations.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setTypeFilter('datacenter');
              onChangeTypeFilter?.('datacenter');
            }}
            className={`flex-1 py-3 transition cursor-pointer ${
              typeFilter === 'datacenter'
                ? 'bg-zinc-900 text-emerald-400 font-semibold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            COMPUTE ({dcCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setTypeFilter('decoy');
              onChangeTypeFilter?.('decoy');
            }}
            className={`flex-1 py-3 transition cursor-pointer ${
              typeFilter === 'decoy'
                ? 'bg-zinc-900 text-zinc-200 font-semibold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            DECOYS ({decoyCount})
          </button>
        </div>

        <div>
          <select
            value={subtypeFilter}
            onChange={(e) => {
              setSubtypeFilter(e.target.value);
              onChangeSubtypeFilter?.(e.target.value);
            }}
            className="w-full h-full px-4 py-3 bg-[#09090b] font-mono text-xs text-zinc-300 focus:outline-none cursor-pointer"
          >
            <option value="all">CATEGORY: ALL SUBTYPES</option>
            {allSubtypes.map((st) => (
              <option key={st} value={st}>
                {st.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={difficultyFilter}
            onChange={(e) => {
              const val = e.target.value as DifficultyLevel | 'all';
              setDifficultyFilter(val);
              onChangeDifficultyFilter?.(val);
            }}
            className="w-full h-full px-4 py-3 bg-[#09090b] font-mono text-xs text-zinc-300 focus:outline-none cursor-pointer"
          >
            <option value="all">DIFFICULTY: ALL TIERS</option>
            <option value="easy">TIER 1 // EASY</option>
            <option value="medium">TIER 2 // MEDIUM</option>
            <option value="hard">TIER 3 // HARD (STEALTH / COLD STORAGE)</option>
          </select>
        </div>
      </div>

      {/* Swiss Hairline Spec Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y divide-zinc-800 md:divide-x">
        {filteredLocations.map((loc, index) => (
          <div
            key={loc.id}
            className="p-6 flex flex-col justify-between bg-[#09090b] hover:bg-zinc-950/80 transition group border-b border-zinc-800"
          >
            <div className="space-y-4">
              {/* Top Meta Line */}
              <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-widest">
                <span
                  className={`inline-flex items-center gap-1.5 ${
                    loc.isDataCenter ? 'text-emerald-400' : 'text-zinc-400'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 ${
                      loc.isDataCenter ? 'bg-emerald-400' : 'bg-zinc-600'
                    }`}
                  />
                  {loc.subtype}
                </span>
                <span className="text-zinc-600">
                  #{String(index + 1).padStart(2, '0')} // {loc.difficulty}
                </span>
              </div>

              {/* Title & Operator */}
              <div>
                <h3 className="text-base font-semibold tracking-tight text-white leading-snug">
                  {loc.name}
                </h3>
                <div className="font-mono text-[11px] text-zinc-500 mt-1">
                  {loc.city.toUpperCase()}, {loc.stateOrCountry.toUpperCase()} —{' '}
                  <span className="text-zinc-300">{loc.operator}</span>
                </div>
              </div>

              {/* Tabular Telemetry */}
              <div className="grid grid-cols-3 border border-zinc-800/90 divide-x divide-zinc-800/90 font-mono text-[10px] bg-zinc-950/50">
                <div className="p-2">
                  <div className="text-zinc-500">POWER</div>
                  <div className="text-zinc-200 truncate mt-0.5">
                    {loc.powerCapacityMW || 'N/A'}
                  </div>
                </div>
                <div className="p-2">
                  <div className="text-zinc-500">FOOTPRINT</div>
                  <div className="text-zinc-200 truncate mt-0.5">
                    {loc.sqft || 'N/A'}
                  </div>
                </div>
                <div className="p-2">
                  <div className="text-zinc-500">COORDS</div>
                  <div className="text-zinc-300 truncate mt-0.5">
                    {loc.lat.toFixed(3)}, {loc.lng.toFixed(3)}
                  </div>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                {loc.summary}
              </p>

              {/* Tells */}
              <div className="space-y-1 pt-1 border-t border-zinc-900">
                {loc.visualTells.slice(0, 2).map((tell, i) => (
                  <div
                    key={i}
                    className="text-[11px] text-zinc-300 flex items-start gap-2"
                  >
                    <span className="font-mono text-[10px] text-zinc-600 mt-0.5">
                      0{i + 1}
                    </span>
                    <span>{tell}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 font-mono text-[11px]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onPlayFacility(loc)}
                  className="text-zinc-100 hover:text-emerald-400 font-medium uppercase tracking-wider transition cursor-pointer"
                >
                  [INSPECT IN ARENA →]
                </button>

                {loc.isDataCenter && onInspectPowerGrid && (
                  <button
                    type="button"
                    onClick={() => onInspectPowerGrid(loc)}
                    className="text-amber-400 hover:text-amber-300 font-medium uppercase tracking-wider transition cursor-pointer"
                  >
                    [⚡ GRID TIE-IN]
                  </button>
                )}
              </div>

              <a
                href={`https://www.google.com/maps/@${loc.lat},${loc.lng},18z/data=!3m1!1e3`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-200 transition"
              >
                <span>SAT VIEW</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
