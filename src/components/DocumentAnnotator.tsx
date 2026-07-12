import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import { annotationService, type AnnotationColor, type AnnotationKind, type ExamAnnotation } from '../services/annotationService';

type Tool = 'pan' | AnnotationKind;
type Point = { x: number; y: number };

const COLORS: AnnotationColor[] = ['blue', 'yellow', 'green', 'red'];
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `annotation-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function DocumentAnnotator({ caseId, pageIndex, src, pageLabel }: { caseId: string; pageIndex: number; src: string; pageLabel: string }) {
  const [annotations, setAnnotations] = useState<ExamAnnotation[]>([]);
  const [tool, setTool] = useState<Tool>('pan');
  const [color, setColor] = useState<AnnotationColor>('yellow');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [note, setNote] = useState('');
  const [drawing, setDrawing] = useState<Point[]>([]);
  const [start, setStart] = useState<Point | null>(null);
  const [draftEnd, setDraftEnd] = useState<Point | null>(null);
  const [redo, setRedo] = useState<ExamAnnotation[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    void annotationService.list(caseId).then((items) => { if (active) setAnnotations(items.filter((item) => item.pageIndex === pageIndex)); }).catch(() => setStatus('Annotations could not be loaded.'));
    return () => { active = false; };
  }, [caseId, pageIndex]);

  const point = (event: ReactPointerEvent): Point => {
    const rect = stageRef.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)) };
  };

  const persist = async (annotation: ExamAnnotation) => {
    setAnnotations((items) => [...items, annotation]);
    setRedo([]);
    setStatus('Saving annotation…');
    try { await annotationService.save(annotation); setStatus('Saved'); }
    catch { setAnnotations((items) => items.filter((item) => item.id !== annotation.id)); setStatus('Could not save. Try again.'); }
  };

  const onDown = (event: ReactPointerEvent) => {
    if (tool === 'pan') return;
    // The page and its saved annotations rotate together for viewing. Creating
    // normalized coordinates against a rotated bounding box can introduce
    // drift, so editing is intentionally limited to the canonical orientation.
    if (rotation !== 0) {
      setStatus('Rotate the page back to 0° to add annotations.');
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    const next = point(event);
    if (tool === 'text') {
      if (!note.trim()) { setStatus('Type a note first, then tap the paper.'); return; }
      void persist({ id: makeId(), caseId, userId: '', pageIndex, kind: 'text', color, x: next.x, y: next.y, width: .28, height: .08, path: [], text: note.trim().slice(0, 500), rotation });
      setNote('');
      return;
    }
    setStart(next);
    setDraftEnd(next);
    if (tool === 'draw') setDrawing([next]);
  };

  const onMove = (event: ReactPointerEvent) => {
    if (!start || tool === 'pan' || tool === 'text') return;
    const next = point(event);
    setDraftEnd(next);
    if (tool === 'draw') setDrawing((points) => [...points, next].slice(-180));
  };

  const onUp = () => {
    if (!start || !draftEnd || tool === 'pan' || tool === 'text') return;
    const x = Math.min(start.x, draftEnd.x);
    const y = Math.min(start.y, draftEnd.y);
    const width = Math.max(.01, Math.abs(start.x - draftEnd.x));
    const height = Math.max(.01, Math.abs(start.y - draftEnd.y));
    const path = tool === 'draw' ? drawing.flatMap((item) => [item.x, item.y]) : [];
    void persist({ id: makeId(), caseId, userId: '', pageIndex, kind: tool, color, x, y, width, height, path, text: '', rotation });
    setStart(null); setDraftEnd(null); setDrawing([]);
  };

  const undo = async () => {
    const target = annotations.at(-1);
    if (!target) return;
    setAnnotations((items) => items.slice(0, -1));
    setRedo((items) => [...items, target]);
    try { await annotationService.remove(caseId, target.id); }
    catch { setAnnotations((items) => [...items, target]); setRedo((items) => items.filter((item) => item.id !== target.id)); }
  };

  const redoLast = async () => {
    const target = redo.at(-1);
    if (!target) return;
    setRedo((items) => items.slice(0, -1));
    setAnnotations((items) => [...items, target]);
    try { await annotationService.save(target); }
    catch { setAnnotations((items) => items.filter((item) => item.id !== target.id)); setRedo((items) => [...items, target]); }
  };

  const draftRect = useMemo(() => start && draftEnd ? { left: `${Math.min(start.x, draftEnd.x) * 100}%`, top: `${Math.min(start.y, draftEnd.y) * 100}%`, width: `${Math.abs(start.x - draftEnd.x) * 100}%`, height: `${Math.abs(start.y - draftEnd.y) * 100}%` } : null, [draftEnd, start]);

  return <section className="rg2-annotator">
    <div className="rg2-annotation-toolbar" aria-label="Annotation tools">
      {(['pan', 'highlight', 'draw', 'text'] as Tool[]).map((item) => <button key={item} type="button" className={tool === item ? 'is-active' : ''} onClick={() => setTool(item)} aria-pressed={tool === item}>{item === 'pan' ? <ICONS.Search /> : item === 'highlight' ? <ICONS.Edit3 /> : item === 'draw' ? <ICONS.Edit /> : <ICONS.MessageSquare />}<span>{item}</span></button>)}
      <button type="button" onClick={undo} disabled={!annotations.length} aria-label="Undo annotation"><ICONS.ChevronLeft /></button>
      <button type="button" onClick={redoLast} disabled={!redo.length} aria-label="Redo annotation"><ICONS.ChevronRight /></button>
      <button type="button" onClick={() => {
        setRotation((value) => ((value + 90) % 360) as 0 | 90 | 180 | 270);
        setStart(null); setDraftEnd(null); setDrawing([]);
      }} aria-label={`Rotate page. Current rotation ${rotation} degrees`}><ICONS.RefreshCcw /></button>
    </div>
    <div className="rg2-annotation-options">
      <div>{COLORS.map((item) => <button type="button" key={item} data-color={item} className={color === item ? 'is-active' : ''} onClick={() => setColor(item)} aria-label={`${item} annotation color`} />)}</div>
      {tool === 'text' && <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="Type a note, then tap the paper" />}
      <div className="ml-auto flex items-center gap-1"><button type="button" onClick={() => setZoom((value) => Math.max(.75, value - .25))} disabled={zoom <= .75}>−</button><span>{Math.round(zoom * 100)}%</span><button type="button" onClick={() => setZoom((value) => Math.min(2, value + .25))} disabled={zoom >= 2}>+</button></div>
    </div>
    <div className="rg2-document-scroll">
      <div ref={stageRef} className={`rg2-document-stage tool-${tool}`} style={{ width: `${zoom * 100}%`, transform: `rotate(${rotation}deg)` }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <img src={src} alt={pageLabel} draggable={false} />
        <svg className="rg2-document-overlay" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden>
          {annotations.filter((item) => item.kind === 'draw').map((item) => <polyline key={item.id} data-color={item.color} points={Array.from({ length: item.path.length / 2 }, (_, index) => `${item.path[index * 2] * 1000},${item.path[index * 2 + 1] * 1000}`).join(' ')} />)}
          {tool === 'draw' && drawing.length > 1 && <polyline data-color={color} points={drawing.map((item) => `${item.x * 1000},${item.y * 1000}`).join(' ')} />}
        </svg>
        {annotations.filter((item) => item.kind !== 'draw').map((item) => <motion.div key={item.id} initial={{ scale: .85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`rg2-user-annotation kind-${item.kind} color-${item.color}`} style={{ left: `${item.x * 100}%`, top: `${item.y * 100}%`, width: `${item.width * 100}%`, minHeight: `${item.height * 100}%` }}>{item.kind === 'text' ? item.text : null}</motion.div>)}
        {draftRect && tool === 'highlight' && <div className={`rg2-user-annotation kind-highlight color-${color}`} style={draftRect} />}
      </div>
    </div>
    <footer><span>{annotations.length} saved annotation{annotations.length === 1 ? '' : 's'}</span>{rotation !== 0 && <small>Viewing at {rotation}°. Rotate to 0° to edit.</small>}{status && <small role="status">{status}</small>}</footer>
  </section>;
}
