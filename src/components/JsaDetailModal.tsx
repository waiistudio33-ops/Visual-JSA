// src/components/JsaDetailModal.tsx
import { useState, useEffect } from 'react';
import { 
  X, MapPin, AlertTriangle, ShieldCheck, Clock, CheckCircle2, 
  Zap, Wrench, Calendar, History, User, Activity, Flame, Archive, Cog, ArrowUpCircle
} from 'lucide-react';
import type { JsaData } from '../types/jsa';
import { supabase } from '../lib/supabase';

// 🌟 ระบบไอคอนและสีสำหรับ Tag ประเภทงาน
const TAG_STYLES: Record<string, { label: string, icon: any, color: string }> = {
  'height': { label: 'งานที่สูง', icon: ArrowUpCircle, color: 'text-sky-700 bg-sky-100 border-sky-200' },
  'hotwork': { label: 'งานความร้อน', icon: Flame, color: 'text-rose-700 bg-rose-100 border-rose-200' },
  'confined': { label: 'งานอับอากาศ', icon: Archive, color: 'text-purple-700 bg-purple-100 border-purple-200' },
  'electrical': { label: 'งานไฟฟ้า', icon: Zap, color: 'text-amber-700 bg-amber-100 border-amber-200' },
  'default': { label: 'งานเสี่ยง', icon: Cog, color: 'text-slate-700 bg-slate-100 border-slate-200' }
};

interface ExtendedJsaData extends JsaData {
  likelihood?: number;
  severity?: number;
  risk_score?: number;
  verification?: string;
  residual_likelihood?: number;
  residual_severity?: number;
  residual_risk_score?: number;
}

interface JsaDetailModalProps {
  job: ExtendedJsaData;
  onClose: () => void;
  currentUser?: any;
  onUpdateStatus?: (id: string, newStatus: string) => void;
}

export default function JsaDetailModal({ job, onClose, currentUser, onUpdateStatus }: JsaDetailModalProps) {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('jsa_audit_logs')
        .select('*')
        .eq('jsa_id', job.id)
        .order('created_at', { ascending: false });
      if (data) setLogs(data);
    };
    fetchLogs();
  }, [job.id]);

  const getStepStatus = (step: 'MAKER' | 'CHECKER' | 'APPROVER') => {
    const s = job.status || 'PENDING';
    if (step === 'MAKER') return 'completed';
    if (step === 'CHECKER') {
      if (s === 'VERIFIED' || s === 'APPROVED') return 'completed';
      if (s === 'PENDING') return 'current';
    }
    if (step === 'APPROVER') {
      if (s === 'APPROVED') return 'completed';
      if (s === 'VERIFIED') return 'current';
    }
    return 'waiting';
  };

  const getStatusBadge = () => {
    if (job.status === 'APPROVED') return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5"/> อนุมัติแล้ว</span>;
    if (job.status === 'VERIFIED') return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-blue-200"><ShieldCheck className="w-3.5 h-3.5"/> รออนุมัติ (PM)</span>;
    return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-amber-200"><Clock className="w-3.5 h-3.5"/> รอตรวจสอบ (จป.)</span>;
  };

  // 🌟 ฟังก์ชันอัจฉริยะ (Smart Risk Level) ตรวจสอบจาก Matrix 2D
  const getRiskLevelInfo = (l?: number, s?: number, fallbackScore?: number) => {
    let calcLevel = 'LOW';
    const finalScore = fallbackScore || (l && s ? l * s : 0);
    
    if (!finalScore) return { text: 'N/A', color: 'bg-slate-200 text-slate-500' };

    // ถ้ามีค่า L, S ครบ ถอดรหัสจากตารางเลย
    if (l && s && l >= 1 && l <= 5 && s >= 1 && s <= 5) {
      const riskMatrix = [
        ['LOW', 'LOW', 'MEDIUM', 'MEDIUM', 'HIGH'],          // แถว L=1
        ['LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'HIGH'],         // แถว L=2
        ['LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'CRITICAL'],     // แถว L=3
        ['MEDIUM', 'MEDIUM', 'HIGH', 'HIGH', 'CRITICAL'],    // แถว L=4
        ['MEDIUM', 'HIGH', 'HIGH', 'CRITICAL', 'CRITICAL']   // แถว L=5
      ];
      calcLevel = riskMatrix[l - 1][s - 1];
    } else {
      // เผื่อระบบเก่าไม่มี L, S ให้เช็คจากคะแนนรวมแทน
      if (finalScore >= 15) calcLevel = 'CRITICAL';
      else if (finalScore >= 10) calcLevel = 'HIGH';
      else if (finalScore >= 5) calcLevel = 'MEDIUM';
      else calcLevel = 'LOW';
    }

    if (calcLevel === 'CRITICAL' || calcLevel === 'EXTREME') return { text: 'EXTREME', color: 'bg-rose-600 text-white' };
    if (calcLevel === 'HIGH') return { text: 'HIGH', color: 'bg-orange-500 text-white' };
    if (calcLevel === 'MEDIUM') return { text: 'MEDIUM', color: 'bg-amber-400 text-amber-900' };
    return { text: 'LOW', color: 'bg-emerald-500 text-white' };
  };

  const initialRisk = getRiskLevelInfo(job.likelihood, job.severity, job.risk_score || job.initialRisk);
  const residualRisk = getRiskLevelInfo(job.residual_likelihood, job.residual_severity, job.residual_risk_score);
  
  const initialScoreDisplay = job.risk_score || job.initialRisk || (job.likelihood && job.severity ? job.likelihood * job.severity : '-');
  const residualScoreDisplay = job.residual_risk_score || (job.residual_likelihood && job.residual_severity ? job.residual_likelihood * job.residual_severity : '-');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-300 font-hybrid">
      <div className="bg-slate-50 rounded-2xl sm:rounded-[32px] w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* 1. Header (Sticky) */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-20 px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100 shrink-0 shadow-sm">
          <button onClick={onClose} className="absolute right-4 top-4 sm:right-6 sm:top-6 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors outline-none">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3 pr-10">
            <span className="bg-slate-800 text-white px-3 py-1 rounded-lg text-xs sm:text-sm font-black tracking-wider shadow-sm">{job.jsaNo}</span>
            {getStatusBadge()}
            {job.riskLevel && (
              <span className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-black shadow-sm ${initialRisk.color}`}>
                ความเสี่ยง: {initialRisk.text}
              </span>
            )}
          </div>
          
          <h2 className="text-xl sm:text-3xl font-black text-slate-800 leading-tight mb-2 pr-4">{job.jobStep}</h2>
          <div className="flex items-start gap-1.5 text-indigo-600 text-sm sm:text-base font-semibold">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{job.area}</span>
          </div>
        </div>

        {/* 2. Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-8 space-y-6 sm:space-y-8">
          
          {/* --- Workflow Stepper --- */}
          <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-100 shadow-sm">
            <h3 className="text-[11px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Approval Workflow</h3>
            <div className="flex items-center justify-between relative px-2 sm:px-10">
              <div className="absolute left-6 right-6 sm:left-16 sm:right-16 top-5 sm:top-6 h-1 bg-slate-100 rounded-full z-0"></div>
              
              <div className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md border-4 border-white"><User className="w-5 h-5"/></div>
                <div className="text-center"><p className="text-xs sm:text-sm font-bold text-slate-800">Maker</p><p className="text-[10px] text-slate-500">สร้างฟอร์มแล้ว</p></div>
              </div>

              <div className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md border-4 border-white transition-colors ${getStepStatus('CHECKER') === 'completed' ? 'bg-emerald-500 text-white' : getStepStatus('CHECKER') === 'current' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-300'}`}><ShieldCheck className="w-5 h-5"/></div>
                <div className="text-center"><p className={`text-xs sm:text-sm font-bold ${getStepStatus('CHECKER') === 'waiting' ? 'text-slate-400' : 'text-slate-800'}`}>Checker (จป.)</p><p className="text-[10px] text-slate-500">{getStepStatus('CHECKER') === 'completed' ? 'ตรวจสอบแล้ว' : 'รอตรวจสอบ'}</p></div>
              </div>

              <div className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md border-4 border-white transition-colors ${getStepStatus('APPROVER') === 'completed' ? 'bg-emerald-500 text-white' : getStepStatus('APPROVER') === 'current' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-300'}`}><CheckCircle2 className="w-5 h-5"/></div>
                <div className="text-center"><p className={`text-xs sm:text-sm font-bold ${getStepStatus('APPROVER') === 'waiting' ? 'text-slate-400' : 'text-slate-800'}`}>Approver (PM)</p><p className="text-[10px] text-slate-500">{getStepStatus('APPROVER') === 'completed' ? 'อนุมัติแล้ว' : 'รออนุมัติ'}</p></div>
              </div>
            </div>
          </div>

          {/* --- Grid ข้อมูลพื้นฐาน --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0"><Calendar className="w-5 h-5"/></div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">วันที่ปฏิบัติงาน</span>
                <p className="text-sm font-bold text-slate-700 mt-0.5">{new Date(job.created_at || Date.now()).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0"><Wrench className="w-5 h-5"/></div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">เครื่องมือ / เครื่องจักรที่ใช้</span>
                <p className="text-sm font-bold text-slate-700 mt-0.5 line-clamp-2">{job.tools || 'ไม่ได้ระบุอุปกรณ์'}</p>
              </div>
            </div>
          </div>

          {/* 🌟 --- High Risk Tags (ระบบไอคอน) --- */}
          {(job.high_risk_tags?.length > 0 || job.simops) && (
            <div className="bg-orange-50/80 rounded-3xl p-5 sm:p-6 border border-orange-100">
              <h3 className="text-sm font-black text-orange-600 flex items-center gap-2 mb-4"><Activity className="w-4 h-4"/> ประเภทงานเสี่ยงสูง (HIGH-RISK TAGS)</h3>
              <div className="flex flex-wrap gap-2.5">
                {job.simops && (
                  <span className="bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"><Zap className="w-4 h-4 animate-pulse"/> ตรวจพบ SIMOPS</span>
                )}
                {job.high_risk_tags?.map((tag, idx) => {
                  const style = TAG_STYLES[tag] || { ...TAG_STYLES.default, label: tag };
                  const Icon = style.icon;
                  return (
                    <span key={idx} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm border ${style.color}`}>
                      <Icon className="w-4 h-4"/> {style.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* 🌟 --- ก่อนและหลังทำมาตรการ (Before & After Matrix) --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            
            {/* กล่องซ้าย: อันตรายก่อนแก้ไข (Initial Risk) */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm h-full flex flex-col">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-rose-500" /> Potential Hazards
              </h3>
              
              <div className="mb-6 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wide">อันตรายที่อาจเกิดขึ้น</span>
                <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 text-sm text-slate-700 font-medium min-h-[90px]">
                  {job.potentialHazard || '-'}
                </div>
              </div>

              {/* Initial Risk Score Matrix */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100 mt-auto">
                <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2 block text-center">Likelihood</span>
                    <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
                      {[1,2,3,4,5].map(num => (
                        <div key={num} className={`flex-1 flex justify-center items-center py-1.5 rounded-lg font-black text-sm transition-colors ${job.likelihood === num ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>{num}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2 block text-center">Severity</span>
                    <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
                      {[1,2,3,4,5].map(num => (
                        <div key={num} className={`flex-1 flex justify-center items-center py-1.5 rounded-lg font-black text-sm transition-colors ${job.severity === num ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>{num}</div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-200 my-4"></div>
                <div className="flex items-end justify-between">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide mb-1">INITIAL RISK</span>
                  <div className={`rounded-xl px-6 py-2 flex flex-col items-center justify-center shadow-md min-w-[80px] ${initialRisk.color}`}>
                    <span className="text-2xl font-black leading-none">{initialScoreDisplay}</span>
                    <span className="text-[10px] font-bold mt-0.5">{initialRisk.text}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* กล่องขวา: มาตรการควบคุมและตรวจสอบ (Residual Risk) แบบตาม Ref UI */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm h-full flex flex-col">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-emerald-500" /> Control Measures
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">CONTROL MEASURES (มาตรการควบคุม)</span>
                  <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-3 text-sm text-slate-700 font-medium min-h-[90px]">
                    {job.controlMeasures || '-'}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">VERIFICATION (การตรวจสอบ)</span>
                  <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-3 text-sm text-slate-700 font-medium min-h-[90px]">
                    {job.verification || '-'}
                  </div>
                </div>
              </div>

              {/* Residual Risk Score Matrix (ดีไซน์กล่องเขียวอ่อน) */}
              <div className="bg-[#e7fbf0] rounded-2xl p-4 sm:p-5 border border-emerald-200 mt-auto">
                <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2 block text-center">Likelihood</span>
                    <div className="flex bg-white rounded-xl shadow-sm border border-emerald-100 p-1">
                      {[1,2,3,4,5].map(num => (
                        <div key={num} className={`flex-1 flex justify-center items-center py-1.5 rounded-lg font-black text-sm transition-colors ${job.residual_likelihood === num ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>{num}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2 block text-center">Severity</span>
                    <div className="flex bg-white rounded-xl shadow-sm border border-emerald-100 p-1">
                      {[1,2,3,4,5].map(num => (
                        <div key={num} className={`flex-1 flex justify-center items-center py-1.5 rounded-lg font-black text-sm transition-colors ${job.residual_severity === num ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>{num}</div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="border-t border-emerald-200 my-4"></div>
                <div className="flex items-end justify-between">
                  <span className="text-[11px] font-black text-emerald-600 uppercase tracking-wide mb-1">RESIDUAL RISK</span>
                  <div className={`rounded-xl px-6 py-2 flex flex-col items-center justify-center shadow-md min-w-[80px] ${residualRisk.color}`}>
                    <span className="text-2xl font-black leading-none">{residualScoreDisplay}</span>
                    <span className="text-[10px] font-bold mt-0.5">{residualRisk.text}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* --- Audit Trail Timeline --- */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm mt-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-5">
              <History className="w-4 h-4" /> Audit Trail Timeline
            </h3>
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="relative pl-6 border-l-2 border-indigo-100 pb-2">
                  <div className="absolute left-[-7px] top-1 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow-sm" />
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                    <p className="text-sm font-bold text-slate-800">{log.action}</p>
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 w-max">
                      {new Date(log.created_at).toLocaleString('th-TH')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">โดย: <span className="font-semibold">{log.actor_name}</span></p>
                  {log.comment && <p className="text-[11px] text-slate-500 italic mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">{log.comment}</p>}
                </div>
              ))}
              {logs.length === 0 && <p className="text-xs text-slate-400 italic">ยังไม่มีประวัติการดำเนินการ</p>}
            </div>
          </div>

        </div>

        {/* 3. Footer (Action Buttons) */}
        <div className="bg-white border-t border-slate-100 p-4 sm:p-5 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          {currentUser?.role === 'CHECKER' && job.status === 'PENDING' && onUpdateStatus ? (
            <button onClick={() => { onUpdateStatus(job.id, 'VERIFIED'); onClose(); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-bold py-3.5 sm:py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex justify-center items-center gap-2 outline-none">
              <ShieldCheck className="w-5 h-5"/> ยืนยันการตรวจสอบ (Verified)
            </button>
          ) : currentUser?.role === 'APPROVER' && job.status === 'VERIFIED' && onUpdateStatus ? (
            <button onClick={() => { onUpdateStatus(job.id, 'APPROVED'); onClose(); }} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm sm:text-base font-bold py-3.5 sm:py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex justify-center items-center gap-2 outline-none">
              <CheckCircle2 className="w-5 h-5"/> อนุมัติเริ่มงาน (Approved)
            </button>
          ) : (
            <div className="w-full bg-slate-50 text-slate-400 text-sm font-bold py-3.5 sm:py-4 rounded-xl flex justify-center items-center gap-2 border border-slate-100">
              {job.status === 'APPROVED' ? <CheckCircle2 className="w-4 h-4"/> : <Clock className="w-4 h-4"/>}
              {job.status === 'APPROVED' ? 'กระบวนการอนุมัติเสร็จสิ้น' : 'รอผู้มีอำนาจดำเนินการขั้นต่อไป'}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}