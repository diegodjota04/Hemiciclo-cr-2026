import { useMemo } from 'react'
import { getPartyColor, PARTY_COLORS } from '../constants/parties'
import diputadosData from '../data/diputados.json'

/** Compute proportional initial allocation for N total seats */
export function computeDefaultAllocation(total) {
  const partyTotals = {}
  diputadosData.forEach(d => {
    partyTotals[d.partido] = (partyTotals[d.partido] || 0) + 1
  })

  const parties = Object.keys(partyTotals)
  const result  = {}
  let assigned  = 0

  parties.forEach(p => {
    result[p] = Math.floor((partyTotals[p] / 57) * total)
    assigned += result[p]
  })

  // Distribute remainder to largest parties first
  const remainder = total - assigned
  parties
    .sort((a, b) => partyTotals[b] - partyTotals[a])
    .slice(0, remainder)
    .forEach(p => { result[p]++ })

  return result
}

export default function PartyAllocationPanel({ allocation, onChange, total }) {
  const partyTotals = useMemo(() => {
    const map = {}
    diputadosData.forEach(d => {
      map[d.partido] = (map[d.partido] || 0) + 1
    })
    return map
  }, [])

  const currentTotal = Object.values(allocation).reduce((s, v) => s + v, 0)
  const deficit      = total - currentTotal  // positive = need more, negative = too many

  const adjust = (partido, delta) => {
    const max = partyTotals[partido] || 0
    const current = allocation[partido] || 0
    const next = Math.max(0, Math.min(max, current + delta))
    onChange({ ...allocation, [partido]: next })
  }

  const reset = () => onChange(computeDefaultAllocation(total))

  const parties = Object.keys(partyTotals).sort((a, b) => partyTotals[b] - partyTotals[a])

  return (
    <div className="glass rounded-xl px-4 py-3 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Distribución por partido
          </p>
          <p className="text-[10px] text-slate-500">
            Ajusta cuántas diputaciones de cada partido incluir en el hemiciclo
          </p>
        </div>
        <div className="flex items-center gap-2">
          {deficit !== 0 && (
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${deficit > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
              {deficit > 0 ? `+${deficit} pendientes` : `${Math.abs(deficit)} de más`}
            </span>
          )}
          {deficit === 0 && (
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
              ✓ {total} escaños
            </span>
          )}
          <button
            onClick={reset}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            Restablecer
          </button>
        </div>
      </div>

      {/* Party rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {parties.map(partido => {
          const c       = getPartyColor(partido)
          const max     = partyTotals[partido]
          const current = allocation[partido] || 0
          const pct     = max > 0 ? (current / max) * 100 : 0

          return (
            <div
              key={partido}
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ background: c.bg, border: `1px solid ${c.border}44` }}
            >
              {/* Color dot */}
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.badge }} />

              {/* Party info */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-white truncate">{c.label}</p>
                <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: c.badge }}
                  />
                </div>
              </div>

              {/* Stepper */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => adjust(partido, -1)}
                  disabled={current === 0}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  style={{ color: c.badge }}
                >−</button>
                <span className="w-7 text-center text-sm font-bold text-white">{current}</span>
                <button
                  onClick={() => adjust(partido, 1)}
                  disabled={current >= max}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  style={{ color: c.badge }}
                >+</button>
                <span className="text-[9px] text-slate-500 ml-0.5">/{max}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
