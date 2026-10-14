import { VISUAL_TELL_GUIDE } from '../data/facilities';

export function FieldGuideModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#09090b] border border-zinc-800 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto divide-y divide-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              MANUAL // ORBITAL INFRASTRUCTURE IDENTIFICATION
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Diagnostic Signatures: Compute vs. Industrial Decoys
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-zinc-800 hover:border-zinc-600 font-mono text-xs uppercase text-zinc-300 hover:text-white transition cursor-pointer"
          >
            [ESC / CLOSE]
          </button>
        </div>

        {/* Rows */}
        <div className="divide-y divide-zinc-800">
          {VISUAL_TELL_GUIDE.map((item, idx) => (
            <div key={idx} className="p-5 space-y-3">
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-100">
                0{idx + 1} // {item.title.replace(/^\d+\.\s*/, '')}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 border border-zinc-800 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800 text-xs">
                <div className="p-3.5 bg-zinc-950/50 space-y-1">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                    COMPUTE SIGNATURE (DATA CENTER)
                  </div>
                  <p className="text-zinc-300 leading-relaxed">
                    {item.dataCenterSign}
                  </p>
                </div>
                <div className="p-3.5 bg-zinc-950/50 space-y-1">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                    DECOY SIGNATURE (WAREHOUSE / OFFICE)
                  </div>
                  <p className="text-zinc-400 leading-relaxed">
                    {item.decoySign}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="p-5 bg-zinc-950 font-mono text-[11px] text-zinc-400 leading-relaxed">
          <span className="text-zinc-100 font-semibold uppercase mr-2">
            ZONING NOTE:
          </span>
          Small-scale accessory server rooms (&lt; 3 MW) inside commercial office buildings do not require utility substations; inspect the rear parking lot or roof for retrofitted diesel generator enclosures and localized CRAC dry-cooler clusters.
        </div>
      </div>
    </div>
  );
}
