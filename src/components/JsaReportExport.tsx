// src/components/JsaReportExport.tsx
import { useState, useMemo } from 'react';
import { X, Printer, FileText, Filter, Calendar, ShieldAlert, Search, Check } from 'lucide-react';
import type { JsaData } from '../types/jsa';

interface JsaReportExportProps {
  jobs: JsaData[];
  onClose: () => void;
}

export default function JsaReportExport({ jobs, onClose }: JsaReportExportProps) {
  // 🌟 State สำหรับจัดการตัวกรองก่อน Print
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectName, setProjectName] = useState('โครงการก่อสร้างทั่วไป (General Project)');

  // 🌟 ฟังก์ชันกรองข้อมูลก่อนลงกระดาษ
  const filteredJobs = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return jobs.filter(job => {
      // 1. กรองเวลา
      let matchTime = true;
      if (timeFilter !== 'ALL') {
        const jobDateRaw = job.created_at || (job as any).createdAt || new Date().toISOString();
        const jobDate = new Date(jobDateRaw);
        if (timeFilter === 'TODAY') matchTime = jobDate >= today;
        if (timeFilter === 'WEEK') {
          const lastWeek = new Date(today);
          lastWeek.setDate(today.getDate() - 7);
          matchTime = jobDate >= lastWeek;
        }
        if (timeFilter === 'MONTH') {
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          matchTime = jobDate >= firstDayOfMonth;
        }
      }

      // 2. กรองความเสี่ยง
      const matchRisk = riskFilter === 'ALL' ? true : job.riskLevel === riskFilter;

      // 3. กรองคำค้นหา
      const query = searchQuery.toLowerCase();
      const matchSearch = job.jsaNo.toLowerCase().includes(query) || 
                          job.jobStep.toLowerCase().includes(query) ||
                          job.area.toLowerCase().includes(query);

      return matchTime && matchRisk && matchSearch;
    });
  }, [jobs, timeFilter, riskFilter, searchQuery]);

  // 🌟 ฟังก์ชันจัดรูปแบบคะแนนและสี (ใช้ 2D Array ตามตาราง Risk Matrix 5x5 เป๊ะๆ)
  const renderRiskBadge = (score?: number, level?: string, l?: number, s?: number) => {
    let calcLevel = level || 'LOW';
    const finalScore = score || (l && s ? l * s : 0);
    
    // ถ้ามีค่า L, S ครบ ให้ใช้ Matrix 2D คำนวณสีใหม่ให้เป๊ะที่สุด
    if (l && s && l >= 1 && l <= 5 && s >= 1 && s <= 5) {
      const riskMatrix = [
        ['LOW', 'LOW', 'MEDIUM', 'MEDIUM', 'HIGH'],          // แถว L=1
        ['LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'HIGH'],         // แถว L=2
        ['LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'CRITICAL'],     // แถว L=3
        ['MEDIUM', 'MEDIUM', 'HIGH', 'HIGH', 'CRITICAL'],    // แถว L=4
        ['MEDIUM', 'HIGH', 'HIGH', 'CRITICAL', 'CRITICAL']   // แถว L=5
      ];
      calcLevel = riskMatrix[l - 1][s - 1];
    }

    let bgColor = '';
    let textColor = 'text-white';
    let label = 'Low';
    let equation = (l && s) ? `L${l} × S${s}` : '-';

    // เทียบสีตาม calcLevel ที่ได้จากตาราง
    if (calcLevel === 'CRITICAL' || calcLevel === 'EXTREME') {
      bgColor = 'bg-rose-600 border-rose-700'; label = 'Extreme';
    } else if (calcLevel === 'HIGH') {
      bgColor = 'bg-orange-500 border-orange-600'; label = 'High';
    } else if (calcLevel === 'MEDIUM') {
      bgColor = 'bg-amber-400 border-amber-500'; textColor = 'text-amber-900'; label = 'Medium';
    } else {
      bgColor = 'bg-emerald-500 border-emerald-600'; label = 'Low';
    }

    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border shadow-sm ${bgColor} ${textColor} print:shadow-none print:border-none`}>
          {label}
        </span>
        <span className="text-[8px] font-bold text-slate-600 bg-slate-100 px-1 py-0.5 rounded print:bg-transparent leading-none whitespace-nowrap">
          {equation} = {finalScore || '-'}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-2 md:p-6 print:p-0 print:bg-white animate-in fade-in duration-300 font-hybrid">
      
      {/* 🌟 บังคับตั้งค่าหน้ากระดาษเป็นแนวนอน (A4 Landscape) และปรับ CSS สำหรับการ Print โดยเฉพาะ */}
      <style>{`
          @media print {
            @page { size: A4 landscape; margin: 8mm; } 
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
            .no-print { display: none !important; }
            .print-a4-landscape {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
            }
            .print-table { table-layout: fixed; width: 100%; }
            .print-table th, .print-table td { word-wrap: break-word; overflow-wrap: break-word; }
            .print-table tr { page-break-inside: avoid; break-inside: avoid; }
            .print-header-bg { background-color: #0f3f2b !important; color: white !important; }
          }
          .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>

      {/* 📦 Container หลัก (Responsive) */}
      <div className="bg-slate-50 w-full max-w-[95vw] h-[95vh] md:h-full print:h-auto print:max-w-none flex flex-col rounded-[24px] shadow-2xl overflow-hidden print-a4-landscape border border-slate-200">
        
        {/* 🟢 แถบเมนูด้านบน (ซ่อนตอน Print) */}
        <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex flex-col gap-4 no-print shrink-0 z-10">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#0f3f2b] p-2.5 rounded-xl shadow-sm text-white">
                <FileText className="w-6 h-6"/>
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">Export JSA Report</h2>
                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Select data to print ({filteredJobs.length} records)</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={() => window.print()} className="flex-1 sm:flex-none bg-[#0f3f2b] hover:bg-emerald-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-all shadow-md active:scale-95 outline-none">
                <Printer className="w-4 h-4"/> Print / Save PDF
              </button>
              <button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2.5 rounded-xl transition-colors shrink-0 outline-none">
                <X className="w-5 h-5"/>
              </button>
            </div>
          </div>

          {/* 🌟 🎛️ เครื่องมือคัดกรองข้อมูลก่อนพิมพ์ (Pre-Export Filters) */}
          <div className="bg-slate-50/80 border border-slate-200 p-3 rounded-xl flex flex-col xl:flex-row gap-3">
            
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              {/* เปลี่ยนชื่อโครงการ */}
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1 flex items-center gap-1"><FileText className="w-3 h-3"/> Report Project Name</label>
                <input 
                  type="text" 
                  value={projectName} 
                  onChange={(e) => setProjectName(e.target.value)} 
                  className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              {/* กรองเวลา */}
              <div className="sm:w-40">
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Time Range</label>
                <select 
                  value={timeFilter} 
                  onChange={(e) => setTimeFilter(e.target.value as any)}
                  className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                >
                  <option value="ALL">ทั้งหมด (All Time)</option>
                  <option value="TODAY">วันนี้ (Today)</option>
                  <option value="WEEK">สัปดาห์นี้ (This Week)</option>
                  <option value="MONTH">เดือนนี้ (This Month)</option>
                </select>
              </div>
              {/* กรองความเสี่ยง */}
              <div className="sm:w-36">
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Risk Level</label>
                <select 
                  value={riskFilter} 
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                >
                  <option value="ALL">ทั้งหมด (All)</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>
            
            {/* ค้นหาคำ */}
            <div className="xl:w-64">
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1 flex items-center gap-1"><Search className="w-3 h-3"/> Search</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="รหัส, ชื่องาน, พื้นที่..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

          </div>

        </div>

        {/* 📄 พื้นที่กระดาษ (Preview) */}
        <div className="flex-1 overflow-auto p-4 md:p-6 print:p-0 custom-scrollbar bg-[#e2e8f0] print:bg-white print:overflow-visible">
          
          {filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white rounded-2xl print:hidden">
              <Filter className="w-12 h-12 mb-3 text-slate-300"/>
              <p className="font-bold">ไม่พบข้อมูลที่ตรงกับตัวกรอง</p>
            </div>
          ) : (
            <div className="bg-white mx-auto shadow-xl print:shadow-none p-6 md:p-10 print:p-0 rounded-xl print:rounded-none print:w-[280mm]">
              
              {/* 🌟 หัวเอกสาร */}
              <div className="text-center mb-6 border-b-2 border-slate-800 pb-4">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-widest">Job Safety Analysis (JSA)</h1>
                <div className="mt-2 flex flex-wrap justify-center items-center gap-2 text-xs md:text-sm font-bold text-slate-600">
                  <span className="bg-slate-100 px-3 py-1 rounded-md print:border border-slate-200 print:bg-transparent">Project: {projectName}</span>
                  <span className="hidden md:inline print:inline">•</span>
                  <span className="bg-slate-100 px-3 py-1 rounded-md print:border border-slate-200 print:bg-transparent">
                    Filter: {timeFilter === 'TODAY' ? 'วันนี้' : timeFilter === 'WEEK' ? 'สัปดาห์นี้' : timeFilter === 'MONTH' ? 'เดือนนี้' : 'ทั้งหมด'}
                  </span>
                </div>
              </div>

              {/* 📊 ตาราง A4 */}
              <div className="w-full pb-4">
                <table className="print-table w-full text-left border-collapse text-[10px] md:text-xs">
                  <thead>
                    <tr className="print-header-bg bg-[#0f3f2b] text-white">
                      <th className="border border-slate-300 px-2 py-2 text-center w-[4%] rounded-tl-md print:rounded-none">No.</th>
                      <th className="border border-slate-300 px-2 py-2 w-[14%]">Job Step / Activity</th>
                      <th className="border border-slate-300 px-2 py-2 w-[10%]">Equipment</th>
                      <th className="border border-slate-300 px-2 py-2 w-[16%]">Potential Hazards</th>
                      <th className="border border-slate-300 px-2 py-2 w-[16%]">Possible Consequences</th>
                      <th className="border border-slate-300 px-2 py-2 text-center w-[8%]">Initial Risk</th>
                      <th className="border border-slate-300 px-2 py-2 w-[18%]">Control Measures</th>
                      <th className="border border-slate-300 px-2 py-2 text-center w-[6%]">Critical</th>
                      <th className="border border-slate-300 px-2 py-2 text-center w-[8%] rounded-tr-md print:rounded-none">Residual Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredJobs.map((job, index) => {
                      return (
                        <tr key={job.id} className="align-top hover:bg-slate-50 print:hover:bg-transparent transition-colors">
                          <td className="border border-slate-300 px-2 py-2 text-center font-black text-slate-800 bg-slate-50 print:bg-transparent">{index + 1}</td>
                          <td className="border border-slate-300 px-2 py-2 font-bold text-slate-800 leading-snug">
                            {job.jobStep}
                            <div className="text-[8px] md:text-[9px] text-slate-500 font-medium mt-1">Area: {job.area}</div>
                          </td>
                          <td className="border border-slate-300 px-2 py-2 text-slate-600 leading-snug">{job.equipment}</td>
                          <td className="border border-slate-300 px-2 py-2 text-rose-700 font-medium leading-snug">{job.potentialHazard}</td>
                          <td className="border border-slate-300 px-2 py-2 text-slate-700 leading-snug">{job.consequence}</td>
                          <td className="border border-slate-300 px-2 py-2 align-middle">
                            {/* ดึงค่าคะแนน Initial มาใช้งานจริง ถ้าไม่มี L,S ก็จะเอา risk_score/initialRisk มาเทียบสีเก่าสำรองไว้ */}
                            {renderRiskBadge(job.risk_score || job.initialRisk, job.riskLevel, job.likelihood, job.severity)}
                          </td>
                          <td className="border border-slate-300 px-2 py-2 text-slate-700 whitespace-pre-line leading-snug">
                            {job.controlMeasures}
                          </td>
                          <td className="border border-slate-300 px-2 py-2 text-emerald-700 font-medium text-center text-[9px] align-middle">
                            <Check className="w-3 h-3 mx-auto mb-0.5 text-emerald-500"/>
                            ตรวจสอบ
                          </td>
                          <td className="border border-slate-300 px-2 py-2 align-middle bg-slate-50/50 print:bg-transparent">
                            {/* ดึงค่าคะแนน Residual มาใช้งานจริง */}
                            {renderRiskBadge(job.residual_risk_score, 'LOW', job.residual_likelihood, job.residual_severity)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ส่วนท้ายเอกสาร */}
              <div className="mt-4 border-t border-slate-200 pt-3 text-[9px] font-bold text-slate-400 flex justify-between items-center gap-2">
                <span>Document Ref: JSA-PRJ-001 | Date Printed: {new Date().toLocaleDateString('th-TH')} | Confidential - For Site Use Only</span>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}