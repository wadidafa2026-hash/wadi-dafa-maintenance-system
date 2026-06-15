// client/src/pages/Fleet.tsx
import React, { useState, useEffect } from 'react';
import { AddEquipmentModal } from '../components/AddEquipmentModal';
import { EquipmentProfileModal } from '../components/EquipmentProfileModal';

interface Equipment {
  id: number;
  code: string;
  name: string;
  model: string | null;
  type: 'equipment' | 'vehicle';
  serialNumber: string | null;
  plateNumber: string | null;
  status: 'available' | 'broken' | 'out_of_service';
  projectName: string | null; 
}

interface FleetProps {
  userRole: 'super_admin' | 'sub_admin' | 'viewer'; 
  isDarkMode: boolean;
}

export const Fleet: React.FC<FleetProps> = ({ userRole, isDarkMode }) => {
  // ─── حالات التحكم في واجهة العرض الخاصة بالأسطول ─────────────────
  const [fleetTab, setFleetTab] = useState<'equipment' | 'vehicle'>('equipment');
  const [searchQuery, setSearchQuery] = useState('');
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);

  // ─── حالات المودالات (Modals) ────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // 1️⃣ مودال تسجيل عطل لحظي (مطور)
  const [isFaultModalOpen, setIsFaultModalOpen] = useState(false);
  const [faultEquipment, setFaultEquipment] = useState<Equipment | null>(null);
  const [breakdownDate, setBreakdownDate] = useState(''); 
  const [faultDetails, setFaultDetails] = useState('');
  const [submittingFault, setSubmittingFault] = useState(false);
  const [faultError, setFaultError] = useState<string | null>(null);

  // 2️⃣ مودال تسجيل تم الإصلاح والجاهزية (جديد كلياً)
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [repairEquipment, setRepairEquipment] = useState<Equipment | null>(null);
  const [repairDate, setRepairDate] = useState('');
  const [submittingRepair, setSubmittingRepair] = useState(false);
  const [repairError, setRepairError] = useState<string | null>(null);

  // جلب الآليات من الباك إند
  const fetchEquipmentData = async () => {
    setLoading(true);
    const baseUrl = import.meta.env.VITE_API_URL || ""; 
    try {
      const resEquip = await fetch(`${baseUrl}/api/equipment`);
      if (resEquip.ok) {
        const data = await resEquip.json();
        setEquipmentList(data);
      }
    } catch (error) {
      console.error('Error fetching equipment data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipmentData();
  }, []);

  // دالة معالجة تسجيل العطل (بريك داون)
  const handleRegisterFault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faultEquipment) return;
    
    setSubmittingFault(true);
    setFaultError(null);
    const baseUrl = import.meta.env.VITE_API_URL || ""; 

    const payload = {
      equipmentId: faultEquipment.id,
      breakdownDate, 
      details: faultDetails.trim() || null
    };

    try {
      const response = await fetch(`${baseUrl}/api/maintenance/breakdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setIsFaultModalOpen(false);
        setFaultDetails(''); 
        setBreakdownDate(''); 
        fetchEquipmentData(); // تحديث فوري للكروت
      } else {
        const errData = await response.json();
        setFaultError(errData.error || 'فشل في تسجيل بلاغ العطل.');
      }
    } catch (err) {
      console.error(err);
      setFaultError('⚠️ فشل الاتصال بالسيرفر.');
    } finally {
      setSubmittingFault(false);
    }
  };

  // 🛠️ دالة معالجة "تم الإصلاح" المربوطة براوت السيرفر الذكي
  const handleRegisterRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repairEquipment) return;

    setSubmittingRepair(true);
    setRepairError(null);
    const baseUrl = import.meta.env.VITE_API_URL || "";

    try {
      // أولاً: جلب الهيستوري للمعدة عشان نعرف الـ logId بتاع العطل المفتوح الحالي (الحالة broken)
      const resHistory = await fetch(`${baseUrl}/api/maintenance/history/${repairEquipment.id}`);
      if (!resHistory.ok) throw new Error('فشل في جلب سجل الصيانة للمعدة');
      
      const historyData = await resHistory.json();
      // البحث عن أول سجل حالته broken لإغلاقه
      const activeLog = historyData.find((log: any) => log.status === 'broken');

      if (!activeLog) {
        setRepairError('⚠️ لم يتم العثور على بلاغ عطل مفتوح لهذه المعدة بالسيرفر.');
        setSubmittingRepair(false);
        return;
      }

      // ثانياً: إرسال تاريخ الإصلاح لراوت الـ PUT المقابل في السيرفر
      const response = await fetch(`${baseUrl}/api/maintenance/repair/${activeLog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repairDate })
      });

      if (response.ok) {
        setIsRepairModalOpen(false);
        setRepairDate('');
        fetchEquipmentData(); // ترجع المعدة "جاهز للعمل" ويتحول الزر تلقائياً
      } else {
        const errData = await response.json();
        setRepairError(errData.error || 'فشل في تحديث حالة الإصلاح.');
      }
    } catch (err) {
      console.error(err);
      setRepairError('⚠️ حدث خطأ أثناء الاتصال بالسيرفر لإصلاح المعدة.');
    } finally {
      setSubmittingRepair(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* التابات العلوية */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8 font-black text-md justify-center md:justify-start">
        <button onClick={() => setFleetTab('equipment')} className={`pb-3 transition-all border-0 bg-transparent cursor-pointer font-sans text-md ${fleetTab === 'equipment' ? 'border-b-4 border-solid border-blue-500 text-blue-500 font-black' : 'text-slate-400 font-bold'}`}>⚙️ قسم المعدات الثقيلة</button>
        <button onClick={() => setFleetTab('vehicle')} className={`pb-3 transition-all border-0 bg-transparent cursor-pointer font-sans text-md ${fleetTab === 'vehicle' ? 'border-b-4 border-solid border-blue-500 text-blue-500 font-black' : 'text-slate-400 font-bold'}`}>🚚 قسم المركبات والسيارات</button>
      </div>

      {/* شريط البحث وزر الإضافة */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-slate-500/5 p-4 rounded-xl">
        <input type="text" placeholder={fleetTab === 'equipment' ? "🔍 ابحث عن معدة برقم الكود..." : "🔍 ابحث عن مركبة برقم الكود..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full md:max-w-md px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-500 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`} />
        {userRole !== 'viewer' && (
          <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md border-0 cursor-pointer transition-all">
            {fleetTab === 'equipment' ? '➕ إضافة معدة جديدة' : '➕ إضافة مركبة جديدة'}
          </button>
        )}
      </div>

      {/* عرض كروت الأسطول */}
      {loading ? (
        <p className="text-center text-xs text-slate-400 animate-pulse">جاري سحب بيانات الأسطول من السيرفر...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipmentList
            .filter(item => item.type === fleetTab && item.code.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((item) => (
              <div key={item.id} className={`p-5 rounded-2xl border flex flex-col justify-between hover:shadow-md transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="cursor-pointer space-y-3" onClick={() => { setSelectedEquipment(item); setIsProfileModalOpen(true); }}>
                  <div className="flex justify-between items-start">
                    <span className="text-md font-black text-blue-600 uppercase tracking-wider">{item.code}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.status === 'available' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {item.status === 'available' ? 'جاهز للعمل' : 'تعطلت'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm m-0">{item.name}</h4>
                    <p className="text-xs text-slate-400 m-0 mt-1">
                      {item.type === 'equipment' ? `🔢 السيريال: ${item.serialNumber || '⚠️ غير مسجل'}` : `🔢 اللوحة: ${item.plateNumber || '⚠️ غير مسجل'}`}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-solid border-slate-500/10 flex justify-between items-center text-xs text-slate-400">
                    <span>📍 الموقع الحالي:</span>
                    <span className="font-bold text-slate-500 dark:text-slate-300">{item.projectName || 'في الورشة الرئيسية'}</span>
                  </div>
                </div>
                
                {/* 🔄 الأزرار التبادلية الذكية حسب حالة المعدة */}
                {userRole !== 'viewer' && (
                  <div className="mt-4 pt-3 border-t border-solid border-slate-500/10 flex gap-2 justify-end">
                    {item.status === 'available' ? (
                      <button onClick={(e) => { e.stopPropagation(); setFaultEquipment(item); setIsFaultModalOpen(true); }} className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 text-[11px] px-4 py-2 rounded-lg font-bold transition-all border-0 cursor-pointer">
                        ⚠️ تعطلت / صيانة
                      </button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); setRepairEquipment(item); setIsRepairModalOpen(true); }} className="bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-500 text-[11px] px-4 py-2 rounded-lg font-bold transition-all border-0 cursor-pointer">
                        ✅ تم الإصلاح والجاهزية
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* ⚠️ مودال فتح بلاغ عطل طارئ (مطور بمساحة نصية واسعة جداً) */}
      {isFaultModalOpen && faultEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleRegisterFault} className={`w-full max-w-lg p-6 rounded-2xl border border-solid shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'}`}>
            <div>
              <h3 className="text-md font-black text-red-500 m-0">⚠️ فتح بلاغ عطل وصيانة للآلية</h3>
              <p className="text-xs text-slate-400 m-0 mt-0.5">يرتبط تلقائياً بكود الآلية <span className="text-blue-500 font-bold">{faultEquipment.code}</span> وسيأخذ لقطة للمشروع الحالي تلقائياً من السيرفر.</p>
            </div>

            {faultError && <div className="p-3 text-xs font-bold bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">{faultError}</div>}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block">تاريخ وقوع العطل <span className="text-red-500">*</span>:</label>
              <input type="date" required value={breakdownDate} onChange={(e) => setBreakdownDate(e.target.value)} className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block">تفاصيل ووصف العطل الفني (اكتب بالتفصيل وبدون قيود):</label>
              {/* 📝 مساحة نصية مفتوحة للمقالات ومريحة للكتابة والـ Resize */}
              <textarea rows={8} placeholder="مثال: خراطيم الهيدروليك طرشت، أو الليتر اتعطل بالكامل ويحتاج استبدال..." value={faultDetails} onChange={(e) => setFaultDetails(e.target.value)} className={`w-full px-4 py-3 text-xs rounded-xl border outline-none min-h-[150px] font-sans leading-relaxed ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-red-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-red-500'}`} />
            </div>

            <div className="flex justify-end gap-3 pt-2 items-center">
              <button type="button" onClick={() => { setIsFaultModalOpen(false); setFaultError(null); }} disabled={submittingFault} className="text-xs text-slate-400 bg-transparent border-0 cursor-pointer font-bold">إلغاء</button>
              <button type="submit" disabled={submittingFault} className="bg-red-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md border-0 cursor-pointer hover:bg-red-700 disabled:bg-red-800">
                {submittingFault ? 'جاري الحفظ حياً...' : '💾 تسجيل العطل في قاعدة البيانات'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ✅ مودال تم الإصلاح والجاهزية (الجديد كلياً) */}
      {isRepairModalOpen && repairEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleRegisterRepair} className={`w-full max-w-md p-6 rounded-2xl border border-solid shadow-2xl space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'}`}>
            <div>
              <h3 className="text-md font-black text-emerald-500 m-0">✅ إغلاق بلاغ الصيانة وإعادة الجاهزية</h3>
              <p className="text-xs text-slate-400 m-0 mt-0.5">سيتم تحويل حالة الآلية <span className="text-blue-500 font-bold">{repairEquipment.code}</span> إلى جاهزة للعمل وتوثيق تاريخ الإصلاح.</p>
            </div>

            {repairError && <div className="p-3 text-xs font-bold bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">{repairError}</div>}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block">تاريخ إتمام الإصلاح والجاهزية الفعلي <span className="text-emerald-500">*</span>:</label>
              <input type="date" required value={repairDate} onChange={(e) => setRepairDate(e.target.value)} className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
            </div>

            <div className="flex justify-end gap-3 pt-2 items-center">
              <button type="button" onClick={() => { setIsRepairModalOpen(false); setRepairError(null); }} disabled={submittingRepair} className="text-xs text-slate-400 bg-transparent border-0 cursor-pointer font-bold">إلغاء</button>
              <button type="submit" disabled={submittingRepair} className="bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md border-0 cursor-pointer hover:bg-emerald-700 disabled:bg-emerald-800">
                {submittingRepair ? 'جاري التحديث حياً...' : '💾 تأكيد الإصلاح وإعادة للخدمة'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* المودالات الملحقة الأخرى */}
      <AddEquipmentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} type={fleetTab} onSuccess={fetchEquipmentData} isDarkMode={isDarkMode} />
      <EquipmentProfileModal equipment={selectedEquipment} isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onRefresh={fetchEquipmentData} userRole={userRole} isDarkMode={isDarkMode} />

    </div>
  );
};
