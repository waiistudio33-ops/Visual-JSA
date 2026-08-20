// src/components/UserProfileModal.tsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, User, Phone, HardHat, Camera, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserProfileModalProps {
  user: any;
  onClose: () => void;
  onProfileUpdate: () => void;
}

export default function UserProfileModal({ user, onClose, onProfileUpdate }: UserProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.name || '');
  
  // 🌟 จัดการเบอร์โทร: ถ้าไม่มีข้อมูลให้เป็นขีด (-)
  const [phone, setPhone] = useState(() => {
    if (!user?.phone || user.phone === 'null' || user.phone.trim() === '') return '-';
    return user.phone;
  });

  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500); 
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const isFakeUser = !user || !user.id || user.name === 'ผู้ใช้ทดสอบ (No Profile)';

  const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (isFakeUser) {
        throw new Error("บัญชี Demo ไม่อนุญาตให้อัปโหลดรูป กรุณาล็อกอินด้วยอีเมลจริงครับ");
      }

      if (!event.target.files || event.target.files.length === 0) return;
      setLoading(true);
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw new Error("ระบบฐานข้อมูลปฏิเสธการอัปโหลด: " + uploadError.message);

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);

      showToast('อัปโหลดรูปภาพสำเร็จ! กดบันทึกเพื่อยืนยันด้วยนะครับ', 'success');

    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (isFakeUser) {
        throw new Error("ไม่สามารถบันทึกได้ กรุณาล็อกอินด้วยบัญชีจริง");
      }

      setLoading(true);

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName,
        phone: phone.trim() === '' ? '-' : phone, // ถ้าลบจนว่าง ให้เซฟเป็นขีด
        avatar_url: avatarUrl,
        role: user.role || 'MAKER',
        role_name: user.roleName || 'Site Supervisor'
      });

      if (error) throw error;
      
      showToast('อัปเดตโปรไฟล์เรียบร้อยแล้ว!', 'success');
      
      setTimeout(() => {
        onProfileUpdate(); 
        onClose();
      }, 1500);

    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 font-['Inter','Kanit',sans-serif]">
      
      {toast && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[10000] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-top-10 fade-in duration-300 w-[90%] sm:w-auto max-w-sm ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="text-[13px] font-medium leading-tight">{toast.message}</span>
        </div>
      )}

      <div className="bg-white w-full max-w-[420px] max-h-[90dvh] rounded-[2rem] overflow-y-auto custom-scrollbar shadow-2xl relative flex flex-col animate-in zoom-in-95 duration-300">
        
        <div className="h-32 sm:h-36 bg-gradient-to-tr from-blue-700 via-indigo-600 to-indigo-900 relative shrink-0">
           <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,#ffffff_0%,transparent_60%)]"></div>
           <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors outline-none z-10">
             <X className="w-5 h-5"/>
           </button>
        </div>
        
        <div className="px-6 pb-8 relative shrink-0">
          
          <div className="flex flex-col items-center -mt-16 mb-6 relative z-10">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-[6px] border-white bg-slate-100 shadow-xl overflow-hidden transition-transform duration-300 group-hover:scale-105 flex items-center justify-center">
                <img src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`} className="w-full h-full object-cover" alt="Profile" />
              </div>
              
              <label className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-sm m-[6px]">
                <Camera className="w-8 h-8 mb-1" />
                <span className="text-[10px] font-bold tracking-wider uppercase">เปลี่ยนรูป</span>
                <input type="file" accept="image/*" onChange={handleUploadAvatar} disabled={loading} className="hidden" />
              </label>
            </div>
            
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mt-3 text-center line-clamp-1">{fullName || '-'}</h3>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-1 bg-slate-100 px-3 py-1 rounded-full text-center inline-block">
              {user?.roleName || 'Site Engineer'}
            </p>
          </div>

          {isFakeUser && (
            <div className="mb-5 p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium leading-relaxed">
                คุณกำลังเข้าใช้งานในโหมดทดสอบ (No Profile) ระบบไม่อนุญาตให้อัปเดตข้อมูล กรุณาออกจากระบบและล็อกอินด้วยอีเมลจริงครับ
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[12px] font-bold text-slate-700 mb-1.5 flex items-center gap-2"><User className="w-4 h-4 text-slate-400"/> ชื่อ-นามสกุล</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} disabled={isFakeUser} placeholder="-" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-[14px] font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all disabled:opacity-60"/>
            </div>
            
            {/* 🌟 ช่องเบอร์โทรที่ปรับปรุงใหม่ */}
            <div>
              <label className="text-[12px] font-bold text-slate-700 mb-1.5 flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400"/> เบอร์โทรศัพท์</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                onFocus={() => phone === '-' && setPhone('')} // พอกดพิมพ์ ขีดจะหายไป
                onBlur={() => phone.trim() === '' && setPhone('-')} // พอกดออก ถ้าไม่มีอะไรเลยให้กลับมาเป็นขีด
                disabled={isFakeUser} 
                placeholder="-" 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-[14px] font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all disabled:opacity-60"
              />
            </div>
            
            <div>
              <label className="text-[12px] font-bold text-slate-700 mb-1.5 flex items-center gap-2"><HardHat className="w-4 h-4 text-slate-400"/> ตำแหน่ง (Role)</label>
              <input type="text" value={user?.roleName || '-'} disabled className="w-full bg-slate-100/50 border border-slate-200 rounded-2xl px-4 py-3.5 text-[14px] font-semibold text-slate-400 cursor-not-allowed"/>
            </div>
          </div>

          <div className="mt-8">
            <button onClick={handleSaveProfile} disabled={loading || isFakeUser} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl flex justify-center items-center gap-2 transition-all active:scale-95 shadow-xl shadow-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed outline-none text-[14px]">
              {loading ? <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> กำลังบันทึก...</> : <><Check className="w-5 h-5"/> บันทึกการเปลี่ยนแปลง</>}
            </button>
          </div>

        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}