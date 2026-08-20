// src/components/DashboardOverview.tsx
import { useMemo, useState, useRef, useEffect } from 'react';
import { 
  Activity, Calendar, CheckCircle2, ShieldAlert, Zap, ArrowUpRight, 
  Clock, ShieldCheck, X, MapPin, AlertTriangle, FileCheck2, Filter,
  ArrowUpCircle, Flame, Archive, Anchor, Hammer, FlaskConical, Cog, Trash2, Tag, ChevronRight, Eye, ChevronDown, BarChart3, Target
} from 'lucide-react';
import type { JsaData } from '../types/jsa';

interface DashboardOverviewProps {
  jobs: JsaData[];
  onMitigate: (id: string) => void;
  onExport: () => void; 
  onViewJsaDetail?: (job: JsaData) => void; 
}

const TAG_STYLES: Record<string, { label: string, icon: any, color: string, bg: string, text: string, bar: string }> = {
  'height': { label: 'งานที่สูง', icon: ArrowUpCircle, color: 'border-sky-200', bg: 'bg-sky-50', text: 'text-sky-700', bar: 'bg-sky-500' },
  'hotwork': { label: 'งานความร้อน', icon: Flame, color: 'border-rose-200', bg: 'bg-rose-50', text: 'text-rose-700', bar: 'bg-rose-500' },
  'confined': { label: 'งานอับอากาศ', icon: Archive, color: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-500' },
  'electrical': { label: 'งานไฟฟ้า', icon: Zap, color: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-500' },
  'lifting': { label: 'งานยก/ปั้นจั่น', icon: Anchor, color: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500' },
  'excavation': { label: 'งานขุดเจาะ', icon: Hammer, color: 'border-stone-200', bg: 'bg-stone-50', text: 'text-stone-700', bar: 'bg-stone-500' },
  'chemical': { label: 'งานสารเคมี', icon: FlaskConical, color: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  'machinery': { label: 'งานเครื่องจักร', icon: Cog, color: 'border-indigo-200', bg: 'bg-indigo-50', text: 'text-indigo-700', bar: 'bg-indigo-500' },
  'demolition': { label: 'งานรื้อถอน', icon: Trash2, color: 'border-red-200', bg: 'bg-red-50', text: 'text-red-700', bar: 'bg-red-500' },
  'default': { label: 'แท็กอื่นๆ', icon: Tag, color: 'border-slate-200', bg: 'bg-slate-50', text: 'text-slate-700', bar: 'bg-slate-400' }
};

const TIME_OPTIONS = [
  { id: 'TODAY', label: 'วันนี้ (Today)' },
  { id: 'WEEK', label: 'สัปดาห์นี้ (This Week)' },
  { id: 'MONTH', label: 'เดือนนี้ (This Month)' },
  { id: 'ALL', label: 'ทั้งหมด (All Time)' },
];

export default function DashboardOverview({ jobs, onMitigate, onExport, onViewJsaDetail }: DashboardOverviewProps) {
  const [mitigateTarget, setMitigateTarget] = useState<JsaData | null>(null);
  const [listModal, setListModal] = useState<{ title: string, icon: any, colorClass: string, jobs: JsaData[] } | null>(null);

  const [timeFilter, setTimeFilter] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('ALL');
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTimeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredJobsByTime = useMemo(() => {
    if (timeFilter === 'ALL') return jobs;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return jobs.filter(job => {
      const jobDateRaw = job.created_at || (job as any).createdAt || new Date().toISOString();
      const jobDate = new Date(jobDateRaw);

      if (timeFilter === 'TODAY') return jobDate >= today;
      if (timeFilter === 'WEEK') {
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        return jobDate >= lastWeek;
      }
      if (timeFilter === 'MONTH') {
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return jobDate >= firstDayOfMonth;
      }
      return true;
    });
  }, [jobs, timeFilter]);

  const analytics = useMemo(() => {
    const critical = filteredJobsByTime.filter(j => j.riskLevel === 'CRITICAL').length;
    const high = filteredJobsByTime.filter(j => j.riskLevel === 'HIGH').length;
    const medium = filteredJobsByTime.filter(j => j.riskLevel === 'MEDIUM').length;
    const low = filteredJobsByTime.filter(j => j.riskLevel === 'LOW').length;
    const simops = filteredJobsByTime.filter(j => j.simops);
    
    const pending = filteredJobsByTime.filter(j => !j.status || j.status === 'PENDING').length;
    const verified = filteredJobsByTime.filter(j => j.status === 'VERIFIED').length;
    const approved = filteredJobsByTime.filter(j => j.status === 'APPROVED').length;

    const tagsCount: Record<string, number> = {};
    filteredJobsByTime.forEach(job => {
      if (job.high_risk_tags) {
        job.high_risk_tags.forEach(tag => {
          tagsCount[tag] = (tagsCount[tag] || 0) + 1;
        });
      }
    });
    const topTags = Object.entries(tagsCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxTagCount = topTags.length > 0 ? Math.max(...topTags.map(t => t[1])) : 1;

    const zonesCount: Record<string, number> = {};
    filteredJobsByTime.forEach(job => {
      zonesCount[job.area] = (zonesCount[job.area] || 0) + 1;
    });
    const topZones = Object.entries(zonesCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxZoneCount = topZones.length > 0 ? Math.max(...topZones.map(z => z[1])) : 1;

    // 🌟 คำนวณอัตราความสำเร็จ (Compliance Rate)
    const complianceRate = filteredJobsByTime.length > 0 
      ? Math.round((approved / filteredJobsByTime.length) * 100) 
      : 0;

    return { 
      total: filteredJobsByTime.length, critical, high, medium, low, simops, simopsCount: simops.length,
      pending, verified, approved, complianceRate, topTags, maxTagCount, topZones, maxZoneCount
    };
  }, [filteredJobsByTime]);

  const riskDistribution = [
    { label: 'CRITICAL', count: analytics.critical, color: 'bg-rose-500', text: 'text-rose-500' },
    { label: 'HIGH', count: analytics.high, color: 'bg-orange-500', text: 'text-orange-500' },
    { label: 'MEDIUM', count: analytics.medium, color: 'bg-amber-400', text: 'text-amber-500' },
    { label: 'LOW', count: analytics.low, color: 'bg-emerald-500', text: 'text-emerald-500' },
  ];
  
  const maxRiskCount = Math.max(...riskDistribution.map(r => r.count), 1); 

  const handleConfirmMitigate = () => {
    if (mitigateTarget) {
      onMitigate(mitigateTarget.id);
      setMitigateTarget(null);
    }
  };

  const getRiskBg = (level: string) => {
    switch(level) {
      case 'CRITICAL': return 'bg-rose-600';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-amber-500';
      case 'LOW': return 'bg-emerald-500';
      default: return 'bg-slate-500';
    }
  };

  const currentTimeOption = TIME_OPTIONS.find(opt => opt.id === timeFilter) || TIME_OPTIONS[3];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Kanit:wght@300;400;500;600;700&display=swap');
        .font-hybrid { font-family: 'Inter', 'Kanit', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-8 custom-scrollbar relative font-hybrid">
        
        {/* ========================================== */}
        {/* 🚀 MODAL: แสดงรายการงานเมื่อกดดูจาก Dashboard */}
        {/* ========================================== */}
        {listModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in p-4 font-hybrid">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
              
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    <listModal.icon className={`w-5 h-5 ${listModal.colorClass}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 leading-tight truncate max-w-[220px] sm:max-w-[300px]">{listModal.title}</h3>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">พบทั้งหมด {listModal.jobs.length} รายการ</p>
                  </div>
                </div>
                <button onClick={() => setListModal(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors outline-none shrink-0">
                  <X className="w-5 h-5"/>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/30">
                {listModal.jobs.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 font-medium text-sm">ไม่พบรายการงานในหมวดหมู่นี้</div>
                ) : listModal.jobs.map(job => (
                  <div 
                    key={job.id} 
                    onClick={() => { 
                      if (onViewJsaDetail) { 
                        onViewJsaDetail(job); 
                        setListModal(null); 
                      } 
                    }}
                    className="bg-white border border-slate-200 hover:border-indigo-300 p-4 rounded-xl cursor-pointer transition-all hover:shadow-md active:scale-[0.98] group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{job.jsaNo}</span>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg text-white shadow-sm ${getRiskBg(job.riskLevel)}`}>
                        {job.riskLevel}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug mb-3 group-hover:text-indigo-700 transition-colors">
                      {job.jobStep}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400"/>
                        <span className="truncate max-w-[180px]">{job.area}</span>
                      </div>
                      <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-3 h-3" /> เปิดดู
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* 🔴 Mitigation Modal */}
        {mitigateTarget && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in p-4">
            <div className="bg-white rounded-[24px] shadow-2xl p-5 md:p-6 w-full max-w-md border border-slate-100 animate-in zoom-in-95">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
                </div>
                <button onClick={() => setMitigateTarget(null)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors"><X className="w-5 h-5"/></button>
              </div>
              <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2">บันทึกการควบคุมมาตรการ</h3>
              <p className="text-xs md:text-sm text-slate-600 mb-4 leading-relaxed">
                ยืนยันการเข้าตรวจสอบและควบคุมเงื่อนไข SIMOPS สำหรับงาน <strong>{mitigateTarget.jobStep}</strong> ตามมาตรการที่ระบุไว้
              </p>
              <div className="bg-slate-50 p-3.5 rounded-xl mb-6 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <p><span className="font-bold text-slate-800">JSA No:</span> {mitigateTarget.jsaNo}</p>
                <p className="flex items-start gap-1"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-500"/> {mitigateTarget.area}</p>
              </div>
              <div className="flex gap-2 md:gap-3">
                <button onClick={() => setMitigateTarget(null)} className="flex-1 px-3 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 text-sm transition-colors">ยกเลิก</button>
                <button onClick={handleConfirmMitigate} className="flex-1 px-3 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md flex justify-center items-center gap-2 text-sm transition-all active:scale-95">
                  <CheckCircle2 className="w-4 h-4"/> ยืนยันควบคุมแล้ว
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🟢 Header Section & Time Filter */}
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mb-1">HSE Command Center</h2>
            <p className="text-xs md:text-sm font-medium text-slate-500">แดชบอร์ดศูนย์กลางวิเคราะห์ความปลอดภัยโครงการ</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full md:w-auto z-40">
            
            {/* 🌟 Dropdown ตัวกรองเวลา */}
            <div className="relative w-full sm:w-auto" ref={dropdownRef}>
              <button 
                onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                className="w-full sm:w-auto bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl md:rounded-full text-xs md:text-sm font-bold shadow-sm justify-between sm:justify-center flex items-center gap-2 transition-colors outline-none"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500"/> 
                  {currentTimeOption.label}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isTimeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isTimeDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-[200px] bg-white border border-slate-100 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-200">
                  {TIME_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => { setTimeFilter(opt.id as any); setIsTimeDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-3 text-[13px] font-bold rounded-lg transition-colors outline-none flex items-center justify-between ${timeFilter === opt.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                      {opt.label}
                      {timeFilter === opt.id && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={onExport} className="bg-[#0f3f2b] hover:bg-[#0a2e1f] w-full sm:w-auto text-white px-5 py-2.5 rounded-xl md:rounded-full text-xs md:text-sm font-bold shadow-md justify-center flex items-center gap-2 transition-all active:scale-95 outline-none">
              <FileCheck2 className="w-4 h-4" /> Export Report
            </button>
          </div>
        </div>

        {/* 🟢 1. Top KPI Cards (Professional Metrics) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 p-5 md:p-6 rounded-[24px] shadow-md relative overflow-hidden text-white flex flex-col justify-between min-h-[140px] md:h-[150px]">
            <div className="absolute -right-4 -top-4 p-4 opacity-10"><Activity className="w-24 h-24 md:w-32 md:h-32"/></div>
            <div className="relative z-10 flex justify-between items-start">
              <span className="text-xs md:text-sm font-bold text-slate-300 uppercase tracking-wider">Total Active Jobs</span>
              <div className="bg-white/10 p-1.5 md:p-2 rounded-full"><BarChart3 className="w-3 h-3 md:w-4 md:h-4 text-slate-300"/></div>
            </div>
            <div className="relative z-10">
              <div className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-1">{analytics.total}</div>
            </div>
          </div>

          {[
            { title: 'Safety Compliance', count: `${analytics.complianceRate}%`, icon: Target, color: 'emerald', bgIcon: 'bg-emerald-50', textIcon: 'text-emerald-500', desc: 'Approved Tasks' },
            { title: 'Critical Risk', count: analytics.critical, icon: ShieldAlert, color: 'rose', bgIcon: 'bg-rose-50', textIcon: 'text-rose-500', desc: 'Require monitoring' },
            { title: 'SIMOPS Active', count: analytics.simopsCount, icon: Zap, color: 'amber', bgIcon: 'bg-amber-50', textIcon: 'text-amber-500', desc: 'Overlapping zones' },
          ].map((card, idx) => (
            <div key={idx} className="bg-white p-5 md:p-6 rounded-[24px] border border-slate-200 shadow-sm flex flex-col justify-between min-h-[140px] md:h-[150px] hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start gap-2">
                <span className="text-[10px] md:text-xs lg:text-sm font-bold text-slate-500 uppercase tracking-wider leading-tight">{card.title}</span>
                <div className={`${card.bgIcon} p-1.5 md:p-2 rounded-full shrink-0`}><card.icon className={`w-3 h-3 md:w-4 md:h-4 ${card.textIcon}`}/></div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl lg:text-5xl font-black text-slate-800 tracking-tighter">{card.count}</div>
                <div className="text-[10px] md:text-xs font-semibold text-slate-400 mt-1">{card.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 🟢 2. Middle Section (Charts & Funnel) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
          
          {/* Risk Level Distribution */}
          <div className="bg-white p-5 md:p-7 rounded-[24px] border border-slate-200 shadow-sm lg:col-span-1 flex flex-col h-full min-h-[300px]">
            <div className="mb-6 md:mb-8">
              <h3 className="text-base md:text-lg font-black text-slate-800">Risk Profile</h3>
              <p className="text-[10px] md:text-xs font-medium text-slate-500 mt-0.5">กระจายตัวตามระดับความเสี่ยง</p>
            </div>
            
            <div className="flex-1 flex items-end justify-around gap-2 px-2">
              {riskDistribution.map((risk) => {
                const heightPercent = analytics.total === 0 ? 0 : (risk.count / maxRiskCount) * 100;
                return (
                  <div key={risk.label} className="flex flex-col items-center gap-3 flex-1 group">
                    <div className="w-full max-w-[24px] md:max-w-[40px] bg-slate-50 rounded-t-xl h-32 md:h-48 relative flex items-end border-b-2 border-slate-100">
                      <div 
                        className={`w-full rounded-t-xl transition-all duration-700 ease-out ${risk.color}`} 
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] md:text-xs font-bold px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                        {risk.count} Tasks
                      </div>
                    </div>
                    <div className="text-center">
                      <span className={`block text-[8px] md:text-[10px] font-black tracking-wider ${risk.text}`}>{risk.label}</span>
                      <span className="text-sm md:text-base font-black text-slate-800">{risk.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workflow Pipeline (Stacked Bar & Actions) */}
          <div className="bg-white p-5 md:p-7 rounded-[24px] border border-slate-200 shadow-sm lg:col-span-2 flex flex-col justify-between h-full min-h-[300px]">
            <div className="mb-4">
              <h3 className="text-base md:text-lg font-black text-slate-800 flex items-center gap-2">
                Approval Workflow Pipeline
              </h3>
              <p className="text-[10px] md:text-xs font-medium text-slate-500 mt-0.5">ติดตามคอขวด (Bottleneck) ของกระบวนการอนุมัติ</p>
            </div>
            
            {/* Stacked Progress Bar */}
            <div className="mb-8 mt-2">
              <div className="w-full h-4 md:h-6 bg-slate-100 rounded-full flex overflow-hidden shadow-inner">
                {analytics.total > 0 && (
                  <>
                    <div style={{ width: `${(analytics.pending / analytics.total) * 100}%` }} className="bg-amber-400 transition-all duration-500" title={`Pending: ${analytics.pending}`}></div>
                    <div style={{ width: `${(analytics.verified / analytics.total) * 100}%` }} className="bg-blue-500 transition-all duration-500" title={`Verified: ${analytics.verified}`}></div>
                    <div style={{ width: `${(analytics.approved / analytics.total) * 100}%` }} className="bg-emerald-500 transition-all duration-500" title={`Approved: ${analytics.approved}`}></div>
                  </>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 flex-1">
              <div 
                onClick={() => setListModal({ title: 'งานที่รอ จป. ตรวจสอบ', icon: Clock, colorClass: 'text-amber-600', jobs: filteredJobsByTime.filter(j => !j.status || j.status === 'PENDING') })}
                className="flex flex-col p-4 bg-amber-50/50 hover:bg-amber-50 border border-amber-100/50 hover:border-amber-200 rounded-2xl transition-colors cursor-pointer group"
              >
                 <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Clock className="w-4 h-4" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
                 <span className="text-[11px] md:text-xs font-bold text-amber-900 uppercase tracking-wide">รอตรวจสอบ (จป.)</span>
                 <span className="text-2xl md:text-3xl font-black text-amber-600 mt-1">{analytics.pending}</span>
              </div>

              <div 
                onClick={() => setListModal({ title: 'งานที่รอ PM อนุมัติ', icon: ShieldCheck, colorClass: 'text-blue-600', jobs: filteredJobsByTime.filter(j => j.status === 'VERIFIED') })}
                className="flex flex-col p-4 bg-blue-50/50 hover:bg-blue-50 border border-blue-100/50 hover:border-blue-200 rounded-2xl transition-colors cursor-pointer group"
              >
                 <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
                 <span className="text-[11px] md:text-xs font-bold text-blue-900 uppercase tracking-wide">รออนุมัติ (PM)</span>
                 <span className="text-2xl md:text-3xl font-black text-blue-600 mt-1">{analytics.verified}</span>
              </div>

              <div 
                onClick={() => setListModal({ title: 'งานที่อนุมัติแล้ว', icon: CheckCircle2, colorClass: 'text-emerald-600', jobs: filteredJobsByTime.filter(j => j.status === 'APPROVED') })}
                className="flex flex-col p-4 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100/50 hover:border-emerald-200 rounded-2xl transition-colors cursor-pointer group"
              >
                 <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
                 <span className="text-[11px] md:text-xs font-bold text-emerald-900 uppercase tracking-wide">อนุมัติสำเร็จ</span>
                 <span className="text-2xl md:text-3xl font-black text-emerald-600 mt-1">{analytics.approved}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 🟢 3. Actionable Insights (Horizontal Bar Charts) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          
          {/* Top High-Risk Activities */}
          <div className="bg-white p-5 md:p-6 rounded-[24px] border border-slate-200 shadow-sm flex flex-col">
            <div className="mb-4">
              <h3 className="text-base md:text-lg font-black text-slate-800">Top High-Risk Activities</h3>
              <p className="text-[10px] md:text-xs font-medium text-slate-500 mt-0.5">ประเภทงานเสี่ยงที่พบมากที่สุด (จำแนกตาม TAGS)</p>
            </div>
            <div className="flex-1 flex flex-col gap-4">
              {analytics.topTags.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-[11px] md:text-xs font-medium text-slate-400 italic bg-slate-50 rounded-xl">ไม่มีข้อมูลประเภทงานในช่วงเวลานี้</div>
              ) : (
                analytics.topTags.map(([tag, count], idx) => {
                  const style = TAG_STYLES[tag] || { ...TAG_STYLES.default, label: tag };
                  const Icon = style.icon;
                  return (
                    <div key={idx} onClick={() => setListModal({ title: `ประเภทงาน: ${style.label}`, icon: Icon, colorClass: style.text.replace('text-', 'text-'), jobs: filteredJobsByTime.filter(j => j.high_risk_tags?.includes(tag)) })} className="cursor-pointer group">
                      <div className="flex justify-between items-end mb-1">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${style.text}`} />
                          <span className="text-xs md:text-sm font-bold text-slate-700">{style.label}</span>
                        </div>
                        <span className="text-xs font-black text-slate-800">{count}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 md:h-2.5 rounded-full overflow-hidden">
                        <div className={`h-full ${style.bar} transition-all duration-700 ease-out`} style={{ width: `${(count / analytics.maxTagCount) * 100}%` }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Top Active Zones */}
          <div className="bg-white p-5 md:p-6 rounded-[24px] border border-slate-200 shadow-sm flex flex-col">
            <div className="mb-4">
              <h3 className="text-base md:text-lg font-black text-slate-800">Most Active Project Zones</h3>
              <p className="text-[10px] md:text-xs font-medium text-slate-500 mt-0.5">โซนปฏิบัติงานที่มีกิจกรรมความเสี่ยงหนาแน่นที่สุด</p>
            </div>
            <div className="flex-1 flex flex-col gap-4">
              {analytics.topZones.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-[11px] md:text-xs font-medium text-slate-400 italic bg-slate-50 rounded-xl">ยังไม่มีการระบุโซนในช่วงเวลานี้</div>
              ) : (
                analytics.topZones.map(([zone, count], idx) => (
                  <div key={idx} onClick={() => setListModal({ title: `พื้นที่: ${zone}`, icon: MapPin, colorClass: 'text-indigo-600', jobs: filteredJobsByTime.filter(j => j.area === zone) })} className="cursor-pointer group">
                    <div className="flex justify-between items-end mb-1">
                      <div className="flex items-center gap-2 truncate pr-4">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="text-xs md:text-sm font-bold text-slate-700 truncate">{zone}</span>
                      </div>
                      <span className="text-xs font-black text-slate-800 shrink-0">{count}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 md:h-2.5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 transition-all duration-700 ease-out" style={{ width: `${(count / analytics.maxZoneCount) * 100}%` }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* 🟢 4. Action Required List (SIMOPS) */}
        <div className="bg-white p-5 md:p-7 rounded-[24px] border border-slate-200 shadow-sm mb-8 border-l-4 border-l-rose-500">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <div>
              <h3 className="text-base md:text-lg font-black text-slate-800 flex items-center gap-2">
                Immediate Action Required <span className="hidden sm:inline text-rose-500">(SIMOPS Conflicts)</span>
              </h3>
              <p className="text-[10px] md:text-xs font-medium text-slate-500 mt-0.5">พื้นที่ปฏิบัติงานทับซ้อนอันตรายที่ต้องเข้าควบคุมทันที</p>
            </div>
            <span className={`text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${analytics.simopsCount > 0 ? 'bg-rose-100 text-rose-600 border border-rose-200 shadow-sm' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
              {analytics.simopsCount} SIMOPS
            </span>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4">
            {analytics.simops.length === 0 ? (
               <div className="col-span-full h-28 md:h-32 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                 <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 mb-2 text-emerald-400"/>
                 <p className="text-xs md:text-sm font-bold text-slate-500">หน้างานปลอดภัย ไม่มีพื้นที่ปฏิบัติงานทับซ้อน</p>
               </div>
            ) : analytics.simops.map(job => (
              <div key={job.id} className="flex flex-col p-4 bg-rose-50/50 rounded-2xl border border-rose-100 gap-3 hover:bg-rose-50 transition-colors shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-1 shadow-sm border border-amber-200">
                    <Zap className="w-5 h-5 text-amber-600 animate-[pulse_1.5s_ease-in-out_infinite]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black uppercase bg-white border border-rose-200 text-rose-600 px-1.5 py-0.5 rounded shadow-sm">{job.jsaNo}</span>
                      <h4 className="text-xs md:text-sm font-black text-slate-800 truncate">{job.jobStep}</h4>
                    </div>
                    <p className="text-[10px] md:text-xs font-medium text-slate-600 flex items-start gap-1.5 mb-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-400"/>
                      <span className="line-clamp-1">{job.area}</span>
                    </p>
                    <p className="text-[10px] md:text-xs font-medium text-rose-600 flex items-start gap-1.5 bg-rose-50/50 w-max px-2 py-1 rounded-lg border border-rose-100/50">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5"/>
                      <span className="line-clamp-1">{job.simopsDetail || 'ตรวจพบความเสี่ยงทับซ้อนรุนแรง'}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => setMitigateTarget(job)} className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-3 rounded-xl transition-all active:scale-95 shadow-md mt-1 outline-none">
                  เข้าควบคุมและตรวจสอบพื้นที่ (Mitigate)
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}