import {
  SIZE_ENERGY_TAXONOMY,
  FACILITY_LOCATIONS,
  type DataCenterSubtype,
  type FacilityLocation,
} from '../data/facilities';

interface TaxonomyViewProps {
  onSelectTierForAtlas: (subtype: DataCenterSubtype) => void;
  onPlayFacility: (facility: FacilityLocation) => void;
}

export function TaxonomyView({
  onSelectTierForAtlas,
  onPlayFacility,
}: TaxonomyViewProps) {
  return (
    <div className="border-x border-b border-zinc-800 bg-[#09090b] divide-y divide-zinc-800">
      {/* Header */}
      <div className="p-6 space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          TAXONOMY // SIZE, ELECTRICAL LOAD & MUNICIPAL ZONING CLASSIFICATION
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          Data Center Size &amp; Energy Taxonomy (0.5 MW to 1+ GW)
        </h2>
        <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
          A reference matrix correlating physical building footprint, electrical power capacity (MW), utility transmission voltage (kV), annual energy draw (GWh), backup diesel generation, and orbital satellite signatures across all five infrastructure tiers.
        </p>
      </div>

      {/* Quick Comparison Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950 text-[10px] uppercase tracking-widest text-zinc-500">
              <th className="p-4 border-r border-zinc-800">Tier / Classification</th>
              <th className="p-4 border-r border-zinc-800">Power Load (MW)</th>
              <th className="p-4 border-r border-zinc-800">Annual Energy &amp; Residential Equiv.</th>
              <th className="p-4 border-r border-zinc-800">Grid Voltage Feed</th>
              <th className="p-4 border-r border-zinc-800">Building Footprint</th>
              <th className="p-4">Backup Generation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {SIZE_ENERGY_TAXONOMY.map((tier) => (
              <tr
                key={tier.tierCode}
                className="hover:bg-zinc-950/80 transition"
              >
                <td className="p-4 border-r border-zinc-800 align-top">
                  <div className="text-[10px] text-emerald-400 font-semibold">
                    {tier.tierCode}
                  </div>
                  <div className="font-sans text-sm font-semibold text-white mt-0.5">
                    {tier.subtype}
                  </div>
                </td>
                <td className="p-4 border-r border-zinc-800 align-top font-semibold text-white whitespace-nowrap">
                  ⚡ {tier.powerRangeMW}
                </td>
                <td className="p-4 border-r border-zinc-800 align-top">
                  <div className="text-zinc-200">{tier.annualEnergyGWh}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    {tier.equivHomesPowered}
                  </div>
                </td>
                <td className="p-4 border-r border-zinc-800 align-top text-zinc-300">
                  {tier.gridFeedVoltage}
                </td>
                <td className="p-4 border-r border-zinc-800 align-top">
                  <div className="text-zinc-200">{tier.buildingSqFt}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Parcel: {tier.parcelAcres}
                  </div>
                </td>
                <td className="p-4 align-top text-zinc-300">
                  {tier.backupGenerators}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Methodology, Conversion Formulas & Data Sources */}
      <div className="p-6 bg-zinc-950/40 space-y-5">
        <div className="space-y-1">
          <div className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">
            METHODOLOGY &amp; SOURCES // HOW ENERGY &amp; CAPACITY NUMBERS ARE DERIVED
          </div>
          <h3 className="text-base font-semibold text-white">
            Engineering Conversion Formulas &amp; Public Verification Sources
          </h3>
        </div>

        {/* 4-Column Formula Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-zinc-800 divide-y md:divide-y-0 md:divide-x divide-zinc-800 bg-[#09090b] font-mono text-xs">
          <div className="p-4 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">
              FORMULA 01 // MW → ANNUAL GWh
            </div>
            <div className="text-white font-semibold">
              1 MW ≈ 7.45 – 8.76 GWh / yr
            </div>
            <p className="font-sans text-xs text-zinc-400 leading-relaxed">
              Derived via <code className="text-zinc-200">MW × 8,760 hrs/yr × 0.85 load factor ÷ 1,000</code> (per U.S. DOE / Lawrence Berkeley National Lab 2024 United States Data Center Energy Usage Report).
            </p>
          </div>

          <div className="p-4 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">
              FORMULA 02 // MW → HOMES POWERED
            </div>
            <div className="text-white font-semibold">
              1 MW ≈ 710 – 830 U.S. Homes
            </div>
            <p className="font-sans text-xs text-zinc-400 leading-relaxed">
              Per U.S. Energy Information Administration (EIA), average residential consumption is <code className="text-zinc-200">10,500 kWh/yr (0.0105 GWh/yr)</code> or ~1.2 kW continuous draw per household.
            </p>
          </div>

          <div className="p-4 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">
              FORMULA 03 // SATELLITE GENERATOR RULE
            </div>
            <div className="text-white font-semibold">
              # Enclosures × 2.5 MW (less N+1)
            </div>
            <p className="font-sans text-xs text-zinc-400 leading-relaxed">
              Standard Tier III/IV standby diesel generators (Caterpillar 3516E / Cummins QSK60/QSK95) are rated at <code className="text-zinc-200">2.0 – 3.0 MW</code> each. Counting perimeter generator pads from satellite directly bounds facility MW.
            </p>
          </div>

          <div className="p-4 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">
              FORMULA 04 // GRID FEED VOLTAGE (kV)
            </div>
            <div className="text-white font-semibold">
              13.8 kV Dist. vs. 115–345 kV Sub.
            </div>
            <p className="font-sans text-xs text-zinc-400 leading-relaxed">
              Standard street distribution circuits (<code className="text-zinc-200">13.8 kV</code> in Eversource/UI territory) max out around 3–10 MW. Loads above 15 MW require a <code className="text-zinc-200">69 kV / 115 kV+</code> high-voltage transmission substation.
            </p>
          </div>
        </div>

        {/* Source Provenance Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 border border-zinc-800 divide-y md:divide-y-0 md:divide-x divide-zinc-800 bg-[#09090b] text-xs">
          <div className="p-4 space-y-1.5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">
              A. PUBLISHED SPEC SHEETS (COLO &amp; HYPERSCALE)
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Colocation &amp; hyperscale MW figures come from operator leasing brochures, SEC filings, and interconnection registries (<em>Equinix, Digital Realty, CyrusOne NYM5/NYM10, Switch Citadel/Core, Vantage, QTS, TVA/xAI filings, USACE/NSA fact sheets</em>).
            </p>
          </div>

          <div className="p-4 space-y-1.5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-300">
              B. UTILITY &amp; AIR PERMIT FILINGS (ENTERPRISE / CT)
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Enterprise facilities (<em>Ensono/Travelers Windsor, Disney/ESPN Bristol DC-1 &amp; DC-2, JPMorgan</em>) are derived from municipal building footprints (<code className="font-mono text-zinc-300">100–150 W/sq ft</code> gross density), on-site substation bays, and state DEEP emergency generator air permits.
            </p>
          </div>

          <div className="p-4 space-y-1.5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-300">
              C. ENGINEERING ESTIMATES (SMALL SERVER ROOMS)
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Suspected Small-Scale Server Rooms (<code className="font-mono text-zinc-300">0.8 – 3 MW</code>) represent engineering estimates for <code className="font-mono text-zinc-300">10,000 – 20,000 sq ft</code> accessory IT suites based on visible rooftop CRAC condenser tonnage and 1–2 external standby generator pads.
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Tier Cards with Real Examples */}
      <div className="divide-y divide-zinc-800">
        {SIZE_ENERGY_TAXONOMY.map((tier) => {
          const examples = FACILITY_LOCATIONS.filter(
            (f) =>
              f.isDataCenter &&
              (f.subtype === tier.subtype ||
                (tier.subtype === 'Hyperscale' &&
                  f.subtype === 'AI Supercluster'))
          );
          const ctExamples = examples.filter((e) =>
            e.stateOrCountry.includes('CT')
          );

          return (
            <div key={tier.tierCode} className="p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="px-2 py-0.5 bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 font-semibold">
                      {tier.tierCode}
                    </span>
                    <span className="px-2 py-0.5 border border-zinc-700 text-white font-semibold">
                      ⚡ {tier.powerRangeMW}
                    </span>
                    <span className="text-zinc-500">
                      {tier.annualEnergyGWh} ({tier.equivHomesPowered})
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mt-2">
                    {tier.label}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectTierForAtlas(tier.subtype)}
                  className="self-start md:self-auto px-3.5 py-2 border border-zinc-700 hover:border-white font-mono text-xs uppercase text-zinc-200 hover:text-white transition cursor-pointer"
                >
                  Filter Atlas by {tier.subtype} ({examples.length}) →
                </button>
              </div>

              {/* 4-Column Spec Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-zinc-800 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800 font-mono text-xs bg-zinc-950/40">
                <div className="p-3.5 space-y-1">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                    01 // ELECTRICAL &amp; GRID FEED
                  </div>
                  <div className="text-zinc-200 font-sans text-xs leading-relaxed">
                    {tier.gridFeedVoltage}
                  </div>
                  <div className="text-[11px] text-zinc-400 pt-1">
                    Racks: {tier.rackCount}
                  </div>
                </div>

                <div className="p-3.5 space-y-1">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                    02 // COOLING &amp; GENERATORS
                  </div>
                  <div className="text-zinc-200 font-sans text-xs leading-relaxed">
                    {tier.coolingArchitecture}
                  </div>
                  <div className="text-[11px] text-zinc-400 pt-1">
                    Backup: {tier.backupGenerators}
                  </div>
                </div>

                <div className="p-3.5 space-y-1">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                    03 // SATELLITE SIGNATURE
                  </div>
                  <div className="text-zinc-200 font-sans text-xs leading-relaxed">
                    {tier.satelliteFootprintSignature}
                  </div>
                </div>

                <div className="p-3.5 space-y-1">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                    04 // ZONING &amp; LAND USE
                  </div>
                  <div className="text-zinc-200 font-sans text-xs leading-relaxed">
                    {tier.zoningClassification}
                  </div>
                </div>
              </div>

              {/* Verified Examples in Dataset */}
              <div className="space-y-2">
                <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  VERIFIED SPECIMENS IN DATASET ({examples.length} TOTAL
                  {ctExamples.length > 0 ? ` • ${ctExamples.length} IN CONNECTICUT` : ''}):
                </div>
                <div className="flex flex-wrap gap-2">
                  {examples.map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => onPlayFacility(ex)}
                      className="px-3 py-1.5 border border-zinc-800 hover:border-zinc-500 bg-zinc-950 text-left font-mono text-[11px] transition cursor-pointer flex items-center gap-2 group"
                    >
                      <span
                        className={`w-1.5 h-1.5 ${
                          ex.stateOrCountry.includes('CT')
                            ? 'bg-emerald-400'
                            : 'bg-zinc-500'
                        }`}
                      />
                      <span className="text-zinc-200 group-hover:text-white">
                        {ex.name}
                      </span>
                      <span className="text-zinc-500">
                        [{ex.city}, {ex.stateOrCountry} • {ex.powerCapacityMW}]
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
