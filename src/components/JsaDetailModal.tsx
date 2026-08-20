// src/components/JsaDetailModal.tsx
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, CheckCircle2, ShieldCheck, PenTool, Clock, MapPin, AlertTriangle, 
  ShieldAlert, ArrowUpCircle, Archive, Flame, Anchor, Hammer, FlaskConical, Cog, Trash2, Zap, Tag 
} from 'lucide-react';

interface JsaDetailModalProps {
  job: any;
  currentUser: any;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: string, actionBy: string) => void;
}

// 🌟 นำเข้าข้อมูล Tag เผื่อใช้ดึง Icon และ Label มาแสดง
const HIGH_RISK_TAGS = [
  { id: 'height', label: 'งานที่สูง', icon: ArrowUpCircle },
  { id: 'confined', label: 'งานอับอากาศ', icon: Archive },
  { id: 'hotwork', label: 'งานความร้อน', icon: Flame },
  { id: 'electrical', label: 'งานไฟฟ้า', icon: Zap },
  { id: 'lifting', label: 'งานยก/ปั้นจั่น', icon: Anchor },
  { id: 'excavation', label: 'งานขุดเจาะ', icon: Hammer },
  { id: 'chemical', label: 'งานสารเคมี', icon: FlaskConical },
  { id: 'machinery', label: 'งานเครื่องจักร', icon: Cog },
  { id: 'demolition', label: 'งานรื้อถอน', icon: Trash2 },
];

export default function JsaDetailModal({ job, currentUser, onClose, onUpdateStatus }: JsaDetailModalProps) {
  const [loading, setLoading] = useState(false);

  // สถานะปัจจุบัน: PENDING | VERIFIED | APPROVED
  const currentStatus = job.status || 'PENDING';
  
  // 🌟 ดึงข้อมูล Tag ของงานนี้ (ถ้าไม่มีให้เป็น Array ว่าง)
  const jobTags: string[] = job.high_risk_tags || [];

  const handleAction = async (newStatus: string) => {
    setLoading(true);
    await onUpdateStatus(job.id, newStatus, currentUser.name);
    setLoading(false);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-['Inter','Kanit',sans-serif] animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start bg-slate-50 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">{job.jsaNo}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                currentStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 
                currentStatus === 'VERIFIED' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {currentStatus === 'APPROVED' ? '✅ อนุมัติแล้ว' : currentStatus === 'VERIFIED' ? 'รอการอนุมัติ (PM)' : 'รอตรวจสอบ (จป.)'}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-800 leading-tight">{job.jobStep}</h2>
            <p className="text-xs font-bold text-indigo-600 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> {job.area}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X className="w-5 h-5"/></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* 🌟 สายพานการอนุมัติ (Approval Timeline) */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Approval Workflow</h4>
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full z-0"></div>
              
              {/* 1. Maker */}
              <div className="relative z-10 flex flex-col items-center gap-2 bg-slate-50 px-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md ring-4 ring-slate-50"><PenTool className="w-5 h-5" /></div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-800">Maker</p>
                  <p className="text-[9px] text-slate-500">สร้างฟอร์มแล้ว</p>
                </div>
              </div>

              {/* 2. Checker */}
              <div className="relative z-10 flex flex-col items-center gap-2 bg-slate-50 px-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ring-4 ring-slate-50 transition-colors ${currentStatus === 'VERIFIED' || currentStatus === 'APPROVED' ? 'bg-blue-500 text-white' : 'bg-white border-2 border-slate-200 text-slate-300'}`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className={`text-[10px] font-bold ${currentStatus === 'VERIFIED' || currentStatus === 'APPROVED' ? 'text-blue-600' : 'text-slate-400'}`}>Checker (จป.)</p>
                  <p className="text-[9px] text-slate-500">{job.verified_by ? `ตรวจโดย ${job.verified_by}` : 'รอตรวจสอบ'}</p>
                </div>
              </div>

              {/* 3. Approver */}
              <div className="relative z-10 flex flex-col items-center gap-2 bg-slate-50 px-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ring-4 ring-slate-50 transition-colors ${currentStatus === 'APPROVED' ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-slate-200 text-slate-300'}`}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className={`text-[10px] font-bold ${currentStatus === 'APPROVED' ? 'text-emerald-600' : 'text-slate-400'}`}>Approver (PM)</p>
                  <p className="text-[9px] text-slate-500">{job.approved_by ? `อนุมัติโดย ${job.approved_by}` : 'รออนุมัติ'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 🌟 แสดง Tag งานเสี่ยงสูง (ถ้ามี) */}
          {jobTags.length > 0 && (
            <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-2xl">
              <h4 className="text-[11px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <ShieldAlert className="w-4 h-4"/> ประเภทงานเสี่ยงสูง (High-Risk Tags)
              </h4>
              <div className="flex flex-wrap gap-2">
                {jobTags.map((tagId, index) => {
                  const tagDef = HIGH_RISK_TAGS.find(t => t.id === tagId);
                  // ถ้าเจอในระบบ ให้โชว์ไอคอนและชื่อแท็กนั้นๆ
                  if (tagDef) {
                    const Icon = tagDef.icon;
                    return (
                      <div key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-xl text-[11px] font-bold shadow-sm">
                        <Icon className="w-3.5 h-3.5" /> {tagDef.label}
                      </div>
                    );
                  }
                  // ถ้าไม่เจอ (แสดงว่าเป็น Custom Tag ที่พิมพ์เพิ่มเอง)
                  return (
                    <div key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-xl text-[11px] font-bold shadow-sm">
                      <Tag className="w-3.5 h-3.5" /> {tagId}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* รายละเอียดอันตรายและมาตรการ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
              <h4 className="text-[11px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1.5 mb-2"><AlertTriangle className="w-4 h-4"/> Potential Hazards</h4>
              <p className="text-[13px] text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">{job.potentialHazard}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
              <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 mb-2"><ShieldCheck className="w-4 h-4"/> Control Measures</h4>
              <p className="text-[13px] text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">{job.controlMeasures}</p>
            </div>
          </div>

        </div>

        {/* 🌟 Footer Actions (แสดงปุ่มตาม Role) */}
        <div className="p-5 border-t border-slate-100 bg-white shrink-0">
          {currentUser?.role === 'CHECKER' && currentStatus === 'PENDING' && (
            <button onClick={() => handleAction('VERIFIED')} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]">
              {loading ? 'กำลังดำเนินการ...' : <><ShieldCheck className="w-5 h-5"/> ยืนยันความปลอดภัย (Verify)</>}
            </button>
          )}

          {currentUser?.role === 'APPROVER' && currentStatus === 'VERIFIED' && (
            <button onClick={() => handleAction('APPROVED')} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]">
              {loading ? 'กำลังดำเนินการ...' : <><CheckCircle2 className="w-5 h-5"/> อนุมัติการทำงาน (Approve & Sign)</>}
            </button>
          )}

          {((currentUser?.role === 'MAKER') || 
            (currentUser?.role === 'CHECKER' && currentStatus !== 'PENDING') || 
            (currentUser?.role === 'APPROVER' && currentStatus !== 'VERIFIED')) && (
            <div className="flex items-center justify-center gap-2 text-slate-400 bg-slate-50 py-3 rounded-xl border border-slate-100">
              <Clock className="w-4 h-4" /> <span className="text-[13px] font-bold">{currentStatus === 'APPROVED' ? 'กระบวนการอนุมัติเสร็จสิ้น' : 'รอผู้มีอำนาจดำเนินการขั้นต่อไป'}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}