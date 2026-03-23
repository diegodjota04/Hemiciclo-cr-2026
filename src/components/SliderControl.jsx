export default function SliderControl({ value, onChange }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">
          Escaños visibles
        </label>
        <span className="text-blue-400 font-bold text-lg leading-none">{value}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500">16</span>
        <input
          type="range"
          min={16}
          max={57}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-blue-500"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - 16) / 41) * 100}%, rgba(255,255,255,0.1) ${((value - 16) / 41) * 100}%, rgba(255,255,255,0.1) 100%)`
          }}
        />
        <span className="text-xs text-slate-500">57</span>
      </div>
      <p className="text-xs text-slate-500 mt-2 text-center">
        Arrastra para simular distintos tamaños de asamblea
      </p>
    </div>
  )
}
