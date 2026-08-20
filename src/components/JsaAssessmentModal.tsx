// src/components/JsaAssessmentModal.tsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, Check, MapPin, FileText, AlertTriangle, ShieldCheck, Activity, Info, ChevronDown, Search,
  ShieldAlert, ArrowUpCircle, Archive, Flame, Anchor, Hammer, FlaskConical, Cog, Trash2, Zap, Tag 
} from 'lucide-react';
import * as turf from '@turf/turf';
import { jsaTemplates } from '../data/jsaTemplateData';

interface JsaAssessmentModalProps {
  jobs?: any[]; 
  savedZones?: any[]; 
  onClose: () => void;
  onSubmitAssessment: (newJob: any) => void;
}

const HIGH_RISK_TAGS = [
  { id: 'height', label: 'งานที่สูง', icon: ArrowUpCircle, hazard: 'พลัดตกจากที่สูง, สิ่งของตกหล่นทับ' },
  { id: 'confined', label: 'งานอับอากาศ', icon: Archive, hazard: 'ขาดออกซิเจน, สูดดมก๊าซพิษ, อากาศติดไฟ' },
  { id: 'hotwork', label: 'งานความร้อน', icon: Flame, hazard: 'ไฟไหม้, แผลพุพองจากความร้อน, สะเก็ดไฟ' },
  { id: 'electrical', label: 'งานไฟฟ้า', icon: Zap, hazard: 'ไฟฟ้าช็อต, ไฟฟ้าลัดวงจร, แผลไหม้' },
  { id: 'lifting', label: 'งานยก/ปั้นจั่น', icon: Anchor, hazard: 'วัสดุตกทับ, สลิงขาด, เครนพลิกคว่ำ' },
  { id: 'excavation', label: 'งานขุดเจาะ', icon: Hammer, hazard: 'ดินถล่มทับ, โดนท่อ/สายไฟใต้ดิน' },
  { id: 'chemical', label: 'งานสารเคมี', icon: FlaskConical, hazard: 'สัมผัสสารเคมีอันตราย, สูดดมไอระเหย' },
  { id: 'machinery', label: 'งานเครื่องจักร', icon: Cog, hazard: 'ถูกส่วนที่เคลื่อนไหวหนีบ ดึง หรือทับ' },
  { id: 'demolition', label: 'งานรื้อถอน', icon: Trash2, hazard: 'โครงสร้างพังทลาย, ฝุ่นละอองหนาแน่น' },
];

// 🔍 ดร็อปดาวน์ค้นหารูปแบบงาน
function TemplateCombobox({ templates, value, onChange }: { templates: any[], value: string, onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = templates.find((t) => t.id === value);
  const filtered = templates.filter((t) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return t.category.toLowerCase().includes(q) || t.jobStep.toLowerCase().includes(q);
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setHighlight(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlight]) handleSelect(filtered[highlight].id);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between gap-3 bg-slate-50 border rounded-xl pl-4 pr-3.5 py-2.5 text-left transition-all duration-200 shadow-sm shadow-emerald-500/10 hover:bg-white ${
          open ? 'border-emerald-500 bg-white ring-4 ring-emerald-500/10' : 'border-emerald-300 hover:border-emerald-400'
        }`}
      >
        <div className="min-w-0">
          <span className="block text-xs font-bold text-slate-800 truncate">
            {selected ? selected.jobStep : 'เลือกรูปแบบงาน หรือ ประวัติเดิม'}
          </span>
          {selected && (
            <span className={`block text-[10px] font-bold uppercase tracking-wide truncate mt-0.5 ${selected.id.startsWith('history-') ? 'text-indigo-500' : 'text-emerald-600'}`}>
              {selected.category}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-emerald-500 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/70">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setHighlight(0); }}
              onKeyDown={handleKeyDown}
              placeholder="ค้นหารูปแบบงาน เช่น เครน, หลังคา..."
              className="w-full bg-transparent text-xs font-medium text-slate-700 placeholder:text-slate-400 outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar py-1.5">
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs font-bold text-slate-400">ไม่พบรูปแบบงาน</p>
              </div>
            ) : (
              filtered.map((t, idx) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelect(t.id)}
                  onMouseEnter={() => setHighlight(idx)}
                  className={`w-full text-left px-4 py-2.5 flex items-start gap-2.5 transition-colors ${idx === highlight ? (t.id.startsWith('history-') ? 'bg-indigo-50' : 'bg-emerald-50') : 'bg-white'}`}
                >
                  <div className="min-w-0 flex-1">
                    <span className={`block text-[10px] font-bold uppercase tracking-wide truncate ${t.id.startsWith('history-') ? 'text-indigo-500' : 'text-emerald-600'}`}>{t.category}</span>
                    <span className="block text-xs font-medium text-slate-700 leading-snug line-clamp-2 mt-0.5">{t.jobStep}</span>
                  </div>
                  {t.id === value && <Check className={`w-4 h-4 shrink-0 mt-0.5 ${t.id.startsWith('history-') ? 'text-indigo-500' : 'text-emerald-500'}`} />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 🔍 ดร็อปดาวน์ค้นหาพื้นที่ปฏิบัติงาน
function ZoneCombobox({ zones, value, onChange }: { zones: any[], value: string, onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = zones.find((z) => z.id === value);
  const filtered = zones.filter((z) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (z.projectName || '').toLowerCase().includes(q) || (z.name || '').toLowerCase().includes(q);
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setHighlight(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
    else if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((i) => Math.min(i + 1, filtered.length - 1)); } 
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((i) => Math.max(i - 1, 0)); } 
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[highlight]) handleSelect(filtered[highlight].id); }
  };

  if (zones.length === 0) return <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-400">General Site (ค่าเริ่มต้น)</div>;

  return (
    <div className="relative" ref={containerRef}>
      <button type="button" onClick={() => setOpen(!open)} onKeyDown={handleKeyDown} className={`w-full flex items-center justify-between gap-3 bg-slate-50 border rounded-xl pl-4 pr-3.5 py-2.5 text-left transition-all duration-200 shadow-sm shadow-indigo-500/10 hover:bg-white ${open ? 'border-indigo-500 bg-white ring-4 ring-indigo-500/10' : 'border-slate-200 hover:border-indigo-300'}`}>
        <div className="min-w-0">
          <span className="block text-xs font-bold text-slate-800 truncate">{selected ? selected.name : 'เลือกพื้นที่ปฏิบัติงาน'}</span>
          {selected && <span className="block text-[10px] font-bold text-indigo-500 uppercase tracking-wide truncate mt-0.5">{selected.projectName}</span>}
        </div>
        <ChevronDown className={`w-4 h-4 text-indigo-500 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/70">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); setHighlight(0); }} onKeyDown={handleKeyDown} placeholder="ค้นหาพื้นที่ เช่น ชื่อโครงการ, โซน..." className="w-full bg-transparent text-xs font-medium text-slate-700 placeholder:text-slate-400 outline-none" />
          </div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar py-1.5">
            {filtered.map((z, idx) => (
              <button key={z.id} type="button" onClick={() => handleSelect(z.id)} onMouseEnter={() => setHighlight(idx)} className={`w-full text-left px-4 py-2.5 flex items-start gap-2.5 transition-colors ${idx === highlight ? 'bg-indigo-50' : 'bg-white'}`}>
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] font-bold text-indigo-500 uppercase tracking-wide truncate">{z.projectName}</span>
                  <span className="block text-xs font-medium text-slate-700 leading-snug line-clamp-2 mt-0.5">{z.name}</span>
                </div>
                {z.id === value && <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function JsaAssessmentModal({ jobs = [], savedZones = [], onClose, onSubmitAssessment }: JsaAssessmentModalProps) {
  const [selectedZoneId, setSelectedZoneId] = useState(savedZones[0]?.id || '');
  
  const availableTemplates = useMemo(() => {
    const historyTemplates = (jobs || []).map(job => ({
      id: `history-${job.id}`, category: `ประวัติเดิม (${job.jsaNo})`, jobStep: job.jobStep, equipment: job.equipment,
      potentialHazard: job.potentialHazard, consequence: job.consequence,
      initialL: 3, initialS: Math.ceil(job.initialRisk / 3) || 3, controlMeasures: job.controlMeasures,
      criticalVerification: job.verification, residualL: 1, residualS: job.residualRiskScore || 1
    }));
    return [...historyTemplates, ...jsaTemplates];
  }, [jobs]);

  const [selectedTemplateId, setSelectedTemplateId] = useState(availableTemplates.length > 0 ? availableTemplates[0].id : '');

  // 📝 Form States
  const [jobStep, setJobStep] = useState('');
  const [equipment, setEquipment] = useState('');
  const [liftingEquipment, setLiftingEquipment] = useState('-');
  const [hazard, setHazard] = useState('');
  const [consequence, setConsequence] = useState('');
  
  const [initialL, setInitialL] = useState(1);
  const [initialS, setInitialS] = useState(1);
  const [controlMeasures, setControlMeasures] = useState('');
  const [verification, setVerification] = useState('');
  const [residualL, setResidualL] = useState(1);
  const [residualS, setResidualS] = useState(1);

  // 🌟 Tags States (ที่หายไป ผมเติมให้แล้วครับ!)
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]); 
  const [customTagInput, setCustomTagInput] = useState('');
  
  const [isSuccess, setIsSuccess] = useState(false);

  const cleanText = (text: string) => text.replace(/\[cite[^\]]*\]/gi, '').replace(/\s{2,}/g, ' ').trim();

  useEffect(() => {
    if (!selectedTemplateId) return;
    const template = availableTemplates.find((t) => t.id === selectedTemplateId) || availableTemplates[0];
    setJobStep(cleanText(template.jobStep));
    setEquipment(cleanText(template.equipment));
    setLiftingEquipment(template.category.includes('เครน') || template.jobStep.includes('ยก') ? 'Mobile Crane, ลวดสลิง' : '-');
    setHazard(cleanText(template.potentialHazard));
    setConsequence(cleanText(template.consequence));
    setInitialL(template.initialL); setInitialS(template.initialS);
    setControlMeasures(cleanText(template.controlMeasures));
    setVerification(cleanText(template.criticalVerification) || '✓ ตรวจสอบความเรียบร้อยก่อนเริ่มงาน');
    setResidualL(template.residualL || 1); setResidualS(template.residualS || template.initialS);
  }, [selectedTemplateId, availableTemplates]);

  const handleTagToggle = (tag: typeof HIGH_RISK_TAGS[0]) => {
    if (selectedTags.includes(tag.id)) {
      setSelectedTags(prev => prev.filter(t => t !== tag.id));
    } else {
      setSelectedTags(prev => [...prev, tag.id]);
      const newHazardLine = `[${tag.label}]: ${tag.hazard}`;
      setHazard(prev => prev ? `${prev}\n${newHazardLine}` : newHazardLine);
    }
  };

  // 🌟 ฟังก์ชันจัดการเพิ่มและลบ Custom Tag
  const handleAddCustomTag = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const tag = customTagInput.trim();
    if (tag) {
      if (!customTags.includes(tag)) setCustomTags(prev => [...prev, tag]);
      if (!selectedTags.includes(tag)) setSelectedTags(prev => [...prev, tag]);
    }
    setCustomTagInput('');
  };

  const handleCustomTagToggle = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const initialScore = initialL * initialS;
  const residualScore = residualL * residualS;

  const getRiskBadge = (score: number) => {
    if (score >= 20) return { label: 'EXTREME', color: 'bg-rose-600 text-white', light: 'bg-rose-50 border-rose-200 text-rose-700' };
    if (score >= 12) return { label: 'HIGH', color: 'bg-orange-500 text-white', light: 'bg-orange-50 border-orange-200 text-orange-700' };
    if (score >= 6) return { label: 'MEDIUM', color: 'bg-amber-400 text-slate-900', light: 'bg-amber-50 border-amber-200 text-amber-900' };
    return { label: 'LOW', color: 'bg-emerald-500 text-white', light: 'bg-emerald-50 border-emerald-200 text-emerald-700' };
  };

  const initialInfo = getRiskBadge(initialScore);
  const residualInfo = getRiskBadge(residualScore);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetZone = savedZones.find((z) => z.id === selectedZoneId);
    let pinLat = 12.6710, pinLng = 101.1540, areaName = 'General Site';
    if (targetZone) {
      const center = turf.centerOfMass(targetZone.geoJson);
      pinLng = center.geometry.coordinates[0]; pinLat = center.geometry.coordinates[1];
      areaName = `${targetZone.projectName} - ${targetZone.name}`;
    }

    const newJsaRecord = {
      id: Date.now().toString(),
      jsaNo: `JSA-${Math.floor(1000 + Math.random() * 9000)}`,
      jobStep, equipment, potentialHazard: hazard, consequence, initialRisk: initialScore,
      riskLevel: initialScore >= 15 ? 'CRITICAL' : initialScore >= 10 ? 'HIGH' : initialScore >= 5 ? 'MEDIUM' : 'LOW',
      controlMeasures, lat: pinLat, lng: pinLng, area: areaName,
      high_risk_tags: selectedTags, simops: initialScore >= 15, simopsDetail: initialScore >= 15 ? 'ความเสี่ยงสูง ตรวจพบเงื่อนไข SIMOPS' : '',
      liftingEquipment, verification, residualRiskScore: residualScore
    };
    
    setIsSuccess(true);
    setTimeout(() => { onSubmitAssessment(newJsaRecord); onClose(); }, 1500);
  };

  const ScorePicker = ({ value, onChange, label }: any) => (
    <div className="flex flex-col gap-2 w-full">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      <div className="flex gap-1.5 bg-white/60 p-1.5 rounded-xl border border-slate-200 shadow-sm w-full">
        {[1, 2, 3, 4, 5].map((num) => (
          <button key={num} type="button" onClick={() => onChange(num)} className={`flex-1 h-10 sm:h-11 rounded-lg font-black text-sm transition-all duration-150 active:scale-95 flex items-center justify-center focus-visible:outline-none ${value === num ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-white hover:text-slate-800 border border-transparent hover:border-slate-200'}`}>
            {num}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-0 lg:p-6 animate-in fade-in duration-300 font-['Inter','Kanit',sans-serif]">
      <form onSubmit={handleSubmit} className="relative bg-slate-50 w-full h-full lg:h-[90vh] max-w-6xl lg:rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-slate-700/20 animate-in zoom-in-95">
        
        {isSuccess && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white p-8 rounded-[32px] shadow-2xl flex flex-col items-center text-center border border-emerald-100 animate-in zoom-in-50 duration-500 w-[90%] max-w-sm">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-50"></div>
                <Check className="w-12 h-12 text-emerald-500 relative z-10 animate-bounce" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">บันทึก JSA สำเร็จ!</h3>
              <p className="text-sm text-slate-500 font-medium">ระบบกำลังนำคุณกลับสู่หน้าหลัก...</p>
            </div>
          </div>
        )}

        <div className="lg:hidden px-5 py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0 z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">New JSA</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Assessment Form</p>
          </div>
          <button type="button" onClick={onClose} className="bg-slate-100 text-slate-500 p-2 rounded-full active:scale-95"><X className="w-5 h-5"/></button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden custom-scrollbar">
          
          {/* คอลัมน์ซ้าย */}
          <div className="w-full lg:w-[360px] xl:w-[400px] bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col shrink-0 lg:overflow-y-auto custom-scrollbar">
            <div className="hidden lg:flex p-6 lg:p-8 justify-between items-start shrink-0">
              <div>
                <h2 className="text-xl xl:text-2xl font-black text-slate-900 tracking-tight">New JSA</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Assessment Form</p>
              </div>
            </div>

            <div className="px-5 py-6 lg:px-8 lg:pb-8 lg:pt-0 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-indigo-500"/> พื้นที่ปฏิบัติงาน</label>
                <ZoneCombobox zones={savedZones} value={selectedZoneId} onChange={setSelectedZoneId} />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-emerald-500"/> รูปแบบงาน (Auto-fill)</label>
                <TemplateCombobox templates={availableTemplates} value={selectedTemplateId} onChange={setSelectedTemplateId} />
              </div>
              <hr className="border-slate-100 my-2" />
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Job Step / Activity</label>
                  <textarea rows={2} value={jobStep} onChange={(e) => setJobStep(e.target.value)} className="w-full resize-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-700 outline-none transition-all duration-200 hover:border-slate-300 focus:bg-white focus:border-indigo-400 custom-scrollbar" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Tools & Equipment</label>
                  <input type="text" value={equipment} onChange={(e) => setEquipment(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-700 outline-none transition-all duration-200 hover:border-slate-300 focus:bg-white focus:border-indigo-400" />
                </div>
              </div>

              {/* 🌟 จุดที่เพิ่มเข้ามา: 9 TAGS + CUSTOM TAGS 🌟 */}
              <div className="pt-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-orange-500"/> High-Risk Tags</span>
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">เลือกได้มากกว่า 1</span>
                </label>
                
                <div className="flex flex-wrap gap-2">
                  {HIGH_RISK_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id);
                    const Icon = tag.icon;
                    return (
                      <button key={tag.id} type="button" onClick={() => handleTagToggle(tag)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all outline-none border ${isSelected ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 border-orange-500 scale-[1.02]' : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600'}`}>
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} /> {tag.label}
                      </button>
                    );
                  })}
                  
                  {/* 🌟 แสดง Tag ที่พิมพ์เพิ่มเอง */}
                  {customTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button key={tag} type="button" onClick={() => handleCustomTagToggle(tag)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all outline-none border ${isSelected ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 border-orange-500 scale-[1.02]' : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600'}`}>
                        <Tag className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} /> {tag}
                      </button>
                    );
                  })}
                </div>

                {/* 🌟 ช่องพิมพ์เพิ่ม Tag */}
                <div className="mt-3 flex items-center gap-2">
                  <input 
                    type="text" 
                    value={customTagInput} 
                    onChange={(e) => setCustomTagInput(e.target.value)} 
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomTag(); } }} 
                    placeholder="➕ พิมพ์เพิ่มงานอื่นๆ แล้วกด Enter..." 
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] font-medium text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
                  />
                  <button type="button" onClick={() => handleAddCustomTag()} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg text-[11px] font-bold transition-colors">
                    เพิ่มแท็ก
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* คอลัมน์ขวา */}
          <div className="flex-1 flex flex-col bg-[#f4f7f9] lg:overflow-y-auto custom-scrollbar">
            <div className="hidden lg:flex justify-between items-center p-6 lg:px-8 border-b border-slate-200 bg-white shrink-0">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-slate-800"/>
                <h3 className="font-bold text-slate-800">Risk Matrix Assessment</h3>
              </div>
              <button type="button" onClick={onClose} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>

            <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
              <div className="bg-white p-5 lg:p-7 rounded-[28px] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-5 border-b border-slate-100 pb-4">
                  <AlertTriangle className="w-5 h-5 text-rose-500"/>
                  <h4 className="font-black text-slate-800 text-base">Hazard Identification</h4>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">Potential Hazard (อันตราย)</label>
                    <textarea rows={3} value={hazard} onChange={(e) => setHazard(e.target.value)} className="w-full resize-none bg-rose-50/50 border border-rose-100 rounded-xl px-4 py-3 text-xs font-medium text-slate-800 outline-none transition-all duration-200 hover:border-rose-200 focus:border-rose-300 focus:bg-white custom-scrollbar" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">Possible Consequence (ผลกระทบ)</label>
                    <textarea rows={3} value={consequence} onChange={(e) => setConsequence(e.target.value)} className="w-full resize-none bg-rose-50/50 border border-rose-100 rounded-xl px-4 py-3 text-xs font-medium text-slate-800 outline-none transition-all duration-200 hover:border-rose-200 focus:border-rose-300 focus:bg-white custom-scrollbar" />
                  </div>
                </div>

                <div className={`mt-6 p-5 lg:p-6 rounded-[24px] border transition-colors ${initialInfo.light}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 w-full">
                    <ScorePicker label="Likelihood" value={initialL} onChange={setInitialL} />
                    <ScorePicker label="Severity" value={initialS} onChange={setInitialS} />
                  </div>
                  <hr className="my-6 border-current opacity-10" />
                  <div className="flex items-end justify-between w-full">
                    <div className="text-[11px] font-black uppercase opacity-60 tracking-widest pb-1">Initial Risk</div>
                    <div className={`flex flex-col items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl shadow-md ${initialInfo.color}`}>
                      <span className="text-2xl md:text-3xl font-black leading-none">{initialScore}</span>
                      <span className="text-[9px] md:text-[10px] font-bold tracking-widest mt-1.5">{initialInfo.label}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 lg:p-7 rounded-[28px] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-5 border-b border-slate-100 pb-4">
                  <ShieldCheck className="w-5 h-5 text-emerald-500"/>
                  <h4 className="font-black text-slate-800 text-base">Control Measures</h4>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Control Measures (มาตรการควบคุม)</label>
                    <textarea rows={2} value={controlMeasures} onChange={(e) => setControlMeasures(e.target.value)} className="w-full resize-none bg-emerald-50/50 border border-emerald-100 rounded-xl px-4 py-3 text-xs font-medium text-slate-800 outline-none transition-all duration-200 hover:border-emerald-200 focus:border-emerald-300 focus:bg-white custom-scrollbar" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Verification (การตรวจสอบ)</label>
                    <textarea rows={2} value={verification} onChange={(e) => setVerification(e.target.value)} className="w-full resize-none bg-emerald-50/50 border border-emerald-100 rounded-xl px-4 py-3 text-xs font-medium text-slate-800 outline-none transition-all duration-200 hover:border-emerald-200 focus:border-emerald-300 focus:bg-white custom-scrollbar" />
                  </div>
                </div>

                <div className={`mt-6 p-5 lg:p-6 rounded-[24px] border transition-colors ${residualInfo.light}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 w-full">
                    <ScorePicker label="Likelihood" value={residualL} onChange={setResidualL} />
                    <ScorePicker label="Severity" value={residualS} onChange={setResidualS} />
                  </div>
                  <hr className="my-6 border-current opacity-10" />
                  <div className="flex items-end justify-between w-full">
                    <div className="text-[11px] font-black uppercase opacity-60 tracking-widest pb-1">Residual Risk</div>
                    <div className={`flex flex-col items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl shadow-md ${residualInfo.color}`}>
                      <span className="text-2xl md:text-3xl font-black leading-none">{residualScore}</span>
                      <span className="text-[9px] md:text-[10px] font-bold tracking-widest mt-1.5">{residualInfo.label}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="bg-white border-t border-slate-200 p-4 lg:px-8 lg:py-5 flex flex-col sm:flex-row gap-3 justify-end shrink-0 z-10">
          <button type="submit" className="sm:order-2 px-8 py-3.5 sm:py-4 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all active:scale-95 text-sm flex justify-center items-center gap-2 w-full sm:w-auto">
            <Check className="w-4 h-4" /> บันทึกการประเมิน
          </button>
          <button type="button" onClick={onClose} className="sm:order-1 px-6 py-3.5 sm:py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm active:scale-95 border border-slate-200 sm:border-none w-full sm:w-auto">
            ยกเลิก
          </button>
        </div>

      </form>
    </div>
  );
}