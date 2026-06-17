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
  currentProjectId?: number | null;
  projectName: string | null;
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
  codeImageUrl?: string | null;
}

interface FleetProps {
  userRole: 'super_admin' | 'sub_admin' | 'viewer'; 
  isDarkMode: boolean;
}

export const Fleet: React.FC<FleetProps> = ({ userRole, isDarkMode }) => {
  const [fleetTab, setFleetTab] = useState<'equipment' | 'vehicle'>('equipment');
  const [searchQuery, setSearchQuery] = useState('');
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const [isFaultModalOpen, setIsFaultModalOpen] = useState(false);
  const [faultEquipment, setFaultEquipment] = useState<Equipment | null>(null);
  const [breakdownDate, setBreakdownDate] = useState(''); 
  const [faultDetails, setFaultDetails] = useState('');
  const [submittingFault, setSubmittingFault] = useState(false);
  const [faultError, setFaultError] = useState<string | null>(null);

  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [repairEquipment, setRepairEquipment] = useState<Equipment | null>(null);
  const [repairDate, setRepairDate] = useState('');
  const [submittingRepair, setSubmittingRepair] = useState(false);
  const [repairError, setRepairError] = useState<string | null>(null);

  const getTodayDateString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (isFaultModalOpen) setBreakdownDate(getTodayDateString());
  }, [isFaultModalOpen]);

  useEffect(() => {
    if (isRepairModalOpen) setRepairDate(getTodayDateString());
  }, [isRepairModalOpen]);

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

  const handleRegisterFault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faultEquipment) return;
    setSubmittingFault(true);
    setFaultError(null);
    const baseUrl = import.meta.env.VITE_API_URL || ""; 

    try {
      const response = await fetch(`${baseUrl}/api/maintenance/breakdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipmentId: faultEquipment.id, breakdownDate, details: faultDetails.trim() || null })
      });
      if (response.ok) {
        setIsFaultModalOpen(false);
        setFaultDetails('');
        fetchEquipmentData();
      } else {
        const errData = await response.json();
        setFaultError(errData.error || 'فشل في تسجيل بلاغ العطل.');
      }
    } catch (err) {
      setFaultError('فشل الاتصال بالنظام لتوثيق البيانات.');
    } finally {
      setSubmittingFault(false);
    }
  };

  const handleRegisterRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repairEquipment) return;
    setSubmittingRepair(true);
    setRepairError(null);
    const baseUrl = import.meta.env.VITE_API_URL || "";

    try {
      const resHistory = await fetch(`${baseUrl}/api/maintenance/history/${repairEquipment.id}`);
      if (!resHistory.ok) throw new Error('فشل استدعاء السجل');
      const historyData = await resHistory.json();
      const activeLog = historyData.find((log: any) => log.status === 'broken');

      if (!activeLog) {
        setRepairError('لم يتم العثور على بلاغ عطل مفتوح.');
        setSubmittingRepair(false);
        return;
      }

      const response = await fetch(`${baseUrl}/api/maintenance/repair/${activeLog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repairDate })
      });

      if (response.ok) {
        setIsRepairModalOpen(false);
        fetchEquipmentData();
      } else {
        const errData = await response.json();
        setRepairError(errData.error || 'فشل تحديث الجاهزية.');
      }
    } catch (err) {
      setRepairError('حدث خطأ أثناء الاتصال بالنظام.');
    } finally {
      setSubmittingRepair(false);
    }
  };

  const filteredList = equipmentList.filter(
    item => item.type === fleetTab && item.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const brokenItems = filteredList.filter(item => item.status !== 'available');
  const availableItems = filteredList.filter(item => item.status === 'available');

  const RenderGroupTable = ({ items, title, isAlertGroup }: { items: Equipment[], title: string, isAlertGroup: boolean }) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3 pt-2">
        <h4 className={`text-base md:text-lg font-black px-1 flex items-center gap-2 ${isAlertGroup ? 'text-red-600 animate-pulse' : 'text-emerald-600'}`}>
          {title} ({items.length})
        </h4>
        
        {/* العرض للشاشات الكبيرة (الكمبيوتر وعبر الأسطر) */}
        <div className={`hidden md:block overflow-x-auto rounded-xl border-2 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white shadow-sm'}`}>
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className={`border-b ${isDarkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'} text-xs md:text-sm font-black`}>
                <th className="p-3">كود الآلية</th>
                <th className="p-3">اسم المعدة / المركبة</th>
                <th className="p-3">البيان (اللوحة / السيريال)</th>
                <th className="p-3">الموقع/المشروع الميداني</th>
                <th className="p-3 text-center">الحالة</th>
                {userRole !== 'viewer' && <th className="p-3 text-left">الإجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => { setSelectedEquipment(item); setIsProfileModalOpen(true); }}
                  className={`cursor-pointer border-b text-sm font-bold transition-all ${
                    isAlertGroup 
                      ? (isDarkMode ? 'bg-red-950/30 border-red-900/50 text-red-200 hover:bg-red-950/50' : 'bg-red-50 border-red-100 text-red-950 hover:bg-red-100/50') 
                      : (isDarkMode ? 'border-slate-800 text-slate-200 hover:bg-slate-800/50' : 'border-slate-200 text-slate-900 hover:bg-slate-50')
                  }`}
                >
                  <td className="p-3 font-black uppercase text-blue-700 dark:text-blue-400">{item.code}</td>
                  <td className="p-3 font-black">{item.name}</td>
                  <td className="p-3 text-xs font-sans">{item.type === 'equipment' ? `S/N: ${item.serialNumber || '---'}` : `لوحة: ${item.plateNumber || '---'}`}</td>
                  <td className="p-3 text-xs opacity-90">{item.projectName || 'الورشة المركزية'}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-black ${isAlertGroup ? 'bg-red-600 text-white' : 'bg-emerald-200 text-emerald-950 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                      {isAlertGroup ? 'معطلة' : 'جاهز'}
                    </span>
                  </td>
                  {userRole !== 'viewer' && (
                    <td className="p-3 text-left">
                      {isAlertGroup ? (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); // 🛡️ منع فتح البروفايل فوراً
                            setRepairEquipment(item); 
                            setIsRepairModalOpen(true); 
                          }} 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg font-black border-0 cursor-pointer shadow-md"
                        >
                          إصلاح وجاهزية 🟢
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); // 🛡️ منع فتح البروفايل فوراً
                            setFaultEquipment(item); 
                            setIsFaultModalOpen(true); 
                          }} 
                          className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg font-black border-0 cursor-pointer shadow-md"
                        >
                          تسجيل عطل 🔴
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* كروت مرنة ومتوافقة للجوال */}
        <div className="block md:hidden space-y-3">
          {items.map((item) => (
            <div 
              key={item.id}
              onClick={() => { setSelectedEquipment(item); setIsProfileModalOpen(true); }}
              className={`p-4 rounded-xl border-2 flex flex-col gap-2 shadow-sm ${
                isAlertGroup 
                  ? (isDarkMode ? 'bg-red-950/30 border-red-900 text-red-200' : 'bg-red-50 border-red-200 text-red-950') 
                  : (isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-900')
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-black uppercase text-blue-700 dark:text-blue-400">{item.code}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-black ${isAlertGroup ? 'bg-red-600 text-white' : 'bg-emerald-200 text-emerald-950'}`}>
                  {isAlertGroup ? 'معطلة' : 'جاهز'}
                </span>
              </div>
              <div>
                <h5 className="text-sm font-black m-0">{item.name}</h5>
                <p className="text-xs m-0 mt-1 opacity-75 font-sans">
                  {item.type === 'equipment' ? `S/N: ${item.serialNumber || 'لا يوجد'}` : `لوحة: ${item.plateNumber || 'لا يوجد'}`}
                </p>
                <p className="text-xs m-0 mt-1.5 font-bold">
                  الموقع: <span className="text-blue-800 dark:text-blue-300 font-black">{item.projectName || 'الورشة المركزية'}</span>
                </p>
              </div>
              {userRole !== 'viewer' && (
                <div className="pt-2 border-t border-solid border-slate-300/30 flex justify-end">
                  {isAlertGroup ? (
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); // 🛡️ منع فتح البروفايل فوراً
                        setRepairEquipment(item); 
                        setIsRepairModalOpen(true); 
                      }} 
                      className="w-full bg-emerald-600 text-white text-xs py-2 rounded-lg font-black border-0 cursor-pointer"
                    >
                      إصلاح وإعادة الخدمة 🟢
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); // 🛡️ منع فتح البروفايل فوراً
                        setFaultEquipment(item); 
                        setIsFaultModalOpen(true); 
                      }} 
                      className="w-full bg-red-600 text-white text-xs py-2 rounded-lg font-black border-0 cursor-pointer"
                    >
                      تسجيل بلاغ عطل 🔴
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full box-border" dir="rtl">
      
      <div className="flex border-b-2 border-slate-200 dark:border-slate-800 gap-6 justify-center md:justify-start">
        <button onClick={() => setFleetTab('equipment')} className={`pb-3 border-0 bg-transparent cursor-pointer text-base font-bold ${fleetTab === 'equipment' ? 'border-b-4 border-solid border-blue-800 text-blue-800 font-black' : 'text-slate-500'}`}>
          💡 قسم المعدات الثقيلة
        </button>
        <button onClick={() => setFleetTab('vehicle')} className={`pb-3 border-0 bg-transparent cursor-pointer text-base font-bold ${fleetTab === 'vehicle' ? 'border-b-4 border-solid border-blue-800 text-blue-800 font-black' : 'text-slate-500'}`}>
          🚚 قسم المركبات والسيارات
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 bg-blue-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-blue-100 dark:border-slate-800">
        <input 
          type="text" 
          placeholder="البحث بإدخل رقم الكود الموحد..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className={`w-full md:max-w-xl px-4 py-2.5 rounded-xl border-2 text-sm font-bold outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300'}`} 
        />
        {userRole !== 'viewer' && (
          <button onClick={() => setIsAddModalOpen(true)} className="w-full md:w-auto bg-blue-800 hover:bg-blue-900 text-white font-black px-4 py-2.5 rounded-xl text-sm border-0 cursor-pointer">
            {fleetTab === 'equipment' ? 'إضافة معدة جديدة' : 'إضافة مركبة جديدة'}
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-center text-sm font-bold text-slate-500 animate-pulse py-6">جاري التحميل...</p>
      ) : (
        <div className="space-y-8 w-full">
          <RenderGroupTable items={brokenItems} title="🚨 آليات ومركبات معطلة حالياً" isAlertGroup={true} />
          <RenderGroupTable items={availableItems} title="✅ آليات ومركبات تعمل بكفاءة" isAlertGroup={false} />
          {filteredList.length === 0 && <p className="text-center text-slate-500 py-6 font-bold text-sm">لا توجد نتائج تطابق البحث.</p>}
        </div>
      )}

      {/* 🛠️ المودالات الفرعية المنبثقة للأعطال والإصلاح */}
      <AddEquipmentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} type={fleetTab} onSuccess={fetchEquipmentData} isDarkMode={isDarkMode} />
      
      {isProfileModalOpen && selectedEquipment && (
        <EquipmentProfileModal 
          equipment={selectedEquipment} 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
          onRefresh={fetchEquipmentData} 
          userRole={userRole} 
          isDarkMode={isDarkMode} 
        />
      )}

      {/* 🔴 مودال تسجيل العطل */}
      {isFaultModalOpen && faultEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'}`}>
            <h3 className="text-lg font-black text-red-600 mb-2">🔴 تسجيل بلاغ عطل للآلية ({faultEquipment.code})</h3>
            {faultError && <div className="p-3 mb-4 text-xs font-bold bg-red-500/10 text-red-500 rounded-xl">{faultError}</div>}
            <form onSubmit={handleRegisterFault} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">تاريخ حدوث العطل:</label>
                <input type="date" required value={breakdownDate} onChange={(e) => setBreakdownDate(e.target.value)} className={`w-full px-3 py-2 text-sm rounded-xl border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">تفاصيل ومظاهر العطل الفني بالميدان:</label>
                <textarea rows={3} placeholder="اكتب هنا وش المشكلة بالظبط... (مثال: خلط زيت، كسر في الجنزير)" value={faultDetails} onChange={(e) => setFaultDetails(e.target.value)} className={`w-full px-3 py-2 text-sm rounded-xl border outline-none resize-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsFaultModalOpen(false)} className="text-xs font-bold text-slate-400 bg-transparent border-0 cursor-pointer">إلغاء</button>
                <button type="submit" disabled={submittingFault} className="bg-red-600 text-white font-bold text-xs px-5 py-2 rounded-xl border-0 cursor-pointer shadow-md">{submittingFault ? 'جاري التوثيق...' : 'تثبيت العطل وإخراجها من الخدمة'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🟢 مودال تأكيد الإصلاح */}
      {isRepairModalOpen && repairEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'}`}>
            <h3 className="text-lg font-black text-emerald-600 mb-2">🟢 إعلان جاهزية الآلية وإعادتها للخدمة</h3>
            <p className="text-xs text-slate-400 font-bold">أنت على وشك تأكيد إتمام الصيانة وإرجاع الآلية <span className="text-blue-500 font-black uppercase">{repairEquipment.code}</span> إلى الوضع (جاهز للعمل).</p>
            {repairError && <div className="p-3 mb-4 text-xs font-bold bg-red-500/10 text-red-500 rounded-xl">{repairError}</div>}
            <form onSubmit={handleRegisterRepair} className="space-y-4 mt-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">تاريخ الانتهاء من الإصلاح والموافقة:</label>
                <input type="date" required value={repairDate} onChange={(e) => setRepairDate(e.target.value)} className={`w-full px-3 py-2 text-sm rounded-xl border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsRepairModalOpen(false)} className="text-xs font-bold text-slate-400 bg-transparent border-0 cursor-pointer">إلغاء الامر</button>
                <button type="submit" disabled={submittingRepair} className="bg-emerald-600 text-white font-bold text-xs px-5 py-2 rounded-xl border-0 cursor-pointer shadow-md">{submittingRepair ? 'جاري الحفظ والتشغيل...' : '✅ الآلية جاهزة للعمل الميداني فورا'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
