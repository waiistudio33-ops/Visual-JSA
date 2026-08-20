// src/components/MapSection.tsx
import { useState, useMemo, useRef, useEffect } from 'react';
import Map, { Marker, NavigationControl, FullscreenControl, Source, Layer, Popup } from 'react-map-gl/maplibre';
import { 
  MapPin, Zap, X, PencilRuler, Check, Eye, Undo2, AlertTriangle, 
  ShieldCheck, Layers, ArrowUpCircle, Flame, Archive, Cog, CheckCircle2, Clock 
} from 'lucide-react';
import * as turf from '@turf/turf'; 
import type { JsaData } from '../types/jsa';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || 'YOUR_MAPTILER_KEY';
const DEFAULT_CENTER = { lat: 12.6710, lng: 101.1540, zoom: 15.5 };

const ZONE_COLORS = ['#3b82f6', '#ec4899', '#06b6d4', '#f59e0b', '#8b5cf6', '#10b981'];

// 🌟 ระบบสีและไอคอนสำหรับ TAG ประเภทงานเสี่ยงสูง
const TAG_STYLES: Record<string, { label: string, icon: any, color: string }> = {
  'height': { label: 'งานที่สูง', icon: ArrowUpCircle, color: 'text-sky-700 bg-sky-100 border-sky-200' },
  'hotwork': { label: 'งานความร้อน', icon: Flame, color: 'text-rose-700 bg-rose-100 border-rose-200' },
  'confined': { label: 'งานอับอากาศ', icon: Archive, color: 'text-purple-700 bg-purple-100 border-purple-200' },
  'electrical': { label: 'งานไฟฟ้า', icon: Zap, color: 'text-amber-700 bg-amber-100 border-amber-200' },
  'default': { label: 'งานเสี่ยง', icon: Cog, color: 'text-slate-700 bg-slate-100 border-slate-200' }
};

interface MapSectionProps {
  jobs: JsaData[];
  isAddingMode: boolean;
  isDrawingMode: boolean;
  onLocationPick: (lat: number, lng: number) => void;
  onZoneComplete: (geoJson: any, areaSqM: number) => void;
  onCancelDrawing: () => void;
  newPin: { lat: number, lng: number } | null;
  mapMode: 'satellite' | 'streets';
  savedZones: any[];
  onViewJsaDetail?: (job: JsaData) => void;
}

export default function MapSection({ 
  jobs, isAddingMode, isDrawingMode, 
  onLocationPick, onZoneComplete, onCancelDrawing, 
  newPin, mapMode, savedZones, onViewJsaDetail 
}: MapSectionProps) {
  
  const mapRef = useRef<any>(null); 
  const [viewState, setViewState] = useState({ 
    latitude: DEFAULT_CENTER.lat, longitude: DEFAULT_CENTER.lng, zoom: DEFAULT_CENTER.zoom 
  });
  
  const [selectedJob, setSelectedJob] = useState<JsaData | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<JsaData[] | null>(null); 
  
  const [draftRing, setDraftRing] = useState<number[][]>([]);
  const [cursorLngLat, setCursorLngLat] = useState<[number, number] | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDrawingMode) return;
      
      if (e.key === 'Enter' && draftRing.length >= 3) {
        e.preventDefault();
        handleFinishDrawing();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setDraftRing([]);
        setCursorLngLat(null);
        onCancelDrawing();
      } else if (e.key === 'Backspace' || e.key === 'z') {
        if (draftRing.length > 0) handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawingMode, draftRing]);

  const previewRing = useMemo(() => {
    if (draftRing.length === 0) return [];
    if (!cursorLngLat || !isDrawingMode) return draftRing;
    return [...draftRing, cursorLngLat];
  }, [draftRing, cursorLngLat, isDrawingMode]);

  const draftGeoJson = useMemo(() => {
    if (previewRing.length === 0) return null;
    if (previewRing.length === 1) return turf.point(previewRing[0]); 
    if (previewRing.length === 2) return turf.lineString(previewRing); 
    
    if (previewRing.length >= 3) {
      const firstPoint = previewRing[0];
      const lastPoint = previewRing[previewRing.length - 1];
      const isClosed = firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1];
      const polygonRing = isClosed ? previewRing : [...previewRing, previewRing[0]];
      return turf.polygon([polygonRing]);
    }
    return null;
  }, [previewRing]);

  const currentArea = useMemo(() => {
    if (draftGeoJson && draftGeoJson.geometry.type === 'Polygon') {
      return turf.area(draftGeoJson);
    }
    return 0;
  }, [draftGeoJson]);

  const groupedJobs = useMemo(() => {
    const groups: Record<string, JsaData[]> = {};
    jobs.forEach(job => {
      const key = `${job.lat.toFixed(4)},${job.lng.toFixed(4)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(job);
    });
    return Object.values(groups);
  }, [jobs]);

  const handleFinishDrawing = () => {
    if (draftRing.length < 3) return; 
    const finalPolygon = turf.polygon([[...draftRing, draftRing[0]]]);
    const areaSqMeters = turf.area(finalPolygon); 
    onZoneComplete(finalPolygon, areaSqMeters);
    setDraftRing([]); 
    setCursorLngLat(null);
  };

  const handleMapClick = (e: any) => {
    if (isAddingMode) {
      onLocationPick(e.lngLat.lat, e.lngLat.lng);
    } else if (isDrawingMode) {
      setDraftRing([...draftRing, [e.lngLat.lng, e.lngLat.lat]]);
    } else {
      setSelectedJob(null);
      setSelectedCluster(null);
    }
  };

  const handleMouseMove = (e: any) => {
    if (isDrawingMode && draftRing.length > 0) {
      setCursorLngLat([e.lngLat.lng, e.lngLat.lat]);
    }
  };

  const handleUndo = () => {
    setDraftRing((prev) => prev.slice(0, -1));
  };

  const getRiskColor = (job: JsaData) => {
    if (job.status === 'APPROVED') return '#10b981'; 
    switch (job.riskLevel) { 
      case 'CRITICAL': return '#ef4444'; 
      case 'HIGH': return '#f97316'; 
      case 'MEDIUM': return '#eab308'; 
      case 'LOW': return '#0ea5e9'; 
      default: return '#94a3b8'; 
    }
  };

  const getClusterColor = (cluster: JsaData[]) => {
    const hasCritical = cluster.some(j => j.status !== 'APPROVED' && (j.riskLevel === 'CRITICAL' || j.simops));
    if (hasCritical) return '#ef4444'; 
    const hasHigh = cluster.some(j => j.status !== 'APPROVED' && j.riskLevel === 'HIGH');
    if (hasHigh) return '#f97316'; 
    const hasMedium = cluster.some(j => j.status !== 'APPROVED' && j.riskLevel === 'MEDIUM');
    if (hasMedium) return '#eab308'; 
    const hasLow = cluster.some(j => j.status !== 'APPROVED' && j.riskLevel === 'LOW');
    if (hasLow) return '#0ea5e9'; 
    const allApproved = cluster.every(j => j.status === 'APPROVED');
    if (allApproved) return '#10b981'; 
    return '#94a3b8';
  };

  const StatusBadge = ({ status }: { status?: string }) => {
    if (status === 'APPROVED') return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm border border-emerald-200"><CheckCircle2 className="w-3 h-3"/> <span className="text-[9px] font-bold tracking-wide">APPROVED</span></span>;
    if (status === 'VERIFIED') return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm border border-blue-200"><ShieldCheck className="w-3 h-3"/> <span className="text-[9px] font-bold tracking-wide">VERIFIED</span></span>;
    return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm border border-amber-200"><Clock className="w-3 h-3"/> <span className="text-[9px] font-bold tracking-wide">PENDING</span></span>;
  };

  const JobTags = ({ tags, simops }: { tags?: string[], simops?: boolean }) => {
    return (
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {simops && (
          <span className="text-[9px] font-bold flex items-center gap-1 px-1.5 py-0.5 rounded border text-amber-700 bg-amber-50 border-amber-200"><Zap className="w-3 h-3 animate-pulse"/> SIMOPS</span>
        )}
        {tags?.slice(0, 3).map((tag, idx) => {
          const style = TAG_STYLES[tag] || { ...TAG_STYLES.default, label: tag };
          const Icon = style.icon;
          return (
            <span key={idx} className={`text-[9px] font-bold flex items-center gap-1 px-1.5 py-0.5 rounded border ${style.color}`}>
              <Icon className="w-3 h-3"/> {style.label}
            </span>
          )
        })}
        {tags && tags.length > 3 && (
          <span className="text-[9px] font-bold flex items-center px-1.5 py-0.5 rounded border text-slate-500 bg-slate-50 border-slate-200">+{tags.length - 3}</span>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full font-['Inter','Kanit',sans-serif]">
      
      {/* 🌟 CSS แก้ปัญหา Popup ยืดหด และบังจอ */}
      <style>{`
        /* ปิด Style พื้นฐานของ Mapbox/Maplibre ที่ชอบตีกับ Tailwind */
        .custom-popup .maplibregl-popup-content,
        .custom-popup .mapboxgl-popup-content {
          padding: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          border-radius: 16px !important;
        }
        /* ปรับเงาของสามเหลี่ยมชี้ (Tip) */
        .custom-popup .maplibregl-popup-tip,
        .custom-popup .mapboxgl-popup-tip {
          border-top-color: white !important;
        }
      `}</style>

      {/* ✏️ แผงควบคุมการวาด */}
      {isDrawingMode && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95vw] sm:w-auto max-w-2xl bg-white/95 backdrop-blur-xl p-2 sm:p-3 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-200 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3 text-slate-700 bg-cyan-50/80 px-4 py-2.5 rounded-xl border border-cyan-100 w-full justify-center sm:w-auto shrink-0">
            <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
              <PencilRuler className="w-4 h-4 text-cyan-600 animate-pulse"/>
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] sm:text-[13px] font-black text-slate-800 leading-tight">
                {draftRing.length === 0 ? 'คลิกบนแผนที่เพื่อเริ่มวาด' : 
                 draftRing.length < 3 ? 'คลิกตามมุมเพื่อวาดโซน' : 'ลากดูพื้นที่ หรือคลิกวาดต่อ'}
              </span>
              {currentArea > 0 ? (
                <span className="text-[10px] sm:text-[11px] text-cyan-600 font-bold tracking-wide mt-0.5">
                  พื้นที่ปัจจุบัน: {Math.round(currentArea).toLocaleString()} ตร.ม.
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-medium mt-0.5">ลากครอบพื้นที่หน้างาน</span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            <button title="[Esc] เพื่อยกเลิก" onClick={() => { setDraftRing([]); setCursorLngLat(null); onCancelDrawing(); }} className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-3 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl text-[12px] sm:text-[13px] font-bold transition-all shadow-sm border border-slate-200 flex justify-center items-center gap-1.5">
              <X className="w-4 h-4"/> ยกเลิก
            </button>
            
            {draftRing.length > 0 && (
              <button title="[Z] เพื่อถอยกลับ" onClick={handleUndo} className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-3 bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-600 rounded-xl text-[12px] sm:text-[13px] font-bold transition-all shadow-sm border border-slate-200 flex justify-center items-center gap-1.5">
                <Undo2 className="w-4 h-4"/> ถอยกลับ
              </button>
            )}

            {draftRing.length >= 3 && (
              <button title="[Enter] เพื่อบันทึก" onClick={handleFinishDrawing} className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-[12px] sm:text-[13px] font-black shadow-lg shadow-cyan-500/30 transition-all active:scale-95 flex justify-center items-center gap-1.5 border border-cyan-400">
                <Check className="w-4 h-4" strokeWidth={3}/> ยืนยันโซน 
              </button>
            )}
          </div>
        </div>
      )}

      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onMouseMove={handleMouseMove} 
        mapStyle={mapMode === 'satellite' ? `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}` : `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`}
        style={{ width: '100%', height: '100%', cursor: isAddingMode || isDrawingMode ? 'crosshair' : 'grab' }}
        onClick={handleMapClick}
      >
        <NavigationControl position="bottom-right" />
        <FullscreenControl position="top-right" />

        {savedZones.map((zone, idx) => {
          const color = ZONE_COLORS[idx % ZONE_COLORS.length];
          const center = turf.centerOfMass(zone.geoJson);
          const [lng, lat] = center.geometry.coordinates;

          return (
            <div key={`zone-group-${idx}`}>
              <Source type="geojson" data={zone.geoJson}>
                <Layer id={`zone-fill-${idx}`} type="fill" paint={{ 'fill-color': color, 'fill-opacity': 0.2 }} />
                <Layer id={`zone-line-${idx}`} type="line" paint={{ 'line-color': color, 'line-width': 3, 'line-dasharray': [2, 1] }} />
              </Source>
              <Marker latitude={lat} longitude={lng}>
                <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-[0_8px_16px_rgba(0,0,0,0.3)] border border-slate-200 pointer-events-none flex items-center gap-2 transform -translate-y-1/2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></div>
                  <span className="text-[11px] font-black text-slate-800 tracking-wide">{zone.name}</span>
                </div>
              </Marker>
            </div>
          );
        })}

        {draftGeoJson && (
          <Source id="draft-zone" type="geojson" data={draftGeoJson as any}>
            {previewRing.length >= 2 && <Layer id="draft-line-bg" type="line" paint={{ 'line-color': '#ffffff', 'line-width': 6 }} />}
            {previewRing.length >= 2 && <Layer id="draft-line" type="line" paint={{ 'line-color': '#06b6d4', 'line-width': 3, 'line-dasharray': [2, 2] }} />}
            {previewRing.length >= 3 && <Layer id="draft-fill" type="fill" paint={{ 'fill-color': '#06b6d4', 'fill-opacity': 0.35 }} />}
          </Source>
        )}

        {draftRing.map((coord, i) => (
           <Marker key={`draft-node-${i}`} longitude={coord[0]} latitude={coord[1]}>
             <div className="w-4 h-4 bg-[#06b6d4] border-2 border-white rounded-full shadow-md pointer-events-none"></div>
           </Marker>
        ))}

        {newPin && (
          <Marker latitude={newPin.lat} longitude={newPin.lng} anchor="bottom">
            <div className="relative">
              <div className="absolute -inset-4 bg-indigo-500 rounded-full opacity-20 animate-ping"></div>
              <MapPin className="w-12 h-12 text-indigo-600 relative z-10 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]" fill="currentColor" stroke="white" strokeWidth={2} />
            </div>
          </Marker>
        )}

        {groupedJobs.map((group, idx) => {
          const baseLat = group[0].lat;
          const baseLng = group[0].lng;
          const isCluster = group.length > 1;

          return (
            <Marker 
              key={`group-${idx}`} 
              latitude={baseLat} 
              longitude={baseLng} 
              anchor="bottom" 
              onClick={e => { 
                e.originalEvent.stopPropagation(); 
                if (isCluster) {
                  setSelectedCluster(group);
                  setSelectedJob(null);
                } else {
                  setSelectedJob(group[0]);
                  setSelectedCluster(null);
                }
                // Zoom in เล็กน้อยให้ Popup โผล่สวยๆ
                mapRef.current?.flyTo({ center: [baseLng, baseLat], zoom: Math.max(viewState.zoom, 17), duration: 800 });
              }}
            >
              {isCluster ? (
                <div className={`relative group cursor-pointer ${selectedCluster === group ? 'scale-125 z-50' : 'hover:scale-110 z-10'} transition-transform duration-300`}>
                  <div className="absolute -inset-2 rounded-full opacity-40 animate-ping" style={{ backgroundColor: getClusterColor(group) }}></div>
                  <div className="relative flex items-center justify-center w-12 h-12 rounded-full border-[3px] border-white shadow-[0_8px_16px_rgba(0,0,0,0.5)] text-white font-black text-sm" style={{ backgroundColor: getClusterColor(group) }}>
                    <Layers className="w-4 h-4 absolute opacity-20" />
                    <span className="relative z-10">{group.length}</span>
                  </div>
                </div>
              ) : (
                <div className={`relative group cursor-pointer ${selectedJob?.id === group[0].id ? 'scale-125 z-50' : 'hover:scale-110 z-10'} transition-transform duration-300`}>
                  {group[0].status !== 'APPROVED' && (group[0].riskLevel === 'CRITICAL' || group[0].simops) && (
                    <div className="absolute -inset-3 bg-rose-500 rounded-full opacity-30 animate-ping"></div>
                  )}
                  <div className="relative flex items-center justify-center w-12 h-12">
                    <MapPin className="w-12 h-12 drop-shadow-[0_8px_12px_rgba(0,0,0,0.4)] transition-colors" style={{ color: getRiskColor(group[0]) }} fill="currentColor" stroke="white" strokeWidth={2} />
                    {group[0].status === 'APPROVED' ? (
                      <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white shadow-md"><Check className="w-3.5 h-3.5" strokeWidth={3} /></div>
                    ) : group[0].simops ? (
                      <div className="absolute -top-1 -right-1 bg-amber-400 text-amber-900 rounded-full p-0.5 border-2 border-white shadow-md"><Zap className="w-3.5 h-3.5" /></div>
                    ) : null}
                  </div>
                </div>
              )}
            </Marker>
          );
        })}

        {/* 🌟 Popup สำหรับหมุดเดี่ยว ล็อคขนาดให้คงที่ */}
        {selectedJob && (
          <Popup 
            latitude={selectedJob.lat} longitude={selectedJob.lng} 
            anchor="bottom" offset={48} 
            onClose={() => setSelectedJob(null)} closeOnClick={false} closeButton={false} 
            className="z-50 custom-popup" maxWidth="none" 
          >
            <div className="w-[300px] sm:w-[340px] bg-white rounded-[16px] shadow-xl border border-slate-100 flex flex-col gap-3 p-3.5 relative pointer-events-auto">
              <div className="flex justify-between items-start gap-2">
                <div className="flex flex-col gap-1.5 items-start">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">{selectedJob.jsaNo}</span>
                    <StatusBadge status={selectedJob.status} />
                  </div>
                  <JobTags tags={selectedJob.high_risk_tags} simops={selectedJob.simops} />
                </div>
                <button onClick={(e) => { e.stopPropagation(); setSelectedJob(null); }} className="text-slate-400 hover:bg-slate-100 hover:text-slate-600 p-1.5 rounded-full transition-colors active:scale-95 shrink-0">
                  <X className="w-4 h-4"/>
                </button>
              </div>

              <h4 className="text-[14px] font-black text-slate-800 leading-snug line-clamp-2 pr-1">{selectedJob.jobStep}</h4>
              
              <div className="flex flex-col gap-2 text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-inner">
                <div className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5"/><span className="line-clamp-2 font-medium">{selectedJob.area}</span></div>
                <div className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5"/><span className="line-clamp-2 font-medium">{selectedJob.potentialHazard}</span></div>
              </div>
                
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-1">
                <div className="flex flex-col mt-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Risk Level</span>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded text-white shadow-sm w-max ${selectedJob.riskLevel === 'CRITICAL' ? 'bg-rose-600' : selectedJob.riskLevel === 'HIGH' ? 'bg-orange-500' : selectedJob.riskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'}`}>{selectedJob.riskLevel}</span>
                </div>
                {onViewJsaDetail && (
                  <button onClick={(e) => { e.stopPropagation(); onViewJsaDetail(selectedJob); }} className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/20 transition-all active:scale-95">
                    <Eye className="w-3.5 h-3.5" /> รายละเอียด
                  </button>
                )}
              </div>
            </div>
          </Popup>
        )}

        {/* 🌟 Popup สำหรับกลุ่มหมุด Cluster ล็อคขนาดให้คงที่ */}
        {selectedCluster && (
          <Popup 
            latitude={selectedCluster[0].lat} longitude={selectedCluster[0].lng} 
            anchor="bottom" offset={40} 
            onClose={() => setSelectedCluster(null)} closeOnClick={false} closeButton={false} 
            className="z-50 custom-popup" maxWidth="none" 
          >
            <div className="w-[300px] sm:w-[360px] bg-white rounded-[16px] shadow-xl border border-slate-100 flex flex-col gap-2 p-3.5 relative pointer-events-auto">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-[13px] font-black text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-500" /> พบ {selectedCluster.length} รายการในจุดนี้
                </h4>
                <button onClick={(e) => { e.stopPropagation(); setSelectedCluster(null); }} className="text-slate-400 hover:bg-slate-100 hover:text-slate-600 p-1.5 rounded-full transition-colors active:scale-95">
                  <X className="w-4 h-4"/>
                </button>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col gap-2.5 pr-1">
                {selectedCluster.map((job) => (
                  <div key={job.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-2 hover:border-indigo-300 transition-colors shadow-sm">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase bg-white text-slate-700 px-2 py-1 rounded-md border border-slate-200 w-max">{job.jsaNo}</span>
                        <StatusBadge status={job.status} />
                      </div>
                      <span className={`text-[9px] font-black px-2 py-1 rounded text-white shadow-sm shrink-0 ${job.riskLevel === 'CRITICAL' ? 'bg-rose-600' : job.riskLevel === 'HIGH' ? 'bg-orange-500' : job.riskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'}`}>
                        {job.riskLevel}
                      </span>
                    </div>
                    
                    <p className="text-xs font-bold text-slate-700 line-clamp-2 leading-tight mt-1">{job.jobStep}</p>
                    <JobTags tags={job.high_risk_tags} simops={job.simops} />

                    <div className="flex justify-end mt-1">
                      {onViewJsaDetail && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewJsaDetail(job);
                            setSelectedCluster(null); 
                          }} 
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-1.5 rounded-lg transition-colors border border-indigo-100"
                        >
                          <Eye className="w-3.5 h-3.5" /> เปิดดู
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Popup>
        )}

      </Map>
    </div>
  );
}