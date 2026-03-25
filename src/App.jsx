import { useState, useMemo, useEffect } from 'react'
import diputadosData from './data/diputados.json'
import { useNetworkStorage } from './hooks/useNetworkStorage'
import FiltersBar from './components/FiltersBar'
import SliderControl from './components/SliderControl'
import HemicicloView from './components/HemicicloView'
import PartyAllocationPanel, { computeDefaultAllocation } from './components/PartyAllocationPanel'
import { PARTY_COLORS, getPartyColor } from './constants/parties'

/** Build the visible deputy list from a party allocation map */
function buildVisibleDiputados(allocation) {
  const byParty = {}
  diputadosData.forEach(d => {
    if (!byParty[d.partido]) byParty[d.partido] = []
    byParty[d.partido].push(d)
  })
  const result = []
  // Maintain stable order by interleaving parties (bigger parties distributed evenly)
  Object.entries(allocation).forEach(([partido, count]) => {
    if (byParty[partido]) result.push(...byParty[partido].slice(0, count))
  })
  // No automatic sort – initial order comes from data; user rearranges via drag
  return result
}

export default function App() {
  const [sliderCount, setSliderCount] = useNetworkStorage('hemiciclo_slider', 57)
  const [allocation, setAllocation] = useNetworkStorage('hemiciclo_allocation', () => computeDefaultAllocation(57))
  const [assignments, setAssignments] = useNetworkStorage('hemiciclo_assignments', {})
  const [filters, setFilters] = useState({ provincia: '', genero: '', partido: '' })
  const [showAllocation, setShowAllocation] = useState(true)

  // When slider changes, recompute default allocation
  const handleSliderChange = (n) => {
    setSliderCount(n)
    setAllocation(computeDefaultAllocation(n))
  }

  // Deputies shown in hemiciclo based on allocation
  const visibleDiputados = useMemo(() => buildVisibleDiputados(allocation), [allocation])

  // Dim/filter IDs
  const filteredIds = useMemo(() => {
    const hasFilter = filters.provincia || filters.genero || filters.partido
    if (!hasFilter) return new Set()
    return new Set(
      visibleDiputados
        .filter(d => {
          if (filters.provincia && d.provincia !== filters.provincia) return false
          if (filters.genero && d.genero !== filters.genero) return false
          if (filters.partido && d.partido !== filters.partido) return false
          return true
        })
        .map(d => d.id)
    )
  }, [visibleDiputados, filters])

  const handleAssign = (id, data) => setAssignments(prev => ({ ...prev, [id]: data }))

  const counts = {
    total: visibleDiputados.length,
    visible: (filters.provincia || filters.genero || filters.partido) ? filteredIds.size : visibleDiputados.length,
  }

  const partySummary = useMemo(() => {
    const map = {}
    visibleDiputados.forEach(d => { map[d.partido] = (map[d.partido] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [visibleDiputados])

  const allocationTotal = Object.values(allocation).reduce((s, v) => s + v, 0)
  const allocationOk = allocationTotal === sliderCount

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0d1f3c 50%, #0f172a 100%)' }}>

      {/* ── Header ── */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-sm px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏛️</span>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">Hemiciclo · Costa Rica</h1>
              <p className="text-xs text-slate-400">Asamblea Legislativa 2026–2030</p>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap gap-1.5">
            {partySummary.map(([partido, count]) => {
              const c = getPartyColor(partido)
              return (
                <span key={partido} className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-semibold"
                  style={{ background: c.badge + '22', color: c.badge, border: `1px solid ${c.badge}44` }}>
                  {partido} <span className="opacity-70">{count}</span>
                </span>
              )
            })}
          </div>
        </div>
      </header>

      {/* ── Sidebar + Main ── */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-4 flex flex-col gap-4">

        {/* Controls row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <FiltersBar filters={filters} onChange={setFilters} counts={counts} />
          </div>
          <div className="sm:w-60">
            <SliderControl value={sliderCount} onChange={handleSliderChange} />
          </div>
        </div>

        {/* Party allocation panel toggle */}
        <div>
          <button
            onClick={() => setShowAllocation(v => !v)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition mb-2"
          >
            <span className={`transition-transform ${showAllocation ? 'rotate-90' : ''}`}>▶</span>
            Distribución por partido
            {!allocationOk && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-amber-400 bg-amber-500/10 border border-amber-500/20">
                Total: {allocationTotal} / {sliderCount}
              </span>
            )}
            {allocationOk && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-emerald-400 bg-emerald-500/10 text-[10px]">
                ✓ {sliderCount} escaños
              </span>
            )}
          </button>

          {showAllocation && (
            <PartyAllocationPanel
              allocation={allocation}
              onChange={setAllocation}
              total={sliderCount}
            />
          )}
        </div>

        {/* Hemiciclo */}
        <div className="glass rounded-2xl p-3">
          <HemicicloView
            diputados={visibleDiputados}
            filteredIds={filteredIds}
            assignments={assignments}
            onAssign={handleAssign}
          />
        </div>

        {/* Legend */}
        <div className="glass rounded-xl px-4 py-3">
          <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-medium">Leyenda de partidos</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PARTY_COLORS).map(([key, val]) => {
              const count = visibleDiputados.filter(d => d.partido === key).length
              if (count === 0) return null
              return (
                <div key={key} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                  style={{ background: val.bg, border: `1px solid ${val.border}` }}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: val.badge }} />
                  <span className="text-white font-medium">{key}</span>
                  <span className="text-slate-400">– {val.label}</span>
                  <span className="ml-1 font-bold" style={{ color: val.badge }}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 pb-2">
          Haz clic en cualquier escaño para asignar un estudiante · Los cambios se guardan automáticamente
        </p>
      </div>
    </div>
  )
}
