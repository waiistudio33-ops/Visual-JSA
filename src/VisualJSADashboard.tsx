// src/VisualJSADashboard.tsx
import { useState, useRef, useEffect, useMemo } from 'react';
import { Flame, GripHorizontal, Check, Bell, User, PencilRuler, Building2, Layers, FileText, Menu, X, MapPin } from 'lucide-react';
import * as turf from '@turf/turf';
import JsaDetailModal from './components/JsaDetailModal';
import type { JsaData } from './types/jsa';
import JsaReportExport from './components/JsaReportExport';
import JsaAssessmentModal from './components/JsaAssessmentModal';
import Sidebar from './components/Sidebar';
import MapSection from './components/MapSection';
import DataTable from './components/DataTable';
import DashboardOverview from './components/DashboardOverview';
import { supabase } from './lib/supabase';
import LoginScreen, { type UserRole } from './components/LoginScreen';

interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  roleName: string;
  avatar_url?: string;
  phone?: string;
}

// 🌟 ข้อมูล ID จำลองสำหรับระบบ Demo (ข้าม Supabase Auth)
const DEMO_USER_IDS: Record<string, string> = {
  'maker@demo.com': '470f4467-1d40-4f18-b52e-f971751d0633',
  'checker@demo.com': '7b29e6ae-e687-49cf-975b-62310ded89ac',
  'approver@demo.com': '2d35ad27-1007-4a76-955f-d86619d932b8',
};

export default function VisualJSADashboard() {
  const [jobs, setJobs] = useState<JsaData[]>([]);
  const [savedZones, setSavedZones] = useState<any[]>([]);
  
  // 🌟 State สำหรับตัวกรองเวลา (Global)
  const [globalTimeFilter, setGlobalTimeFilter] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('ALL');
  
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map'>('dashboard');
  const [mapHeight, setMapHeight] = useState(55);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapMode, setMapMode] = useState<'satellite' | 'streets'>('satellite');
  const [showExportModal, setShowExportModal] = useState(false);
  
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [isAddingMode, setIsAddingMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPin, setNewPin] = useState<{ lat: number; lng: number } | null>(null);

  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [pendingZone, setPendingZone] = useState<{ geoJson: any; area: number } | null>(null);
  const [zoneForm, setZoneForm] = useState({ projectName: 'โครงการก่อสร้างอาคาร 1 ชั้น (32m)', zoneName: '' });
  
  const [selectedJobDetail, setSelectedJobDetail] = useState<JsaData | null>(null);
  const [showJsaFormModal, setShowJsaFormModal] = useState(false);
  const logAudit = async (jsaId: string, action: string, user: AppUser, comment: string = '') => {
  await supabase.from('jsa_audit_logs').insert([{
    jsa_id: jsaId,
    action: action,
    actor_name: user.name,
    comment: comment
  }]);
};
  // 🌟 กรองข้อมูลงานทั้งหมดตามเวลาที่เลือก ก่อนส่งไปให้ Component อื่นๆ
  const filteredGlobalJobs = useMemo(() => {
    if (globalTimeFilter === 'ALL') return jobs;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return jobs.filter(job => {
      const jobDateRaw = job.created_at || (job as any).createdAt || new Date().toISOString();
      const jobDate = new Date(jobDateRaw);

      if (globalTimeFilter === 'TODAY') return jobDate >= today;
      if (globalTimeFilter === 'WEEK') {
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        return jobDate >= lastWeek;
      }
      if (globalTimeFilter === 'MONTH') {
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return jobDate >= firstDayOfMonth;
      }
      return true;
    });
  }, [jobs, globalTimeFilter]);

  // ==========================================
  // 🔐 SUPABASE AUTH & DEMO SYSTEM
  // ==========================================
  useEffect(() => {
    const savedDemoId = localStorage.getItem('demo_user_id');
    if (savedDemoId) {
      fetchUserProfile(savedDemoId);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserProfile(session.user.id);
      } else if (!localStorage.getItem('demo_user_id')) {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleDemoLogin = (acc: { email: string }) => {
    const demoId = DEMO_USER_IDS[acc.email];
    if (!demoId) return;
    localStorage.setItem('demo_user_id', demoId); 
    fetchUserProfile(demoId); 
  };
  
  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    
    if (data && !error) {
      setCurrentUser({
        id: userId,
        name: data.full_name || 'ผู้ใช้งาน',
        role: (data.role as UserRole) || 'MAKER',
        roleName: data.role_name || 'พนักงาน',
        avatar_url: data.avatar_url,
        phone: data.phone
      });
    } else {
      let mockName = 'ผู้ใช้ทดสอบ (No Profile)';
      let mockRole: UserRole = 'MAKER';
      let mockRoleName = 'Site Supervisor';
      let mockPhone = '-';
      
      if (userId === DEMO_USER_IDS['maker@demo.com']) { mockName = 'ช่างสมชาย'; mockRole = 'MAKER'; mockRoleName = 'Site Supervisor'; }
      if (userId === DEMO_USER_IDS['checker@demo.com']) { mockName = 'จป. สมหญิง'; mockRole = 'CHECKER'; mockRoleName = 'Safety Engineer'; }
      if (userId === DEMO_USER_IDS['approver@demo.com']) { mockName = 'ผอ. สมศักดิ์'; mockRole = 'APPROVER'; mockRoleName = 'Project Manager'; }

      setCurrentUser({
        id: userId,
        name: mockName,
        role: mockRole,
        roleName: mockRoleName,
        phone: mockPhone
      });
    }
  };

  useEffect(() => {
    if (currentUser) fetchDatabase();
  }, [currentUser]);

  const fetchDatabase = async () => {
    const { data: jsaData } = await supabase.from('jsa_records').select('*').order('created_at', { ascending: false });
    if (jsaData) setJobs(jsaData);

    const { data: zoneData } = await supabase.from('zones').select('*').order('created_at', { ascending: true });
    if (zoneData) setSavedZones(zoneData);
  };

  // ==========================================
  // 🌟 ฟังก์ชันลากปรับขนาดแผนที่
  // ==========================================
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.type === 'mousedown') e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current) return;
      if (e.type === 'touchmove' && e.cancelable) e.preventDefault();

      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const containerRect = containerRef.current.getBoundingClientRect();
      let newHeight = ((clientY - containerRect.top) / containerRect.height) * 100;
      
      if (newHeight < 20) newHeight = 20;
      if (newHeight > 80) newHeight = 80;
      setMapHeight(newHeight);
    };
    
    const handleDragEnd = () => setIsDragging(false);
    
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false }); 
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging]);

  const handleLocationPick = (lat: number, lng: number) => {
    setNewPin({ lat, lng });
    setShowAddModal(true);
    setIsAddingMode(false);
  };

  const handleZoneDrawn = (geoJson: any, areaSqM: number) => {
    setPendingZone({ geoJson, area: areaSqM });
    setShowZoneModal(true);
    setIsDrawingMode(false);
  };

  const handleSaveZoneDetails = async () => {
    if (!pendingZone) return;
    const newZone = {
      id: Date.now().toString(),
      projectName: zoneForm.projectName,
      name: zoneForm.zoneName || `Zone ${savedZones.length + 1}`,
      area: pendingZone.area,
      geoJson: pendingZone.geoJson,
    };
    const { error } = await supabase.from('zones').insert([newZone]);
    if (!error) {
      setSavedZones([...savedZones, newZone]);
      setShowZoneModal(false);
      setPendingZone(null);
      setZoneForm({ ...zoneForm, zoneName: '' });
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึกโซน!');
    }
  };

  const handleMitigateJob = async (id: string) => {
    const jobToUpdate = jobs.find(j => j.id === id);
    if (!jobToUpdate) return;
    const { error } = await supabase
      .from('jsa_records')
      .update({ 
        simops: false, 
        simopsDetail: '', 
        riskLevel: 'LOW', 
        initialRisk: 5,
        controlMeasures: jobToUpdate.controlMeasures + ' (✓ ดำเนินการควบคุม SIMOPS เรียบร้อยแล้ว)'
      })
      .eq('id', id);

    if (!error) {
      setJobs(prevJobs => prevJobs.map(job => job.id === id ? { ...job, simops: false, simopsDetail: '', riskLevel: 'LOW', initialRisk: 5, controlMeasures: job.controlMeasures + ' (✓ ดำเนินการควบคุม SIMOPS เรียบร้อยแล้ว)' } : job));
    }
  };

  const handleUpdateJsaStatus = async (id: string, newStatus: string, actionBy: string) => {
  const updateData: any = { status: newStatus };
  if (newStatus === 'VERIFIED') updateData.verified_by = actionBy;
  if (newStatus === 'APPROVED') updateData.approved_by = actionBy;

  const { error } = await supabase.from('jsa_records').update(updateData).eq('id', id);
  
  if (!error) {
    setJobs(prev => prev.map(job => job.id === id ? { ...job, ...updateData } : job));
    
    // 🌟 บันทึก Log ทันทีที่อัปเดตสำเร็จ!
    if (currentUser) {
      await logAudit(id, `เปลี่ยนสถานะเป็น: ${newStatus}`, currentUser, `ดำเนินการโดย ${currentUser.roleName}`);
    }
  } else {
    alert("อัปเดตสถานะไม่สำเร็จ: " + error.message);
  }
};

  if (!currentUser) return <LoginScreen onDemoLogin={handleDemoLogin} />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Kanit:wght@300;400;500;600;700&display=swap');
        .font-hybrid { font-family: 'Inter', 'Kanit', sans-serif; }
      `}</style>

      <div className="flex h-[100dvh] w-full flex-col bg-[#f8fafc] font-hybrid overflow-hidden relative">
        
        <header className="flex h-16 md:h-[76px] shrink-0 items-center justify-between bg-white/80 backdrop-blur-xl px-4 md:px-8 border-b border-slate-200 z-50">
          <div className="flex items-center gap-3 md:gap-4">
            {activeTab === 'map' && (
              <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors outline-none">
                <Menu className="w-6 h-6"/>
              </button>
            )}
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm p-1">
  <img src="/Logo JSA.svg" alt="Logo" className="w-full h-full object-contain" />
</div>
            <div className="hidden sm:flex flex-col justify-center">
              <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight leading-none">Risk Assessment</h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Visual JSA Dashboard</span>
            </div>
          </div>

          <div className="flex bg-slate-100/80 p-1.5 rounded-[14px] border border-slate-200/60 shadow-inner">
            <button onClick={() => setActiveTab('dashboard')} className={`px-5 md:px-10 py-2 text-[12px] font-bold rounded-[10px] transition-all outline-none ${activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('map')} className={`px-5 md:px-10 py-2 text-[12px] font-bold rounded-[10px] transition-all outline-none ${activeTab === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Map View</button>
          </div>

          <div className="hidden md:flex items-center gap-3 pl-5 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="text-right">
              <p className="text-sm font-black text-slate-800 leading-none">{currentUser.name}</p>
              <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{currentUser.roleName}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300 shadow-sm overflow-hidden">
              <img src={currentUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`} className="w-full h-full object-cover" alt="Avatar"/>
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' ? (
          // 🌟 ส่ง filteredGlobalJobs เข้า Dashboard ด้วย
          <DashboardOverview 
            jobs={filteredGlobalJobs} 
            onMitigate={handleMitigateJob} 
            onExport={() => setShowExportModal(true)} 
            onViewJsaDetail={(job) => setSelectedJobDetail(job)}
          />
        ) : (
          <div className="flex flex-1 overflow-hidden relative">
            
            {isMobileSidebarOpen && (
              <div className="fixed inset-0 bg-slate-900/60 z-[60] md:hidden backdrop-blur-sm" onClick={() => setIsMobileSidebarOpen(false)} />
            )}

            <div className={`fixed inset-y-0 left-0 z-[70] w-[85vw] max-w-[300px] transform ${isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} md:relative ${isSidebarCollapsed ? 'md:w-[88px]' : 'md:w-[280px]'} md:translate-x-0 transition-all duration-300 h-full shrink-0`}>
              <Sidebar
                jobs={filteredGlobalJobs} // 🌟 ส่งอันที่กรองแล้วเข้า Sidebar
                savedZones={savedZones}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
                activeTab={activeTab} setActiveTab={setActiveTab}
                isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                onViewJsaDetail={(job) => setSelectedJobDetail(job)} 
                currentUser={currentUser}
                timeFilter={globalTimeFilter} // 🌟 ส่ง state เวลา
                setTimeFilter={setGlobalTimeFilter} // 🌟 รับฟังก์ชันแก้ไขเวลาจาก Dropdown ใน Sidebar
              />
            </div>

            <main ref={containerRef} className="relative flex flex-1 flex-col overflow-hidden min-w-0 bg-slate-50">
              
              <div style={{ height: `${mapHeight}%` }} className="relative w-full bg-slate-800 overflow-hidden md:border-l border-slate-200">
                {currentUser.role === 'MAKER' && (
                  <div className="absolute top-3 left-3 md:top-4 md:left-4 z-10 flex gap-2">
                    <button onClick={() => { setIsDrawingMode(true); setIsAddingMode(false); setShowAddModal(false); }} className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold rounded-lg uppercase shadow-lg transition-colors border ${isDrawingMode ? 'bg-indigo-700 text-white border-indigo-800 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500'}`}>
                      <PencilRuler className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Draw Zone</span>
                    </button>
                    <button onClick={() => { setShowJsaFormModal(true); setIsDrawingMode(false); setShowAddModal(false); }} className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold rounded-lg uppercase shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500">
                      <FileText className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Create JSA</span>
                    </button>
                  </div>
                )}

                <div className="absolute top-3 right-14 md:top-4 md:right-12 z-10 flex bg-white/90 backdrop-blur-md p-1 rounded-lg border border-slate-200 shadow-sm">
                  <button onClick={() => setMapMode('satellite')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md uppercase ${mapMode === 'satellite' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>Sat</button>
                  <button onClick={() => setMapMode('streets')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md uppercase ${mapMode === 'streets' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>Map</button>
                </div>

                <MapSection
                  jobs={filteredGlobalJobs} // 🌟 แผนที่ก็แสดงแค่งานที่โดนกรอง
                  isAddingMode={isAddingMode} isDrawingMode={isDrawingMode}
                  onLocationPick={handleLocationPick} onZoneComplete={handleZoneDrawn} onCancelDrawing={() => setIsDrawingMode(false)}
                  newPin={newPin} mapMode={mapMode} savedZones={savedZones} onViewJsaDetail={(job) => setSelectedJobDetail(job)}
                />

                {showZoneModal && pendingZone && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[400px] overflow-hidden flex flex-col animate-in zoom-in-95 border border-slate-100">
                      <div className="bg-indigo-600 p-6 text-white relative">
                        <MapPin className="w-16 h-16 absolute -right-4 -top-4 opacity-20" />
                        <h3 className="font-black text-2xl tracking-tight relative z-10">Save Zone</h3>
                        <p className="text-indigo-100 text-xs font-medium mt-1 relative z-10">บันทึกพิกัดพื้นที่ก่อสร้างใหม่</p>
                        <button onClick={() => { setShowZoneModal(false); setPendingZone(null); }} className="absolute top-4 right-4 bg-white/20 p-2 rounded-full hover:bg-white/30 transition z-10"><X className="w-4 h-4"/></button>
                      </div>
                      <div className="p-6 space-y-5">
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-2"><Building2 className="w-3.5 h-3.5 text-indigo-500" /> Project Name</label>
                          <input type="text" value={zoneForm.projectName} onChange={(e) => setZoneForm({ ...zoneForm, projectName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500"/>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-2"><Layers className="w-3.5 h-3.5 text-blue-500" /> Zone Name</label>
                          <input type="text" value={zoneForm.zoneName} onChange={(e) => setZoneForm({ ...zoneForm, zoneName: e.target.value })} placeholder="เช่น โซน A..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500"/>
                        </div>
                        <button onClick={handleSaveZoneDetails} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 mt-2">
                          <Check className="w-4 h-4" /> บันทึกโซนพื้นที่
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div 
                className={`flex h-6 md:h-4 w-full bg-slate-100 border-y border-slate-200 cursor-row-resize items-center justify-center hover:bg-slate-200 transition-colors z-10 shrink-0 ${isDragging ? 'bg-slate-200' : ''}`} 
                onMouseDown={handleDragStart} 
                onTouchStart={handleDragStart}
              >
                <div className="flex items-center justify-center w-12 h-full">
                  <GripHorizontal className="w-6 h-6 md:w-5 md:h-5 text-slate-400" />
                </div>
              </div>

              <div style={{ height: `calc(${100 - mapHeight}% - 24px)` }} className="flex flex-col flex-1 overflow-hidden bg-white md:border-l border-slate-200">
                <DataTable 
                  jobs={filteredGlobalJobs} // 🌟 ตารางข้อมูลก็แสดงแค่งานที่โดนกรองแล้ว
                  onFocusJob={(lat, lng) => console.log('Focus:', lat, lng)} 
                  onSelectJob={(job) => setSelectedJobDetail(job)} 
                />
              </div>
            </main>
          </div>
        )}
      </div>

      {showJsaFormModal && (
        <JsaAssessmentModal jobs={jobs} savedZones={savedZones} onClose={() => setShowJsaFormModal(false)} onSubmitAssessment={async (newRecord) => { 
          const { error } = await supabase.from('jsa_records').insert([newRecord]);
          if (!error) setJobs((prev) => [newRecord, ...prev]); 
        }} />
      )}
      
      {showExportModal && <JsaReportExport jobs={filteredGlobalJobs} onClose={() => setShowExportModal(false)} />}
      
      {selectedJobDetail && (
        <JsaDetailModal 
          job={selectedJobDetail} 
          currentUser={currentUser} 
          onClose={() => setSelectedJobDetail(null)}
          onUpdateStatus={handleUpdateJsaStatus} 
        />
      )}
    </>
  );
}