import { PARTY_COLORS, PARTY_COLOR_FALLBACK, PROVINCES } from '../constants/parties'

const SELECT_CLASSES =
  'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition hover:bg-white/10'

export default function FiltersBar({ filters, onChange, counts }) {
  const parties = Object.entries(PARTY_COLORS).map(([key, val]) => ({ key, label: val.label }))

  const handleChange = (field, value) => onChange({ ...filters, [field]: value })

  const hasFilters = filters.provincia || filters.genero || filters.partido
  const clear = () => onChange({ provincia: '', genero: '', partido: '' })

  return (
    <div className="glass rounded-xl p-4 flex flex-wrap gap-3 items-end">
      {/* Provincia */}
      <div className="flex-1 min-w-[140px]">
        <label className="block text-xs text-slate-400 mb-1 font-medium uppercase tracking-wider">Provincia</label>
        <select className={SELECT_CLASSES} value={filters.provincia} onChange={e => handleChange('provincia', e.target.value)}>
          <option value="">Todas</option>
          {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Género */}
      <div className="flex-1 min-w-[120px]">
        <label className="block text-xs text-slate-400 mb-1 font-medium uppercase tracking-wider">Género</label>
        <select className={SELECT_CLASSES} value={filters.genero} onChange={e => handleChange('genero', e.target.value)}>
          <option value="">Todos</option>
          <option value="M">Hombre</option>
          <option value="F">Mujer</option>
        </select>
      </div>

      {/* Partido */}
      <div className="flex-1 min-w-[180px]">
        <label className="block text-xs text-slate-400 mb-1 font-medium uppercase tracking-wider">Partido</label>
        <select className={SELECT_CLASSES} value={filters.partido} onChange={e => handleChange('partido', e.target.value)}>
          <option value="">Todos</option>
          {parties.map(p => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Results + clear */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-400">
          <span className="text-white font-semibold">{counts.visible}</span>
          <span> / {counts.total} diputados</span>
        </span>
        {hasFilters && (
          <button
            onClick={clear}
            className="text-xs px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition font-medium"
          >
            ✕ Limpiar
          </button>
        )}
      </div>
    </div>
  )
}
