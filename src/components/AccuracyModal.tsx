import {
  BASELINE_BENCHMARK_ACCURACY,
  type AnalyticsStore,
} from '../utils/analytics';

interface AccuracyModalProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: AnalyticsStore;
  onReset: () => void;
}

export function AccuracyModal({
  isOpen,
  onClose,
  analytics,
  onReset,
}: AccuracyModalProps) {
  if (!isOpen) return null;

  const overallPct =
    analytics.totalGuesses > 0
      ? Math.round((analytics.totalCorrect / analytics.totalGuesses) * 100)
      : 0;

  const pairRows = Object.values(analytics.byPair).sort(
    (a, b) => b.total - a.total
  );

  const allSubtypes = Object.keys(BASELINE_BENCHMARK_ACCURACY);

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#09090b] border border-zinc-800 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto divide-y divide-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">
              TELEMETRY // PLAUSIBLE ANALYTICS &amp; ACCURACY BREAKDOWN
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Identification Accuracy by Zoning Tier &amp; Matchup
            </h2>
            <p className="text-xs text-zinc-400">
              Every guess fires a live <code className="font-mono text-zinc-200">plausible(&apos;Guess&apos;, &#123; props &#125;)</code> custom event to <code className="font-mono text-zinc-200">artifacts.thefocus.ai</code> and updates your local telemetry table below.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {analytics.totalGuesses > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="px-3 py-1.5 border border-zinc-800 hover:border-rose-500/60 font-mono text-xs uppercase text-zinc-400 hover:text-rose-300 transition cursor-pointer"
              >
                [RESET LOCAL]
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-zinc-800 hover:border-zinc-600 font-mono text-xs uppercase text-zinc-300 hover:text-white transition cursor-pointer"
            >
              [ESC / CLOSE]
            </button>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-3 divide-x divide-zinc-800 font-mono bg-zinc-950/50">
          <div className="p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">
              YOUR OVERALL ACCURACY
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {analytics.totalGuesses > 0 ? `${overallPct}%` : '—'}
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">
              {analytics.totalCorrect} correct of {analytics.totalGuesses} guesses
            </div>
          </div>

          <div className="p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">
              BENCHMARK (NON-HYPERSCALER)
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              62%
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">
              Avg. across COLO, Enterprise &amp; Small Server Rooms
            </div>
          </div>

          <div className="p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">
              PLAUSIBLE EVENT STREAM
            </div>
            <div className="text-sm font-semibold text-white mt-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 inline-block animate-pulse" />
              ACTIVE (`Guess`)
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Domain: artifacts.thefocus.ai
            </div>
          </div>
        </div>

        {/* Accuracy by Zoning Tier Table */}
        <div className="p-6 space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            01 // RIGHT-ANSWER RATE BY DATA CENTER ZONING TIER
          </div>
          <div className="border border-zinc-800 overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950 text-[10px] uppercase tracking-widest text-zinc-500">
                  <th className="p-3 border-r border-zinc-800">Zoning Tier / Subtype</th>
                  <th className="p-3 border-r border-zinc-800">Your Right %</th>
                  <th className="p-3 border-r border-zinc-800">Your Count</th>
                  <th className="p-3">Expected Benchmark %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {allSubtypes.map((st) => {
                  const rec = analytics.bySubtype[st];
                  const pct =
                    rec && rec.total > 0
                      ? Math.round((rec.correct / rec.total) * 100)
                      : null;
                  const bench = BASELINE_BENCHMARK_ACCURACY[st] ?? 65;

                  return (
                    <tr key={st} className="hover:bg-zinc-950/60">
                      <td className="p-3 border-r border-zinc-800 font-sans font-medium text-white">
                        {st}
                      </td>
                      <td className="p-3 border-r border-zinc-800">
                        {pct !== null ? (
                          <span
                            className={
                              pct >= 65 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'
                            }
                          >
                            {pct}%
                          </span>
                        ) : (
                          <span className="text-zinc-600">No guesses yet</span>
                        )}
                      </td>
                      <td className="p-3 border-r border-zinc-800 text-zinc-400">
                        {rec ? `${rec.correct} / ${rec.total}` : '0 / 0'}
                      </td>
                      <td className="p-3 text-zinc-300">
                        <div className="flex items-center gap-3">
                          <div className="w-28 h-2 bg-zinc-900 border border-zinc-800 overflow-hidden">
                            <div
                              className="h-full bg-zinc-400"
                              style={{ width: `${bench}%` }}
                            />
                          </div>
                          <span>{bench}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Per-Pair Breakdown */}
        {pairRows.length > 0 && (
          <div className="p-6 space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              02 // ACCURACY BY INDIVIDUAL SATELLITE PAIR
            </div>
            <div className="border border-zinc-800 overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950 text-[10px] uppercase tracking-widest text-zinc-500">
                    <th className="p-3 border-r border-zinc-800">Data Center vs. Decoy</th>
                    <th className="p-3 border-r border-zinc-800">Tier</th>
                    <th className="p-3 border-r border-zinc-800">Right %</th>
                    <th className="p-3">Guesses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {pairRows.map((row) => {
                    const pct = Math.round((row.correct / row.total) * 100);
                    return (
                      <tr key={row.pairId} className="hover:bg-zinc-950/60">
                        <td className="p-3 border-r border-zinc-800 font-sans">
                          <div className="text-white font-medium">
                            {row.dataCenterName}
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            vs. {row.decoyName}
                          </div>
                        </td>
                        <td className="p-3 border-r border-zinc-800 text-zinc-400">
                          {row.dataCenterSubtype}
                        </td>
                        <td className="p-3 border-r border-zinc-800 font-bold">
                          <span
                            className={
                              pct >= 60 ? 'text-emerald-400' : 'text-rose-400'
                            }
                          >
                            {pct}%
                          </span>
                        </td>
                        <td className="p-3 text-zinc-400">
                          {row.correct} / {row.total}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Plausible Dashboard Setup Recipe */}
        <div className="p-6 bg-zinc-950 font-mono text-xs text-zinc-400 space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-zinc-200 font-semibold">
            HOW TO VIEW AGGREGATE CROWD % IN PLAUSIBLE DASHBOARD:
          </div>
          <p className="font-sans text-xs leading-relaxed">
            In Plausible (<code className="text-zinc-200">artifacts.thefocus.ai</code>) → <strong>Custom Events</strong> → add goal <code className="text-emerald-400">Guess</code>. Click into custom properties to view crowd breakdown by:
            <code className="text-zinc-200 ml-1">result</code> (<code className="text-emerald-400">Correct</code> vs. <code className="text-rose-400">Incorrect</code> % across all visitors),
            <code className="text-zinc-200 ml-1">dc_subtype</code>,
            <code className="text-zinc-200 ml-1">pair_id</code>,
            <code className="text-zinc-200 ml-1">dc_name</code>, and
            <code className="text-zinc-200 ml-1">region</code> (<code className="text-zinc-200">Connecticut</code> vs. <code className="text-zinc-200">US / Global</code>).
          </p>
        </div>
      </div>
    </div>
  );
}
