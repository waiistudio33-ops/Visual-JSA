// src/components/LoginScreen.tsx
import { useState } from 'react';
import { User, Lock, ShieldCheck, Phone, CreditCard, MessageCircle, Smartphone, ArrowLeft, KeySquare, Mail, HardHat, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export type UserRole = 'MAKER' | 'CHECKER' | 'APPROVER';

// 🔑 Mockup Credentials
const DEMO_ACCOUNTS = [
  { 
    role: 'MAKER', name: 'ช่างสมชาย', email: 'maker@demo.com', password: 'password123', icon: User,
    activeClass: 'bg-indigo-600 text-white shadow-[0_8px_16px_rgba(79,70,229,0.3)] ring-2 ring-indigo-600 ring-offset-2',
    inactiveClass: 'bg-white text-slate-600 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
  },
  { 
    role: 'CHECKER', name: 'จป. สมหญิง', email: 'checker@demo.com', password: 'password123', icon: ShieldCheck,
    activeClass: 'bg-emerald-600 text-white shadow-[0_8px_16px_rgba(16,185,129,0.3)] ring-2 ring-emerald-600 ring-offset-2',
    inactiveClass: 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'
  },
  { 
    role: 'APPROVER', name: 'ผอ. สมศักดิ์', email: 'approver@demo.com', password: 'password123', icon: KeySquare,
    activeClass: 'bg-rose-600 text-white shadow-[0_8px_16px_rgba(225,29,72,0.3)] ring-2 ring-rose-600 ring-offset-2',
    inactiveClass: 'bg-white text-slate-600 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
  },
];

interface LoginScreenProps {
  onDemoLogin?: (account: typeof DEMO_ACCOUNTS[number]) => void;
}

export default function LoginScreen({ onDemoLogin }: LoginScreenProps) {
  const [viewMode, setViewMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [empId, setEmpId] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerRole, setRegisterRole] = useState<UserRole>('MAKER');

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500); 
  };

  const switchView = (mode: 'LOGIN' | 'REGISTER') => {
    setViewMode(mode);
    if (mode === 'REGISTER') {
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  };

  // 🌟 ฟังก์ชันจัดการ Demo โดยเฉพาะ (ข้าม Auth 100%)
  const handleDemoAccess = (acc: typeof DEMO_ACCOUNTS[number]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    if (onDemoLogin) {
      onDemoLogin(acc); // 🔑 เข้าสู่ระบบทันทีโดยไม่แตะ Supabase ลดปัญหา 500
    }
  };

  const getRoleName = (r: UserRole) => {
    if (r === 'MAKER') return 'Site Supervisor';
    if (r === 'CHECKER') return 'Safety Engineer';
    return 'Project Manager';
  };

  // 🌟 สร้างผู้ใช้จริงผ่าน Frontend (ปลอดภัยจาก Trigger Error 500)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast('รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง', 'error');
      return;
    }
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;
      
      if (authData.user) {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          full_name: fullName,
          employee_id: empId,
          phone: phone,
          role: registerRole,
          role_name: getRoleName(registerRole)
        });
      }
      
      showToast('สร้างบัญชีสำเร็จ! ระบบได้นำข้อมูลไปเตรียมไว้หน้า Login แล้ว', 'success');
      setViewMode('LOGIN');
    } catch (error: any) {
      showToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🌟 ดักจับบัญชี Demo! ถ้าพิมพ์อีเมล Demo ให้ข้าม Supabase ทันที
    const demoAcc = DEMO_ACCOUNTS.find(a => a.email === email);
    if (demoAcc) {
      if (onDemoLogin) onDemoLogin(demoAcc);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      showToast('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('กรุณากรอกอีเมลของคุณในช่อง Email Address ก่อน', 'error');
      return;
    }
    showToast('ระบบได้จำลองการส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว (Demo Mode)', 'info');
  };

  const handleLineLogin = async () => {
    showToast('ฟังก์ชัน LINE Login กำลังอยู่ระหว่างการพัฒนา', 'info');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Prompt:wght@300;400;500;600;700&display=swap');
        .font-modern { font-family: 'Poppins', 'Prompt', sans-serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .font-modern, .font-modern * { -webkit-tap-highlight-color: transparent; }
        .font-modern input { font-size: 16px; }
        @supports (-webkit-touch-callout: none) {
          .font-modern input { font-size: 16px !important; }
        }
      `}</style>

      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[#f0f4f8] sm:p-4 md:p-6 lg:p-8 font-modern relative">
        
        {toast && (
          <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[1000] flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-2xl animate-in slide-in-from-top-10 fade-in duration-300 w-[90%] sm:w-auto max-w-md ${toast.type === 'success' ? 'bg-emerald-600 text-white' : toast.type === 'info' ? 'bg-blue-600 text-white' : 'bg-rose-600 text-white'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span className="text-[14px] font-medium leading-tight">{toast.message}</span>
          </div>
        )}

        <div className={`w-full min-h-[100dvh] sm:min-h-[600px] lg:h-[700px] ${viewMode !== 'LOGIN' ? 'max-w-[1100px]' : 'max-w-[1000px]'} bg-white sm:rounded-[2.5rem] shadow-none sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col lg:flex-row overflow-hidden relative transition-all duration-500 ease-out`}>
          
          <div 
            className="w-full lg:w-[40%] xl:w-[45%] h-[180px] sm:h-[220px] md:h-[260px] lg:h-full relative flex flex-col items-center justify-center overflow-hidden shrink-0 border-b lg:border-b-0 lg:border-r border-slate-100"
            style={{ 
              backgroundColor: '#ffffff', 
              backgroundImage: `radial-gradient(circle at 10% 10%, rgba(59, 130, 246, 0.45) 0%, transparent 60%), radial-gradient(circle at 90% 10%, rgba(16, 185, 129, 0.35) 0%, transparent 60%), radial-gradient(circle at 10% 90%, rgba(244, 63, 94, 0.35) 0%, transparent 60%), radial-gradient(circle at 90% 90%, rgba(234, 179, 8, 0.35) 0%, transparent 60%)` 
            }}
          >
            <svg className="hidden lg:block absolute right-0 top-0 h-full w-[80px] text-white z-10 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100" fill="currentColor"><path d="M100,0 L100,100 L0,100 C 60,70 40,30 0,0 Z" /></svg>
            <svg className="lg:hidden absolute bottom-[-1px] left-0 w-full h-[40px] md:h-[56px] text-white z-10 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100" fill="currentColor"><path d="M0,100 L100,100 L100,0 C 70,60 30,40 0,0 Z" /></svg>

            <div className="z-20 flex flex-col items-center justify-center rounded-[2rem] w-[200px] h-[120px] sm:w-[240px] sm:h-[240px] p-6 text-center border border-white/60 shadow-[0_16px_40px_rgba(0,0,0,0.06)] transition-transform hover:scale-105 duration-300" style={{ background: 'rgba(255, 255, 255, 0.5)', backdropFilter: 'blur(16px)' }}>
              <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm mb-2 sm:mb-4 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight m-0 drop-shadow-sm leading-none">Visual<span className="text-[#2563eb]">JSA</span></h1>
              <p className="text-slate-500 font-bold mt-1 sm:mt-1.5 tracking-widest uppercase text-[9px] sm:text-[10px]">Risk Management</p>
            </div>
          </div>

          <div className="w-full lg:w-[60%] xl:w-[55%] p-6 pt-10 sm:p-10 md:p-12 lg:p-14 flex flex-col justify-center bg-white z-20 relative overflow-y-auto flex-1 custom-scrollbar rounded-t-[2.5rem] lg:rounded-none -mt-8 lg:mt-0">
            
            {viewMode === 'LOGIN' && (
              <div className="w-full max-w-[400px] mx-auto text-left animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8 md:pb-0">
                <h2 className="text-[26px] sm:text-[32px] font-bold text-slate-900 mb-1.5 tracking-tight leading-tight">เข้าสู่ระบบ</h2>
                <p className="text-slate-500 font-normal text-[13px] sm:text-[14px] mb-8 leading-relaxed">กรุณายืนยันตัวตน หรือใช้บัญชีทดลอง (Demo) ด้านล่าง</p>

                <div className="mb-8">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-1.5">
                    <KeySquare className="w-3.5 h-3.5" /> Quick Access (Demo)
                  </span>
                  <div className="flex gap-2.5 overflow-x-auto sm:overflow-x-visible sm:flex-wrap hide-scrollbar pb-3 sm:pb-1 px-1 -ml-1 sm:ml-0">
                    {DEMO_ACCOUNTS.map((acc) => {
                      const Icon = acc.icon;
                      return (
                        <button
                          key={acc.role}
                          type="button"
                          onClick={() => handleDemoAccess(acc)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-[12px] font-medium transition-all shrink-0 active:scale-95 outline-none whitespace-nowrap touch-manipulation
                            ${email === acc.email ? acc.activeClass : acc.inactiveClass}`}
                        >
                          <Icon className="w-4 h-4" />
                          {acc.name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-[12px] text-slate-700 font-semibold mb-1.5 block">อีเมล (Email)</label>
                    <div className="relative group">
                      <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      <input required type="email" inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" className="w-full h-[52px] pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-[16px] text-[16px] font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all"/>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[12px] text-slate-700 font-semibold block">รหัสผ่าน (Password)</label>
                      <button type="button" onClick={handleForgotPassword} className="text-blue-600 hover:text-blue-700 text-[12px] font-medium transition-colors outline-none touch-manipulation">ลืมรหัสผ่าน?</button>
                    </div>
                    <div className="relative group">
                      <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      <input required type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={`w-full h-[52px] pl-12 pr-12 bg-slate-50 border border-slate-200 rounded-[16px] text-[16px] font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all ${!showPassword && password ? 'tracking-[0.2em]' : ''}`}/>
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:text-blue-600 outline-none transition-colors touch-manipulation">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="w-full h-[52px] bg-[#0f172a] hover:bg-slate-800 text-white font-medium rounded-[16px] mt-6 text-[15px] shadow-[0_8px_20px_rgba(15,23,42,0.15)] hover:shadow-[0_12px_24px_rgba(15,23,42,0.2)] hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2 outline-none touch-manipulation">
                    {loading ? (
                      <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> กำลังเข้าสู่ระบบ...</>
                    ) : 'Sign In'}
                  </button>
                </form>

                <div className="flex items-center gap-4 my-7 opacity-70">
                  <div className="flex-1 h-px bg-slate-200"></div>
                  <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest">Or continue with</span>
                  <div className="flex-1 h-px bg-slate-200"></div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button type="button" onClick={handleLineLogin} disabled={loading} className="h-[48px] rounded-[14px] font-semibold text-slate-700 bg-white border border-slate-200 hover:border-[#00C300] hover:bg-[#00C300]/5 flex items-center justify-center gap-2 group transition-all text-[13px] outline-none touch-manipulation">
                    <MessageCircle className="w-4 h-4 text-[#00C300] group-hover:scale-110 transition-transform" /> LINE
                  </button>
                  <button type="button" onClick={() => showToast('ฟังก์ชัน SSO กำลังอยู่ระหว่างการพัฒนา', 'info')} className="h-[48px] rounded-[14px] font-semibold text-slate-700 bg-white border border-slate-200 hover:border-[#00a4ef] hover:bg-[#00a4ef]/5 flex items-center justify-center gap-2 group transition-all text-[13px] outline-none touch-manipulation">
                    <Smartphone className="w-4 h-4 text-[#00a4ef] group-hover:scale-110 transition-transform" /> SSO
                  </button>
                </div>
                
                <div className="mt-8 text-center text-[14px] font-normal text-slate-500">
                  ยังไม่มีบัญชีผู้ใช้? <button type="button" onClick={() => switchView('REGISTER')} className="text-blue-600 font-semibold hover:text-blue-800 transition-colors ml-1 outline-none touch-manipulation">สมัครสมาชิก</button>
                </div>
              </div>
            )}

            {viewMode === 'REGISTER' && (
              <div className="w-full max-w-[480px] mx-auto text-left animate-in fade-in slide-in-from-right-8 duration-500 pb-8 md:pb-0 relative pt-2">
                <button onClick={() => switchView('LOGIN')} className="mb-5 sm:mb-6 text-slate-400 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-full transition-colors flex items-center justify-center outline-none w-max touch-manipulation">
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <h2 className="text-[26px] sm:text-[32px] font-bold text-slate-900 mb-1.5 tracking-tight leading-tight">สร้างบัญชีผู้ใช้</h2>
                <p className="text-slate-500 font-normal text-[13px] sm:text-[14px] mb-6 sm:mb-8 leading-relaxed">กรอกข้อมูลพื้นฐานเพื่อเปิดใช้งานระบบเต็มรูปแบบ</p>

                <form onSubmit={handleRegister}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 md:gap-x-5 gap-y-4 sm:gap-y-5 mb-6">
                    
                    <div className="sm:col-span-2 mb-2">
                      <label className="text-[12px] text-slate-700 font-semibold mb-2 block">เลือกบทบาท (Role)</label>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                        <button type="button" onClick={() => setRegisterRole('MAKER')} className={`h-[56px] sm:h-[64px] rounded-2xl text-[11px] sm:text-[12px] font-semibold flex flex-col items-center justify-center border transition-all touch-manipulation ${registerRole === 'MAKER' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/20' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}><HardHat className="w-4 h-4 sm:w-5 sm:h-5 mb-1"/> Maker</button>
                        <button type="button" onClick={() => setRegisterRole('CHECKER')} className={`h-[56px] sm:h-[64px] rounded-2xl text-[11px] sm:text-[12px] font-semibold flex flex-col items-center justify-center border transition-all touch-manipulation ${registerRole === 'CHECKER' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}><ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 mb-1"/> Checker</button>
                        <button type="button" onClick={() => setRegisterRole('APPROVER')} className={`h-[56px] sm:h-[64px] rounded-2xl text-[11px] sm:text-[12px] font-semibold flex flex-col items-center justify-center border transition-all touch-manipulation ${registerRole === 'APPROVER' ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}><KeySquare className="w-4 h-4 sm:w-5 sm:h-5 mb-1"/> Approver</button>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[12px] text-slate-700 font-semibold mb-1.5 block">ชื่อ-นามสกุล (Full Name)</label>
                      <div className="relative group">
                        <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input required type="text" autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="เช่น สมชาย ใจดี" className="w-full h-[52px] pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-[16px] text-[16px] font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all"/>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-[12px] text-slate-700 font-semibold mb-1.5 block">รหัสพนักงาน (Emp ID)</label>
                      <div className="relative group">
                        <CreditCard className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input required type="text" value={empId} onChange={e => setEmpId(e.target.value)} placeholder="เช่น EMP-12345" className="w-full h-[52px] pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-[16px] text-[16px] font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all"/>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-[12px] text-slate-700 font-semibold mb-1.5 block">เบอร์โทร (Phone)</label>
                      <div className="relative group">
                        <Phone className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="081-xxx-xxxx" className="w-full h-[52px] pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-[16px] text-[16px] font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all"/>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[12px] text-slate-700 font-semibold mb-1.5 block">อีเมล (Email)</label>
                      <div className="relative group">
                        <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input required type="email" inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" className="w-full h-[52px] pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-[16px] text-[16px] font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all"/>
                      </div>
                    </div>

                    <div>
                      <label className="text-[12px] text-slate-700 font-semibold mb-1.5 block">รหัสผ่าน (Password)</label>
                      <div className="relative group">
                        <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input required type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="6 ตัวอักษรขึ้นไป" className={`w-full h-[52px] pl-12 pr-12 bg-slate-50 border border-slate-200 rounded-[16px] text-[16px] font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all ${!showPassword && password ? 'tracking-[0.1em]' : ''}`}/>
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:text-blue-600 outline-none transition-colors touch-manipulation">
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[12px] text-slate-700 font-semibold mb-1.5 block">ยืนยันรหัส (Confirm)</label>
                      <div className="relative group">
                        <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input required type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="พิมพ์อีกครั้ง" className={`w-full h-[52px] pl-12 pr-12 bg-slate-50 border border-slate-200 rounded-[16px] text-[16px] font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all ${!showConfirmPassword && confirmPassword ? 'tracking-[0.1em]' : ''}`}/>
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:text-blue-600 outline-none transition-colors touch-manipulation">
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="w-full h-[52px] bg-[#0f172a] hover:bg-slate-800 text-white font-medium rounded-[16px] mt-2 text-[15px] shadow-[0_8px_20px_rgba(15,23,42,0.15)] hover:shadow-[0_12px_24px_rgba(15,23,42,0.2)] hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2 outline-none touch-manipulation">
                    {loading ? (
                      <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> กำลังสร้างบัญชี...</>
                    ) : 'สร้างบัญชี (Sign Up)'}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}