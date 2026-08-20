// src/components/Sidebar.tsx
import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom'; 
import { LayoutGrid, Map as MapIcon, Settings, LogOut, ChevronRight, ChevronDown, MapPin, Activity, ShieldAlert, ChevronLeft, X, BellRing, Clock, ShieldCheck, Calendar, CheckCircle2 } from 'lucide-react';
import type { JsaData } from '../types/jsa';
import { supabase } from '../lib/supabase';
import UserProfileModal from './UserProfileModal';

interface SidebarProps {
  jobs: JsaData[];
  savedZones: any[];
  onCloseMobile?: () => void;
  activeTab: 'dashboard' | 'map';
  setActiveTab: (tab: 'dashboard' | 'map') => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onViewJsaDetail?: (job: JsaData) => void;
  currentUser?: any;
  
  // 🌟 เพิ่ม Props สำหรับรับค่าตัวกรองเวลาจากหน้าหลัก
  timeFilter?: 'TODAY' | 'WEEK' | 'MONTH' | 'ALL';
  setTimeFilter?: (filter: 'TODAY' | 'WEEK' | 'MONTH' | 'ALL') => void;
}

const TIME_OPTIONS = [
  { id: 'TODAY', label: 'วันนี้ (Today)' },
  { id: 'WEEK', label: 'สัปดาห์นี้ (This Week)' },
  { id: 'MONTH', label: 'เดือนนี้ (This Month)' },
  { id: 'ALL', label: 'ทั้งหมด (All Time)' },
];

export default function Sidebar({ 
  jobs, savedZones, onCloseMobile, 
  activeTab, setActiveTab, 
  isCollapsed, onToggleCollapse, 
  onViewJsaDetail, currentUser,
  timeFilter = 'ALL', // ค่า Default
  setTimeFilter
}: SidebarProps) {
  
  const [expandedZone, setExpandedZone] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPendingList, setShowPendingList] = useState(false);

  // 🌟 State สำหรับ Dropdown เวลา
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const timeDropdownRef = useRef<HTMLDivElement>(null);

  // ปิด Dropdown เวลาเมื่อคลิกที่อื่น
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target as Node)) {
        setIsTimeOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pendingJobs = useMemo(() => {
    if (!currentUser || !currentUser.role) return [];
    return jobs.filter(job => {
      const status = job.status || 'PENDING';
      if (currentUser.role === 'CHECKER' && status === 'PENDING') return true;
      if (currentUser.role === 'APPROVER' && status === 'VERIFIED') return true;
      return false;
    });
  }, [jobs, currentUser]);

  const pendingActionCount = pendingJobs.length;

  const toggleZone = (zoneId: string) => {
    setExpandedZone(prev => prev === zoneId ? null : zoneId);
  };

  const handleLogout = async () => {
    localStorage.removeItem('demo_user_id'); 
    await supabase.auth.signOut(); 
    window.location.reload(); 
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

  return (
    <>
      {/* 🌟 เปลี่ยนฟอนต์ตรงนี้เป็น font-hybrid ให้เหมือนหน้าอื่น */}
      <aside className="w-full h-full bg-white border-r border-slate-100 flex flex-col z-10 font-hybrid relative transition-all duration-300">
        
        <button onClick={onToggleCollapse} className="hidden md:flex absolute top-8 -right-3.5 z-50 bg-white border border-slate-200 rounded-full p-1.5 shadow-sm hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-transform hover:scale-110 outline-none">
          {isCollapsed ? <ChevronRight className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>}
        </button>

        {onCloseMobile && (
          <button onClick={onCloseMobile} className="md:hidden absolute top-6 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full outline-none z-50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}

        {/* 🌟 1. Top Branding */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-6'} py-7 border-b border-slate-50 shrink-0 transition-all duration-300`}>
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-200 shrink-0 cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden shadow-sm p-1" onClick={isCollapsed ? onToggleCollapse : undefined} title={isCollapsed ? "Expand Sidebar" : ""}>
              <img src="/Logo JSA.svg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            {isCollapsed && pendingActionCount > 0 && (
              <button onClick={() => setShowPendingList(true)} className="absolute -top-1.5 -right-1.5 flex h-4 w-4 outline-none">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-white shadow-sm"></span>
              </button>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-black text-slate-800 leading-tight truncate">Visual JSA</span>
              <span className="text-[11px] font-medium text-slate-400 truncate">Risk Management</span>
            </div>
          )}
        </div>

        {/* 🌟 2. Global Time Filter (ตัวกรองเวลาหลัก) */}
        {!isCollapsed && setTimeFilter && (
          <div className="px-4 py-4 border-b border-slate-50 bg-slate-50/50 shrink-0 relative" ref={timeDropdownRef}>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-2">Time Range Filter</span>
            <button
              onClick={() => setIsTimeOpen(!isTimeOpen)}
              className="w-full bg-white hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-between outline-none shadow-sm group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <span className="group-hover:text-indigo-700 transition-colors">
                  {TIME_OPTIONS.find(o => o.id === timeFilter)?.label || 'ทั้งหมด (All Time)'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isTimeOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTimeOpen && (
              <div className="absolute left-4 right-4 top-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-[100] p-1.5 animate-in fade-in zoom-in-95 duration-200">
                {TIME_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => { setTimeFilter(opt.id as any); setIsTimeOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 text-[12px] font-bold rounded-lg transition-colors flex items-center justify-between outline-none ${timeFilter === opt.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                  >
                    {opt.label}
                    {timeFilter === opt.id && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 🌟 3. Navigation Menu */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-6 flex flex-col gap-8">
          <div className="px-4">
            {!isCollapsed && (
              <div className="flex items-center justify-between px-3 mb-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overview</h3>
                {pendingActionCount > 0 && (
                  <button 
                    onClick={() => setShowPendingList(true)}
                    className="text-[9px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-full flex items-center gap-1 border border-rose-100 transition-colors shadow-sm outline-none active:scale-95"
                  >
                    <BellRing className="w-3 h-3 animate-[wiggle_1s_ease-in-out_infinite]" /> {pendingActionCount} งานที่รอ
                  </button>
                )}
              </div>
            )}
            
            <nav className={`space-y-1.5 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
              <button onClick={() => { setActiveTab('dashboard'); if(window.innerWidth < 768) onCloseMobile?.(); }} title={isCollapsed ? 'Dashboard' : ''} className={`w-full flex items-center justify-between ${isCollapsed ? 'justify-center p-3' : 'px-4 py-3'} rounded-xl transition-colors font-bold text-sm outline-none ${activeTab === 'dashboard' ? 'bg-cyan-50 text-cyan-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                <div className="flex items-center gap-3">
                  <LayoutGrid className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span>Dashboard</span>}
                </div>
              </button>
              <button onClick={() => { setActiveTab('map'); if(window.innerWidth < 768) onCloseMobile?.(); }} title={isCollapsed ? 'Map View' : ''} className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} rounded-xl transition-colors font-bold text-sm outline-none ${activeTab === 'map' ? 'bg-cyan-50 text-cyan-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                <MapIcon className="w-5 h-5 shrink-0" /> {!isCollapsed && <span>Map View</span>}
              </button>
            </nav>
          </div>

          <div className="px-4">
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-4 mt-2">
                <div className="w-8 h-px bg-slate-100"></div>
                <button onClick={onToggleCollapse} title="Project Zones" className="p-3 text-slate-400 hover:bg-slate-50 hover:text-indigo-500 rounded-xl transition-colors"><MapPin className="w-5 h-5" /></button>
              </div>
            ) : (
              <>
                <h3 className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Project Zones</h3>
                <nav className="space-y-1.5">
                  {savedZones.length === 0 ? (
                    <p className="px-3 text-xs text-slate-400 font-medium italic">ยังไม่มีการวาดโซนพื้นที่</p>
                  ) : (
                    savedZones.map((zone) => {
                      const isExpanded = expandedZone === zone.id;
                      const zoneFullName = `${zone.projectName} - ${zone.name}`;
                      const zoneJobs = jobs.filter(job => job.area === zoneFullName);

                      return (
                        <div key={zone.id} className="flex flex-col">
                          <button onClick={() => toggleZone(zone.id)} className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors text-sm w-full outline-none ${isExpanded ? 'bg-slate-50 text-slate-800 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800 font-medium'}`}>
                            <div className="flex items-center gap-3 truncate pr-2"><MapPin className={`w-4 h-4 shrink-0 ${isExpanded ? 'text-indigo-500' : 'text-slate-400'}`} /><span className="truncate">{zone.name}</span></div>
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0"/> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0"/>}
                          </button>

                          {isExpanded && (
                            <div className="mt-1 mb-2 ml-5 pl-4 border-l-2 border-slate-100 space-y-1">
                              {zoneJobs.length === 0 ? (
                                <div className="py-2 px-3 text-[11px] text-slate-400">ไม่มีกิจกรรมความเสี่ยง</div>
                              ) : (
                                zoneJobs.map(job => (
                                  <button key={job.id} onClick={() => { if(onViewJsaDetail) onViewJsaDetail(job); if(window.innerWidth < 768) onCloseMobile?.(); }} className="flex flex-col w-full text-left py-2 px-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group outline-none">
                                    <span className="text-xs font-medium text-slate-600 group-hover:text-indigo-600 truncate w-full transition-colors">{job.jobStep}</span>
                                    <div className="flex items-center gap-1.5 mt-1 w-full">
                                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${job.riskLevel === 'CRITICAL' ? 'bg-rose-500' : job.riskLevel === 'HIGH' ? 'bg-orange-500' : job.riskLevel === 'MEDIUM' ? 'bg-amber-400' : 'bg-emerald-500'}`}></span>
                                      <span className="text-[9px] font-bold text-slate-400">{job.jsaNo}</span>
                                      {job.simops && <ShieldAlert className="w-3 h-3 text-amber-500 ml-auto shrink-0" />}
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </nav>
              </>
            )}
          </div>
        </div>

        {/* 🌟 4. Bottom Settings & Profile */}
        <div className={`p-4 border-t border-slate-50 shrink-0 bg-slate-50/50 flex flex-col ${isCollapsed ? 'items-center' : ''} transition-all duration-300`}>
          <nav className="space-y-1 mb-4 w-full">
            <button onClick={() => setShowProfileModal(true)} title={isCollapsed ? "Settings" : ""} className={`w-full flex items-center ${isCollapsed ? 'justify-center py-3' : 'gap-3 px-4 py-2.5'} text-slate-500 hover:text-blue-600 hover:bg-white rounded-xl transition-colors font-semibold text-[13px] outline-none`}>
              <Settings className="w-4 h-4 shrink-0" /> {!isCollapsed && <span>Profile Settings</span>}
            </button>
            <button onClick={() => setShowLogoutConfirm(true)} title={isCollapsed ? "Log out" : ""} className={`w-full flex items-center ${isCollapsed ? 'justify-center py-3' : 'gap-3 px-4 py-2.5'} text-slate-500 hover:text-rose-600 hover:bg-white rounded-xl transition-colors font-semibold text-[13px] outline-none group`}>
              <LogOut className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" /> {!isCollapsed && <span>Log out</span>}
            </button>
          </nav>

          <div onClick={() => setShowProfileModal(true)} className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-3'} py-2 mt-2 w-full cursor-pointer hover:opacity-80 transition-opacity`} title="Edit Profile">
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border-2 border-white shadow-md">
              <img src={currentUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name || 'User'}`} alt="User Avatar" className="w-full h-full object-cover" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-black text-slate-800 truncate">{currentUser?.name || 'Loading...'}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{currentUser?.roleName || 'User'}</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MODAL ต่างๆ (Pending List / Logout / Profile) ยังคงเหมือนเดิม */}
      {showPendingList && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300 font-hybrid">
          <div className="bg-white rounded-3xl w-full max-w-[420px] max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  {currentUser?.role === 'CHECKER' ? <Clock className="w-5 h-5"/> : <ShieldCheck className="w-5 h-5"/>}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 leading-tight">งานที่รอการดำเนินการ</h3>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Pending Actions ({pendingActionCount})</p>
                </div>
              </div>
              <button onClick={() => setShowPendingList(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors outline-none">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {pendingJobs.map(job => (
                <div key={job.id} onClick={() => { if (onViewJsaDetail) onViewJsaDetail(job); setShowPendingList(false); if(window.innerWidth < 768 && onCloseMobile) onCloseMobile(); }} className="bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md p-4 rounded-2xl cursor-pointer transition-all active:scale-[0.98] group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{job.jsaNo}</span>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg text-white shadow-sm ${getRiskBg(job.riskLevel)}`}>{job.riskLevel}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug mb-2 group-hover:text-indigo-700 transition-colors">{job.jobStep}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500"><MapPin className="w-3.5 h-3.5 text-indigo-400"/><span className="truncate max-w-[180px]">{job.area}</span></div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors"/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {showLogoutConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-300 font-hybrid" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white rounded-t-[2.5rem] sm:rounded-3xl p-6 sm:p-8 w-full sm:max-w-[380px] text-center shadow-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 pb-10 sm:pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-slate-200 hover:bg-slate-300 rounded-full mx-auto mb-6 sm:hidden cursor-pointer transition-colors" onClick={() => setShowLogoutConfirm(false)}></div>
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5 border-[6px] border-white shadow-sm"><LogOut className="w-8 h-8 text-rose-500 ml-1" /></div>
            <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">ออกจากระบบ?</h3>
            <p className="text-[14px] font-medium text-slate-500 mb-8 leading-relaxed px-2">คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ Visual JSA ในขณะนี้</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="w-full sm:w-1/2 py-4 sm:py-3.5 rounded-2xl font-bold text-[14px] text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors outline-none">ยกเลิก</button>
              <button onClick={handleLogout} className="w-full sm:w-1/2 py-4 sm:py-3.5 rounded-2xl font-bold text-[14px] text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-[0_8px_20px_rgba(225,29,72,0.25)] active:scale-95 outline-none">ออกจากระบบ</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showProfileModal && (
        <UserProfileModal user={currentUser} onClose={() => setShowProfileModal(false)} onProfileUpdate={() => window.location.reload()} />
      )}
    </>
  );
}