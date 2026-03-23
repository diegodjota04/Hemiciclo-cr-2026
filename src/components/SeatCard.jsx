import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { getPartyColor } from '../constants/parties'

function AvatarPlaceholder({ genero, size, color }) {
  return (
    <div className="flex items-center justify-center rounded-full"
      style={{ width: size, height: size, fontSize: size * 0.5, background: `${color}22`, border: `1px solid ${color}44` }}>
      {genero === 'F' ? '👩‍⚖️' : '👨‍⚖️'}
    </div>
  )
}

function Modal({ diputado, assignment, onClose, onSave }) {
  const colors = getPartyColor(diputado.partido)
  const [studentName, setStudentName] = useState(assignment?.studentName || '')
  const [preview, setPreview] = useState(assignment?.photo || null)
  const fileRef = useRef()

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(file)
  }
  const save = () => { onSave({ studentName, photo: preview }); onClose() }

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[99999] p-4"
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#1e293b] border rounded-3xl w-full max-w-md overflow-hidden shadow-2xl" style={{ borderColor: colors.border }}>
        <div className="p-6 flex items-center gap-4" style={{ background: `${colors.bg}cc` }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg" style={{ background: colors.badge }}>
            {diputado.partido}
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-400 uppercase tracking-wider">{diputado.provincia}</p>
            <p className="text-lg font-bold text-white">{diputado.nombre}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl">✕</button>
        </div>
        <div className="p-8 flex flex-col gap-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative cursor-pointer group" onClick={() => fileRef.current.click()}>
              {preview
                ? <img src={preview} className="w-24 h-24 rounded-full object-cover border-4" style={{ borderColor: colors.border }} />
                : <div className="w-24 h-24 rounded-full border-4 border-dashed flex flex-col items-center justify-center text-slate-500" style={{ borderColor: colors.border }}>
                  <span className="text-2xl">📷</span>
                  <span className="text-[10px] uppercase font-bold">Subir Foto</span>
                </div>}
            </div>
            <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 block font-bold">Nombre del Estudiante</label>
            <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500 transition-colors"
              placeholder="Ej: Juan Pérez" />
          </div>
          <button onClick={save} className="w-full py-3 rounded-xl font-bold text-white active:scale-95 transition-transform" style={{ background: colors.badge }}>
            Guardar Asignación
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function SeatCard({ diputado, assignment, onAssign, isFiltered, layout = 'wedge', pathD, cX, cY, foW, foH, isOver }) {
  const [showModal, setShowModal] = useState(false)
  const colors = getPartyColor(diputado.partido)
  const hasStudent = !!(assignment?.studentName || assignment?.photo)

  const photoSize = Math.max(20, foH * 0.4)
  const baseFontSizeMain = Math.max(9, foW * 0.12)
  const baseFontSizeSub = Math.max(8, foW * 0.1)

  // Autoajuste dinámico basado en longitud del texto para evitar desbordes
  const getScale = (text = '', idealLen = 12, minScale = 0.65) => 
    Math.max(minScale, Math.min(1, idealLen / Math.max(1, text.length)));

  const textMain = hasStudent ? assignment.studentName : diputado.nombre;
  const textSub = diputado.partido;

  const fontSizeMain = baseFontSizeMain * getScale(textMain, 12, 0.55);
  const fontSizeSub = baseFontSizeSub * getScale(textSub, 8, 0.7);

  const InnerContent = () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-0.5 p-1 select-none"
      style={{ opacity: isFiltered ? 0.2 : 1 }}>
      <div className="mb-0.5 relative">
        {assignment?.photo
          ? <img src={assignment.photo} className="rounded-full object-cover border-[1.5px]" style={{ width: photoSize, height: photoSize, borderColor: colors.badge }} />
          : <AvatarPlaceholder genero={diputado.genero} size={photoSize} color={colors.badge} />}
      </div>
      <div className="flex flex-col items-center text-center w-full leading-tight">
        <p style={{
          fontSize: fontSizeMain, color: hasStudent ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: 700,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%'
        }}>
          {textMain}
        </p>
        <p style={{
          fontSize: fontSizeSub, color: colors.badge, fontWeight: 600,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%'
        }}>
          {textSub}
        </p>
        <p style={{
          fontSize: Math.max(5, baseFontSizeSub * 0.8), color: 'rgba(255,255,255,0.4)', marginTop: 2
        }}>
          {hasStudent ? '-' : '+ asignar'}
        </p>
      </div>
    </div>
  )

  if (layout === 'wedge') {
    return (
      <>
        <g onClick={() => setShowModal(true)}>
          <path
            d={pathD}
            fill={hasStudent ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.04)'}
            stroke={colors.badge}
            strokeWidth={isOver ? 2.5 : 1}
            strokeLinejoin="round"
            style={{
              filter: isOver ? `drop-shadow(0 0 10px ${colors.badge})` : (hasStudent ? `drop-shadow(0 0 5px ${colors.badge}88)` : 'none'),
              transition: 'all 0.2s ease-in-out'
            }}
          />
          <foreignObject x={cX - foW / 2} y={cY - foH / 2} width={foW} height={foH} className="pointer-events-none">
            <InnerContent />
          </foreignObject>
        </g>
        {showModal && <Modal diputado={diputado} assignment={assignment} onClose={() => setShowModal(false)} onSave={onAssign} />}
      </>
    )
  }

  // Rectangular layout for Mesa Directiva
  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="w-full h-full relative flex flex-col items-center justify-center transition-all duration-300 rounded-lg overflow-hidden"
        style={{
          background: hasStudent ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.02)',
          border: `1.5px solid ${colors.badge}`,
          boxShadow: hasStudent ? `inset 0 0 15px ${colors.badge}44` : 'none',
          opacity: isFiltered ? 0.2 : 1, cursor: 'pointer'
        }}>
        <InnerContent />
      </div>
      {showModal && <Modal diputado={diputado} assignment={assignment} onClose={() => setShowModal(false)} onSave={onAssign} />}
    </>
  )
}