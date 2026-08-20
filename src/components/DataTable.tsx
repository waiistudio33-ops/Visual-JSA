// src/components/DataTable.tsx
import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, Zap, Map as MapIcon, Shield, Filter, MapPin, Clock, ShieldCheck, CheckCircle2, ChevronDown,
  ArrowUpCircle, Flame, Archive, Anchor, Hammer, FlaskConical, Cog, Trash2, Tag
} from 'lucide-react';
import type { JsaData } from '../types/jsa';

interface DataTableProps {
  jobs: JsaData[];
  onFocusJob: (lat: number, lng: number) => void;
  onSelectJob?: (job: JsaData) => void;
}

const STATUS_OPTIONS = [
  { id: 'ALL', label: 'สถานะทั้งหมด', icon: Filter },
  { id: 'PENDING', label: 'รอตรวจสอบ', icon: Clock },
  { id: 'VERIFIED', label: 'รออนุมัติ', icon: ShieldCheck },
  { id: 'APPROVED', label: 'อนุมัติแล้ว', icon: CheckCircle2 },
];

// 🌟 เปลี่ยนเป็นค่ามาตรฐาน (เดี๋ยวเราจะเอาไปผสมกับ Tag ที่พิมพ์เองทีหลัง)
const STATIC_TAG_OPTIONS = [
  { id: 'ALL', label: 'ทุกประเภทงาน', icon: Filter },
  { id: 'height', label: 'งานที่สูง', icon: ArrowUpCircle },
  { id: 'hotwork', label: 'งานความร้อน', icon: Flame },
  { id: 'confined', label: 'งานอับอากาศ', icon: Archive },
  { id: 'electrical', label: 'งานไฟฟ้า', icon: Zap },
  { id: 'lifting', label: 'งานยก/ปั้นจั่น', icon: Anchor },
  { id: 'excavation', label: 'งานขุดเจาะ', icon: Hammer },
  { id: 'chemical', label: 'งานสารเคมี', icon: FlaskConical },
  { id: 'machinery', label: 'งานเครื่องจักร', icon: Cog },
  { id: 'demolition', label: 'งานรื้อถอน', icon: Trash2 },
];

const TAG_STYLES: Record<string, { label: string, icon: any, color: string }> = {
  'height': { label: 'งานที่สูง', icon: ArrowUpCircle, color: 'text-sky-700 bg-sky-100 border-sky-200' },
  'hotwork': { label: 'งานความร้อน', icon: Flame, color: 'text-rose-700 bg-rose-100 border-rose-200' },
  'confined': { label: 'งานอับอากาศ', icon: Archive, color: 'text-purple-700 bg-purple-100 border-purple-200' },
  'electrical': { label: 'งานไฟฟ้า', icon: Zap, color: 'text-amber-700 bg-amber-100 border-amber-200' },
  'lifting': { label: 'งานยก/ปั้นจั่น', icon: Anchor, color: 'text-blue-700 bg-blue-100 border-blue-200' },
  'excavation': { label: 'งานขุดเจาะ', icon: Hammer, color: 'text-stone-700 bg-stone-100 border-stone-200' },
  'chemical': { label: 'งานสารเคมี', icon: FlaskConical, color: 'text-emerald-700 bg-emerald-100 border-emerald-200' },
  'machinery': { label: 'งานเครื่องจักร', icon: Cog, color: 'text-indigo-700 bg-indigo-100 border-indigo-200' },
  'demolition': { label: 'งานรื้อถอน', icon: Trash2, color: 'text-red-700 bg-red-100 border-red-200' },
  'default': { label: 'แท็กอื่นๆ', icon: Tag, color: 'text-slate-700 bg-slate-100 border-slate-200' }
};

export default function DataTable({ jobs, onFocusJob, onSelectJob }: DataTableProps) {
  const [activeRisk, setActiveRisk] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [statusFilter, setStatusFilter] = useState('ALL'); 
  const [tagFilter, setTagFilter] = useState('ALL'); 
  
  const [openDropdown, setOpenDropdown] = useState<'STATUS' | 'TAG' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 🌟 ฟังก์ชันดึง Tag ทั้งหมดในระบบ (รวมถึงอันที่ User พิมพ์เองด้วย)
  const dynamicTagOptions = useMemo(() => {
    const customTags = new Set<string>();
    const staticIds = new Set(STATIC_TAG_OPTIONS.map(opt => opt.id));

    jobs.forEach(job => {
      if (job.high_risk_tags) {
        job.high_risk_tags.forEach(tag => {
          // ถ้า Tag นี้ไม่มีอยู่ในเมนูมาตรฐาน ให้เก็บเข้า Set ไว้
          if (!staticIds.has(tag)) {
            customTags.add(tag);
          }
        });
      }
    });

    // แปลง Tag ที่คนพิมพ์เองให้กลายเป็นรูปแบบ Option สำหรับ Dropdown
    const customOptions = Array.from(customTags).map(tag => ({
      id: tag,
      label: tag, // ใช้ชื่อที่พิมพ์มาเป็น label เลย
      icon: Tag   // ใช้ไอคอน Tag มาตรฐาน
    }));

    return [...STATIC_TAG_OPTIONS, ...customOptions];
  }, [jobs]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredJobs = jobs.filter(job => {
    const currentStatus = job.status || 'PENDING';
    const jobTags = job.high_risk_tags || [];
    
    const matchRisk = activeRisk === 'ALL' ? true : activeRisk === 'SIMOPS' ? job.simops : job.riskLevel === activeRisk;
    const matchStatus = statusFilter === 'ALL' ? true : currentStatus === statusFilter;
    const matchTag = tagFilter === 'ALL' ? true : jobTags.includes(tagFilter); 
    
    const query = searchQuery.toLowerCase();
    const matchSearch = job.jsaNo.toLowerCase().includes(query) || 
                        job.jobStep.toLowerCase().includes(query) ||
                        job.area.toLowerCase().includes(query) || 
                        jobTags.some(tag => {
                          const tagLabel = TAG_STYLES[tag] ? TAG_STYLES[tag].label.toLowerCase() : tag.toLowerCase();
                          return tag.toLowerCase().includes(query) || tagLabel.includes(query);
                        });
                        
    return matchRisk && matchSearch && matchStatus && matchTag;
  });

  const getRiskColor = (level: string) => {
    switch (level) { 
      case 'CRITICAL': return '#e11d48'; 
      case 'HIGH': return '#f97316';     
      case 'MEDIUM': return '#fbbf24';   
      case 'LOW': return '#10b981';      
      default: return '#94a3b8';         
    }
  };

  const getStatusDisplay = (status?: string) => {
    switch(status) {
      case 'APPROVED': 
        return { label: 'อนุมัติแล้ว', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 };
      case 'VERIFIED': 
        return { label: 'รออนุมัติ (PM)', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: ShieldCheck };
      default: 
        return { label: 'รอตรวจสอบ (จป.)', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock };
    }
  };

  const currentStatusOption = STATUS_OPTIONS.find(opt => opt.id === statusFilter) || STATUS_OPTIONS[0];
  const CurrentStatusIcon = currentStatusOption.icon;

  // 🌟 ดึงข้อมูล Tag ที่กำลังถูกเลือก จากข้อมูลทั้งหมด (Dynamic)
  const currentTagOption = dynamicTagOptions.find(opt => opt.id === tagFilter) || dynamicTagOptions[0];
  const CurrentTagIcon = currentTagOption.icon;

  const JobTagsDisplay = ({ tags }: { tags?: string[] }) => {
    if (!tags || tags.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {tags.map((tag, idx) => {
          const style = TAG_STYLES[tag] || { ...TAG_STYLES.default, label: tag };
          const Icon = style.icon;
          return (
            <span key={idx} className={`text-[9px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-md border shadow-sm ${style.color}`}>
              <Icon className="w-3 h-3 shrink-0"/> <span className="truncate max-w-[120px]">{style.label}</span>
            </span>
          )
        })}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Kanit:wght@300;400;500;600;700&display=swap');
        .font-hybrid { font-family: 'Inter', 'Kanit', sans-serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-dropdown-scroll::-webkit-scrollbar { width: 4px; }
        .custom-dropdown-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-dropdown-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-dropdown-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      <div className="flex flex-col h-full bg-white relative font-hybrid">
        
        <div className="flex flex-col lg:flex-row justify-between gap-3 p-4 border-b border-slate-200 shrink-0 z-20 bg-white shadow-sm" ref={dropdownRef}>
          
          <div className="flex overflow-x-auto hide-scrollbar gap-2 items-center w-full lg:w-auto snap-x">
            <span className="text-[11px] font-black text-slate-400 mr-1 sm:mr-2 flex items-center gap-1.5 uppercase tracking-widest shrink-0">
              <Filter className="w-3.5 h-3.5"/> Filter
            </span>
            <button onClick={() => setActiveRisk('ALL')} className={`shrink-0 px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all border outline-none ${activeRisk === 'ALL' ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>All</button>
            <button onClick={() => setActiveRisk('CRITICAL')} className={`shrink-0 px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all border outline-none ${activeRisk === 'CRITICAL' ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'}`}>Critical</button>
            <button onClick={() => setActiveRisk('HIGH')} className={`shrink-0 px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all border outline-none ${activeRisk === 'HIGH' ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-orange-50 hover:text-orange-500 hover:border-orange-200'}`}>High</button>
            <button onClick={() => setActiveRisk('SIMOPS')} className={`shrink-0 flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all border outline-none ${activeRisk === 'SIMOPS' ? 'bg-amber-400 text-amber-900 border-amber-400 shadow-md shadow-amber-400/20' : 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50'}`}>
              <Zap className="w-3.5 h-3.5"/> SIMOPS
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto shrink-0">
            
            <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto">
              {/* 🌟 ตัวกรอง Tag */}
              <div className="relative w-full sm:w-auto">
                <button 
                  onClick={() => setOpenDropdown(openDropdown === 'TAG' ? null : 'TAG')}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-[12px] font-bold rounded-xl px-3 py-2.5 outline-none hover:border-slate-300 focus:ring-4 focus:ring-slate-200 transition-all flex items-center justify-between gap-2 min-w-[140px]"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <CurrentTagIcon className={`w-3.5 h-3.5 shrink-0 ${tagFilter === 'ALL' ? 'text-slate-400' : 'text-sky-600'}`} />
                    <span className="truncate">{currentTagOption.label}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${openDropdown === 'TAG' ? 'rotate-180' : ''}`} />
                </button>

                {openDropdown === 'TAG' && (
                  <div className="absolute left-0 top-full mt-1.5 w-[200px] max-h-[220px] overflow-y-auto custom-dropdown-scroll bg-white border border-slate-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-[100] p-1.5 animate-in fade-in zoom-in-95 duration-200 overscroll-contain">
                    {/* 🌟 ใช้ dynamicTagOptions แทน STATIC เพื่อให้มีอันที่พิมพ์เองด้วย */}
                    {dynamicTagOptions.map((opt, index) => {
                      const Icon = opt.icon;
                      const isSelected = tagFilter === opt.id;
                      
                      // ถ้าเป็น Tag ที่เพิ่มมาใหม่ (Custom) ให้มีเส้นคั่นด้านบนหน่อย
                      const isCustomTag = index >= STATIC_TAG_OPTIONS.length;
                      const isFirstCustomTag = index === STATIC_TAG_OPTIONS.length;

                      return (
                        <div key={opt.id}>
                          {isFirstCustomTag && <div className="my-1.5 mx-2 h-px bg-slate-100"></div>}
                          <button
                            onClick={() => { setTagFilter(opt.id); setOpenDropdown(null); }}
                            className={`w-full text-left px-3 py-2.5 text-[12px] font-bold flex items-center gap-2.5 rounded-lg transition-colors outline-none ${isSelected ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                          >
                            <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} /> 
                            <span className="truncate">{opt.label}</span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* 🌟 ตัวกรอง Status */}
              <div className="relative w-full sm:w-auto">
                <button 
                  onClick={() => setOpenDropdown(openDropdown === 'STATUS' ? null : 'STATUS')}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-[12px] font-bold rounded-xl px-3 py-2.5 outline-none hover:border-slate-300 focus:ring-4 focus:ring-slate-200 transition-all flex items-center justify-between gap-2 min-w-[140px]"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <CurrentStatusIcon className={`w-3.5 h-3.5 shrink-0 ${statusFilter === 'ALL' ? 'text-slate-400' : 'text-indigo-600'}`} />
                    <span className="truncate">{currentStatusOption.label}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${openDropdown === 'STATUS' ? 'rotate-180' : ''}`} />
                </button>

                {openDropdown === 'STATUS' && (
                  <div className="absolute right-0 sm:left-0 top-full mt-1.5 w-[180px] max-h-[160px] overflow-y-auto custom-dropdown-scroll bg-white border border-slate-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-[100] p-1.5 animate-in fade-in zoom-in-95 duration-200 overscroll-contain">
                    {STATUS_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = statusFilter === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => { setStatusFilter(opt.id); setOpenDropdown(null); }}
                          className={`w-full text-left px-3 py-2.5 text-[12px] font-bold flex items-center gap-2.5 rounded-lg transition-colors outline-none ${isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} /> 
                          <span className="truncate">{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="relative w-full sm:w-[200px] xl:w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="ค้นหารหัส หรือชื่องาน..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 text-[13px] border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50 hover:bg-white text-slate-800 font-medium placeholder-slate-400"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/50 md:bg-white custom-scrollbar relative">
          
          {filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Search className="w-8 h-8 text-slate-300"/></div>
              <p className="text-slate-500 font-bold text-sm">ไม่พบข้อมูลที่ค้นหา</p>
              <p className="text-slate-400 text-xs mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองด้านบน</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block w-full overflow-x-auto pb-8">
                <table className="w-full text-left text-sm whitespace-nowrap min-w-[1000px]">
                  <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-md border-b border-slate-200 z-10">
                    <tr>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-32">JSA No.</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Job Details</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center w-36">Status</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center w-28">Risk Level</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Hazards Alert</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center w-32">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredJobs.map((job) => {
                      const StatusInfo = getStatusDisplay(job.status);
                      const StatusIcon = StatusInfo.icon;
                      
                      return (
                        <tr key={job.id} onClick={() => onSelectJob && onSelectJob(job)} className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                          
                          <td className="px-6 py-5 font-black text-slate-800 text-[13px]">{job.jsaNo}</td>
                          
                          <td className="px-6 py-5">
                            <div className="text-slate-800 font-bold mb-1.5 text-[13px] whitespace-normal line-clamp-2 leading-snug max-w-[280px]">{job.jobStep}</div>
                            <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5 bg-indigo-50 border border-indigo-100/50 w-max px-2.5 py-0.5 rounded-md">
                              <MapPin className="w-3 h-3"/> {job.area}
                            </div>
                            <JobTagsDisplay tags={job.high_risk_tags} />
                          </td>

                          <td className="px-6 py-5 text-center">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${StatusInfo.bg} ${StatusInfo.border} ${StatusInfo.text} text-[11px] font-bold w-max mx-auto shadow-sm`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {StatusInfo.label}
                            </div>
                          </td>

                          <td className="px-6 py-5 text-center">
                            <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-[8px] text-[10px] font-black text-white shadow-sm w-[90px] tracking-wide" style={{ backgroundColor: getRiskColor(job.riskLevel) }}>
                              {job.riskLevel}
                            </div>
                          </td>
                          
                          <td className="px-6 py-5">
                            <div className="text-slate-600 font-medium text-[12px] mb-1.5 flex items-center gap-1.5">
                              <Shield className="w-4 h-4 text-slate-400 shrink-0"/> <span className="truncate max-w-[200px] xl:max-w-[280px]">{job.potentialHazard}</span>
                            </div>
                            {job.simops && (
                              <div className="text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-[10px] inline-flex items-center gap-1.5 font-bold shadow-sm">
                                <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0"/> {job.simopsDetail}
                              </div>
                            )}
                          </td>
                          
                          <td className="px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}> 
                            <button onClick={() => onFocusJob(job.lat, job.lng)} className="bg-white border border-slate-200 text-slate-600 hover:border-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-sm transition-all active:scale-95 flex items-center gap-1.5 mx-auto outline-none">
                              <MapIcon className="w-3.5 h-3.5" /> Locate
                            </button>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden flex flex-col p-4 gap-4 pb-10">
                {filteredJobs.map((job) => {
                  const StatusInfo = getStatusDisplay(job.status);
                  const StatusIcon = StatusInfo.icon;

                  return (
                    <div key={job.id} onClick={() => onSelectJob && onSelectJob(job)} className="bg-white p-4 sm:p-5 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-slate-200 flex flex-col gap-4 active:scale-[0.98] transition-transform">
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">JSA No.</span>
                          <div className="font-black text-slate-800 text-[16px]">{job.jsaNo}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="inline-flex items-center justify-center px-3 py-1 rounded-[6px] text-[10px] font-black text-white shadow-sm tracking-wide" style={{ backgroundColor: getRiskColor(job.riskLevel) }}>
                            {job.riskLevel}
                          </div>
                          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border ${StatusInfo.bg} ${StatusInfo.border} ${StatusInfo.text} text-[10px] font-bold shadow-sm`}>
                            <StatusIcon className="w-3 h-3" /> {StatusInfo.label}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-800 font-bold text-[14px] leading-snug whitespace-normal line-clamp-2">{job.jobStep}</div>
                        <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5 mt-2 bg-indigo-50 border border-indigo-100/50 w-max px-2.5 py-1 rounded-md">
                          <MapPin className="w-3.5 h-3.5"/> {job.area}
                        </div>
                        <JobTagsDisplay tags={job.high_risk_tags} />
                      </div>

                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                        <div className="text-slate-600 font-medium text-[12px] flex items-start gap-2 whitespace-normal leading-relaxed">
                          <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5"/> 
                          <span className="line-clamp-2">{job.potentialHazard}</span>
                        </div>
                        {job.simops && (
                          <div className="text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5 font-bold shadow-sm mt-3 w-max">
                            <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0"/> ตรวจพบ SIMOPS
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={(e) => { e.stopPropagation(); onFocusJob(job.lat, job.lng); }} 
                        className="w-full bg-slate-50 border border-slate-200 text-slate-600 hover:border-blue-600 hover:bg-blue-600 hover:text-white py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2 outline-none mt-1 shadow-sm"
                      >
                        <MapIcon className="w-4 h-4" /> Locate on Map
                      </button>

                    </div>
                  );
                })}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}