import { useState, useRef, useCallback, useEffect } from 'react'
import SeatCard from './SeatCard'
import { getPartyColor } from '../constants/parties'

// ── Lógica de Distribución: Plenario / 3 hileras ──
function getLegislativoLayout(totalFloor) {
  if (totalFloor <= 0) return [];
  if (totalFloor <= 12) return [totalFloor];
  if (totalFloor <= 28) return [Math.floor(totalFloor * 0.4), totalFloor - Math.floor(totalFloor * 0.4)];
  const r1 = Math.floor(totalFloor * 0.26); 
  const r2 = Math.floor(totalFloor * 0.34);
  const r3 = totalFloor - r1 - r2;
  return [r1, r2, r3];
}

function getAnnulusSectorPath(cx, cy, innerR, outerR, startAngle, endAngle) {
  // startAngle y endAngle en grados (0=Derecha, 90=Abajo, 180=Izquierda)
  const startRad = startAngle * Math.PI / 180;
  const endRad = endAngle * Math.PI / 180;
  const v1x = cx + innerR * Math.cos(startRad);
  const v1y = cy + innerR * Math.sin(startRad);
  const v2x = cx + outerR * Math.cos(startRad);
  const v2y = cy + outerR * Math.sin(startRad);
  const v3x = cx + outerR * Math.cos(endRad);
  const v3y = cy + outerR * Math.sin(endRad);
  const v4x = cx + innerR * Math.cos(endRad);
  const v4y = cy + innerR * Math.sin(endRad);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return [
    `M ${v1x} ${v1y}`,
    `L ${v2x} ${v2y}`,
    `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${v3x} ${v3y}`,
    `L ${v4x} ${v4y}`,
    `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${v1x} ${v1y}`,
    "Z"
  ].join(" ");
}

const MAX_PRES = 4; // Mesa Directiva de 4 puestos

export default function HemicicloView({ diputados, filteredIds, assignments, onAssign }) {
  const containerRef = useRef(null)
  const [containerSize, setContainerSize] = useState({ w: 1000, h: 600 })
  const [seatOrder, setSeatOrder] = useState(() => diputados.map(d => d.id))
  const [presidencia, setPresidencia] = useState([])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      setContainerSize({
        w: entries[0].contentRect.width,
        h: entries[0].contentRect.height || 700
      })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const s = new Set(diputados.map(d => d.id))
    setSeatOrder(prev => [...prev.filter(id => s.has(id)), ...diputados.filter(d => !prev.includes(d.id)).map(d => d.id)])
    setPresidencia(prev => prev.filter(id => s.has(id)))
  }, [diputados])

  const dipMap = Object.fromEntries(diputados.map(d => [d.id, d]))
  const presSet = new Set(presidencia)
  const floorDips = seatOrder.filter(id => !presSet.has(id)).map(id => dipMap[id]).filter(Boolean);

  // ── GEOMETRÍA DE PRECISIÓN EN SVG (Cuñas concéntricas) ──
  const rowCounts = getLegislativoLayout(floorDips.length);
  
  // Ancho y alto del área de la SVG
  const svgW = containerSize.w;
  const svgH = Math.max(500, containerSize.h - 200);
  
  const originX = svgW / 2;
  // Foco arriba en la SVG, la "U" crece hacia abajo
  const originY = 30; 

  // Configuramos los radios de las filas
  // Tratamos de ocupar el alto disponible pero sin pasarnos
  const availableHeight = svgH - originY - 10;
  const numRows = rowCounts.length || 1;
  const maxRowThickness = Math.max(60, Math.min(120, availableHeight / numRows));
  const baseInnerRadius = maxRowThickness * 1.3; // El radio más pequeño debe dejar un hueco ajustado

  const positionedSeats = [];
  let pointer = 0;

  rowCounts.forEach((count, rowIdx) => {
    if (!count) return;

    // Distancia radial de la fila actual
    const innerR = baseInnerRadius + rowIdx * (maxRowThickness + 10);
    const outerR = innerR + maxRowThickness;
    
    // El arco completo será 180 grados (de Izquierda a Derecha pasando por Abajo)
    const totalAngle = 180; 
    
    // Espacio (gap) en grados entre asientos contiguos
    const gapAngle = count > 1 ? 2.5 : 0; 
    const anglePerSeat = totalAngle / count;

    for (let i = 0; i < count; i++) {
      const dip = floorDips[pointer++];
      if (!dip) break;

      // i=0 debe estar a la izquierda (180 grados)
      // i=max debe estar a la derecha (0 grados)
      // Calculamos sAngle (menor) y eAngle (mayor) para el SVG arc.
      const seatEndAngle = 180 - (i * anglePerSeat) - gapAngle / 2;
      const seatStartAngle = 180 - ((i + 1) * anglePerSeat) + gapAngle / 2;
      
      const sAngle = seatStartAngle;
      const eAngle = seatEndAngle;
      
      const pathD = getAnnulusSectorPath(originX, originY, innerR, outerR, sAngle, eAngle);
      
      const midAngle = (sAngle + eAngle) / 2;
      const midRad = midAngle * Math.PI / 180;
      const midR = (innerR + outerR) / 2;
      
      // Coordenadas del centro geómetrico (para posicionar texto HTML en horizontal)
      const cX = originX + midR * Math.cos(midRad);
      const cY = originY + midR * Math.sin(midRad);
      
      // Ajustamos el tamaño disponible para el foreignObject
      const arcWidth = 2 * Math.sin(((eAngle - sAngle) / 2) * Math.PI / 180) * outerR;
      const foW = Math.max(40, arcWidth * 0.85);
      const foH = maxRowThickness * 0.85;

      positionedSeats.push({
        ...dip,
        pathD, cX, cY, foW, foH,
        rotation: 0 
      });
    }
  });

  const [ghostPos, setGhostPos] = useState(null)
  const [dropHighlight, setDropHighlight] = useState(null)
  const dragIdRef = useRef(null)
  const isDragging = useRef(false)
  const dropRef = useRef(null)
  const lastDragEnd = useRef(0)

  const handleFinishDrag = useCallback(() => {
    if (isDragging.current) {
      lastDragEnd.current = Date.now();
    }
    const fromId = dragIdRef.current; const target = dropRef.current;
    if (isDragging.current && fromId && target !== null) {
      if (typeof target === 'string' && target.startsWith('pres-')) {
        const slot = parseInt(target.replace('pres-', ''));
        setPresidencia(prev => {
          const clean = prev.filter(id => id !== fromId);
          const next = [...clean]; next.splice(slot, 0, fromId);
          return next.slice(0, MAX_PRES);
        });
      } else {
        setPresidencia(p => p.filter(id => id !== fromId));
        setSeatOrder(prev => {
          const a = [...prev]; const f = a.indexOf(fromId); const t = a.indexOf(target);
          if (f !== -1 && t !== -1) [a[f], a[t]] = [a[t], a[f]];
          return a;
        });
      }
    }
    setGhostPos(null); setDropHighlight(null); dragIdRef.current = null; isDragging.current = false; dropRef.current = null;
  }, []);

  const handleStartDrag = (e, id) => {
    const isTouch = e.type === 'touchstart';
    dragIdRef.current = id;
    
    const onMove = (ev) => {
      if (isTouch && ev.cancelable) {
        ev.preventDefault(); // Prevent scrolling while dragging
      }
      isDragging.current = true;
      
      const clientX = isTouch ? ev.touches[0].clientX : ev.clientX;
      const clientY = isTouch ? ev.touches[0].clientY : ev.clientY;
      
      setGhostPos({ x: clientX, y: clientY });
      
      if (isTouch) {
        const el = document.elementFromPoint(clientX, clientY);
        const dropZone = el?.closest('[data-drop-id]');
        if (dropZone) {
          const dropId = dropZone.getAttribute('data-drop-id');
          dropRef.current = dropId;
          setDropHighlight(dropId);
        } else {
          dropRef.current = null;
          setDropHighlight(null);
        }
      }
    };
    
    const onEnd = () => {
      if (isTouch) {
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onEnd);
        window.removeEventListener('touchcancel', onEnd);
      } else {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onEnd);
      }
      handleFinishDrag();
    };
    
    if (isTouch) {
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onEnd);
      window.addEventListener('touchcancel', onEnd);
    } else {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onEnd);
    }
  }

  return (
    <div ref={containerRef} className="w-full relative flex flex-col items-center p-8 bg-slate-950/20 rounded-3xl overflow-hidden min-h-[800px]">

      {/* 1. Mesa Directiva Estilo Moderno */}
      <div className="z-20 mb-6 flex flex-col items-center w-full max-w-4xl mx-auto py-4 px-6 rounded-2xl border border-white/5 bg-[#0f1525]/80 backdrop-blur" style={{boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)'}}>
        <h3 className="text-sm uppercase tracking-widest text-slate-300 font-semibold mb-6">Mesa Directiva</h3>
        <div className="flex gap-4 w-full justify-center">
          {[0, 1, 2, 3].map(i => {
            const dip = presidencia[i] ? dipMap[presidencia[i]] : null
            const isOver = dropHighlight === `pres-${i}`
            return (
              <div key={i} 
                data-drop-id={`pres-${i}`}
                onMouseEnter={() => { dropRef.current = `pres-${i}`; setDropHighlight(`pres-${i}`) }}
                style={{ width: 140, height: 90 }}
                className={`relative rounded-xl border-dashed border-2 p-2 flex items-center justify-center transition-all duration-300
                  ${isOver ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.4)]' : 'border-white/20'}`}>
                {/* Nested dashed borders for the aesthetic */}
                <div className="absolute inset-2 border border-dashed border-white/10 rounded-lg pointer-events-none"></div>
                
                {dip ? (
                  <div 
                    onMouseDown={e => handleStartDrag(e, dip.id)} 
                    onTouchStart={e => handleStartDrag(e, dip.id)} 
                    onClickCapture={e => { if (Date.now() - lastDragEnd.current < 200) { e.stopPropagation(); e.preventDefault(); } }}
                    className="w-full h-full cursor-grab z-10 touch-none">
                    <SeatCard 
                      diputado={dip} assignment={assignments[dip.id]} 
                      onAssign={data => onAssign(dip.id, data)}
                      layout="rect" foW={136} foH={86}
                    />
                  </div>
                ) : <span className="text-xs text-slate-500 font-medium z-10 tracking-widest uppercase">Mesa {i + 1}</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* 2. Plenario en Semicírculos (SVG Paths + ForeignObjects) */}
      <div className="relative w-full flex-1 min-h-[500px]">
        
        {/* SVG Surface */}
        <svg className="absolute inset-0 w-full h-full pointer-events-auto" style={{ filter: dropHighlight ? 'brightness(0.9)' : 'none' }}>
          {positionedSeats.map((dip) => {
            const isDragged = dragIdRef.current === dip.id;
            const isOver = dropHighlight === dip.id;
            
            return (
              <g key={dip.id}
                data-drop-id={dip.id}
                onMouseEnter={() => { dropRef.current = dip.id; setDropHighlight(dip.id) }}
                onMouseDown={e => handleStartDrag(e, dip.id)}
                onTouchStart={e => handleStartDrag(e, dip.id)}
                onClickCapture={e => { if (Date.now() - lastDragEnd.current < 200) { e.stopPropagation(); e.preventDefault(); } }}
                style={{
                  opacity: isDragged ? 0.3 : 1,
                  transition: 'opacity 0.2s',
                  cursor: 'grab',
                  touchAction: 'none'
                }}
              >
                <SeatCard 
                  diputado={dip} 
                  assignment={assignments[dip.id]} 
                  onAssign={data => onAssign(dip.id, data)}
                  isFiltered={filteredIds.size > 0 && !filteredIds.has(dip.id)} 
                  layout="wedge"
                  pathD={dip.pathD}
                  cX={dip.cX}
                  cY={dip.cY}
                  foW={dip.foW}
                  foH={dip.foH}
                  isOver={isOver}
                />
              </g>
            );
          })}
        </svg>

        <div style={{ position: 'absolute', left: svgW / 2, top: svgH - 50, transform: 'translate(-50%, -50%)' }} className="opacity-[0.03] pointer-events-none select-none">
          <h2 className="text-[10rem] font-black text-white/30 tracking-tight">2026</h2>
        </div>
      </div>

      {ghostPos && dragIdRef.current && (
        <div style={{ position: 'fixed', left: ghostPos.x, top: ghostPos.y, zIndex: 9999, pointerEvents: 'none', transform: 'translate(-50%, -50%)' }}>
          <div className="bg-cyan-500/90 px-3 py-1 rounded-full text-white text-[10px] font-bold shadow-2xl border border-white/30">
            Reubicando...
          </div>
        </div>
      )}
    </div>
  )
}