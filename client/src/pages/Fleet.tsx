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

  // دالة مساعدة للحصول على تاريخ اليوم بتنسيق YYYY-MM-DD
  const getTodayDateString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  };

  // تعبئة تاريخ اليوم تلقائياً عند فتح مودال العطل
  useEffect(() => {
    if (isFaultModalOpen) {
      setBreakdownDate(getTodayDateString());
    }
  }, [isFaultModalOpen]);

  // تعبئة تاريخ اليوم تلقائياً عند فتح مودال الإصلاح
  useEffect(() => {
    if (isRepairModalOpen) {
      setRepairDate(getTodayDateString());
    }
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
        fetchEquipmentData();
      } else {
        const errData = await response.json();
        setFaultError(errData.error || 'فشل في تسجيل بلاغ العطل المحفوظ.');
      }
    } catch (err) {
      console.error(err);
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
      if (!resHistory.ok) throw new Error('فشل في استدعاء السجل الفني للمعدة');
      
      const historyData = await resHistory.json();
      const activeLog = historyData.find((log: any) => log.status === 'broken');

      if (!activeLog) {
        setRepairError('لم يتم العثور على بلاغ عطل مفتوح ومسجل لهذه المعدة في النظام.');
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
        setRepairDate('');
        fetchEquipmentData();
      } else {
        const errData = await response.json();
        setRepairError(errData.error || 'فشل في تحديث حالة جاهزية المعدة.');
      }
    } catch (err) {
      console.error(err);
      setRepairError('حدث خطأ أثناء الاتصال بالنظام لتسجيل جاهزية المعدة.');
    } finally {
      setSubmittingRepair(false);
    }
  };

  // تصفية وفرز البيانات المشتركة (المعطل أولاً دائماً)
  const filteredAndSortedList = equipmentList
    .filter(item => item.type === fleetTab && item.code.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (a.status === 'available' ? 1 : 0) - (b.status === 'available' ? 1 : 0));

  return (
    <div className="space-y-6 px-2 md:px-0" dir="rtl">
      
      {/* التابات العلوية متجاوبة */}
      <div className="flex border-b-2 border-slate-200 dark:border-slate-800 gap-6 md:gap-10 justify-center md:justify-start">
        <button 
          onClick={() => setFleetTab('equipment')} 
          className={`pb-4 transition-all border-0 bg-transparent cursor-pointer font-sans text-base md:text-lg ${fleetTab === 'equipment' ? 'border-b-4 border-solid border-blue-800 text-blue-800 font-black' : 'text-slate-500 font-bold'}`}
        >
          قسم المعدات الثقيلة
        </button>
        <button 
          onClick={() => setFleetTab('vehicle')} 
          className={`pb-4 transition-all border-0 bg-transparent cursor-pointer font-sans text-base md:text-lg ${fleetTab === 'vehicle' ? 'border-b-4 border-solid border-blue-800 text-blue-800 font-black' : 'text-slate-500 font-bold'}`}
        >
          قسم المركبات والسيارات
        </button>
      </div>

      {/* شريط البحث وزر الإضافة متجاوب بالكامل لشاشات الجوال */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-blue-50 dark:bg-slate-900 p-4 md:p-5 rounded-2xl border-2 border-solid border-blue-100 dark:border-slate-800">
        <input 
          type="text" 
          placeholder={fleetTab === 'equipment' ? "البحث عن معدة بإدخال رقم الكود الموحد..." : "البحث عن مركبة بإدخال رقم الكود الموحد..."} 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className={`w-full md:max-w-xl px-4 py-3 rounded-xl border-2 text-sm md:text-base font-bold outline-none focus:border-blue-800 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'}`} 
        />
        {userRole !== 'viewer' && (
          <button 
            onClick={() => setIsAddModalOpen(true)} 
            className="w-full md:w-auto bg-blue-800 hover:bg-blue-900 text-white font-black px-5 py-3 rounded-xl text-sm md:text-base shadow-md border-0 cursor-pointer transition-all text-center"
          >
            {fleetTab === 'equipment' ? 'إضافة معدة جديدة' : 'إضافة مركبة جديدة'}
          </button>
        )}
      </div>

      {/* منطقة عرض البيانات */}
      {loading ? (
        <p className="text-center text-lg font-bold text-slate-700 dark:text-slate-400 animate-pulse py-6">جاري تحميل بيانات الأسطول الحالية...</p>
      ) : (
        <>
          {/* 1. العرض المخصص للشاشات الكبيرة (الكمبيوتر والتابلت) */}
          <div className={`hidden md:block overflow-x-auto rounded-2xl border-2 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white shadow-md'}`}>
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className={`border-b-2 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'} text-base font-black`}>
                  <th className="p-4">كود الآلية</th>
                  <th className="p-4">اسم المعدة / المركبة</th>
                  <th className="p-4">البيان التعريفي (اللوحة / السيريال)</th>
                  <th className="p-4">الموقع الميداني</th>
                  <th className="p-4 text-center">الحالة التشغيلية</th>
                  {userRole !== 'viewer' && <th className="p-4 text-left">الإجراءات والسجل</th>}
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedList.map((item) => {
                  const isBroken = item.status !== 'available';
                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => { setSelectedEquipment(item); setIsProfileModalOpen(true); }}
                      className={`cursor-pointer border-b text-base font-bold transition-all hover:brightness-95 dark:hover:brightness-110 ${
                        isBroken 
                          ? (isDarkMode ? 'bg-red-950/40 border-red-900/60 text-red-200' : 'bg-red-100/80 border-red-200 text-red-950') 
                          : (isDarkMode ? 'border-slate-800 text-slate-200 hover:bg-slate-800/50' : 'border-slate-200 text-slate-900 hover:bg-slate-50')
                      }`}
                    >
                      <td className="p-4 font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">{item.code}</td>
                      <td className="p-4 font-black">{item.name}</td>
                      <td className="p-4 text-sm font-sans">{item.type === 'equipment' ? `S/N: ${item.serialNumber || 'غير مسجل'}` : `لوحة: ${item.plateNumber || 'غير مسجل'}`}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{item.projectName || 'الورشة المركزية'}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black shadow-sm ${!isBroken ? 'bg-emerald-200 text-emerald-950 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-600 text-white'}`}>
                          {!isBroken ? 'جاهز للعمل' : 'معطلة حالياً'}
                        </span>
                      </td>
                      {userRole !== 'viewer' && (
                        <td className="p-4 text-left" onClick={(e) => e.stopPropagation()}>
                          {!isBroken ? (
                            <button onClick={() => { setFaultEquipment(item); setIsFaultModalOpen(true); }} className="bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded-xl font-black transition-all border-0 cursor-pointer shadow-sm">
                              تسجيل بلاغ عطل 🔴
                            </button>
                          ) : (
                            <button onClick={() => { setRepairEquipment(item); setIsRepairModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-xl font-black transition-all border-0 cursor-pointer shadow-sm">
                              إصلاح وجاهزية 🟢
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 2. العرض المطور السحري المخصص لشاشات الجوال بالكامل (Mobile View) */}
          <div className="block md:hidden space-y-4">
            {filteredAndSortedList.map((item) => {
              const isBroken = item.status !== 'available';
              return (
                <div 
                  key={item.id}
                  onClick={() => { setSelectedEquipment(item); setIsProfileModalOpen(true); }}
                  className={`p-4 rounded-xl border-2 flex flex-col gap-3 shadow-sm transition-all active:scale-[0.99] ${
                    isBroken 
                      ? (isDarkMode ? 'bg-red-950/40 border-red-900 text-red-200' : 'bg-red-100 border-red-200 text-red-950') 
                      : (isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-900')
                  }`}
                >
                  {/* السطر الأول في الكارت: الكود والحالة */}
                  <div className="flex justify-between items-center">
                    <span className="text-base font-black uppercase text-blue-700 dark:text-blue-400">{item.code}</span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${!isBroken ? 'bg-emerald-200 text-emerald-950 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-600 text-white'}`}>
                      {!isBroken ? 'جاهز' : 'معطلة'}
                    </span>
                  </div>

                  {/* السطر الثاني: الاسم والتفاصيل الحركية */}
                  <div>
                    <h5 className="text-base font-black m-0">{item.name}</h5>
                    <p className="text-xs m-0 mt-1 opacity-80 font-sans">
                      {item.type === 'equipment' ? `S/N: ${item.serialNumber || 'لا يوجد'}` : `لوحة: ${item.plateNumber || 'لا يوجد'}`}
                    </p>
                    <p className="text-xs m-0 mt-2 font-bold text-slate-600 dark:text-slate-400">
                      الموقع: <span className="text-blue-900 dark:text-blue-300 font-black">{item.projectName || 'الورشة المركزية'}</span>
                    </p>
                  </div>

                  {/* السطر الثالث: زر الإجراء متناسب مع حجم أصبع اليد في اللمس */}
                  {userRole !== 'viewer' && (
                    <div className="pt-2 border-t border-solid border-slate-300/40 dark:border-slate-700/40 flex justify-end" onClick={(e) => e.stopPropagation()}>
                      {!isBroken ? (
                        <button onClick={() => { setFaultEquipment(item); setIsFaultModalOpen(true); }} className="w-full bg-red-600 text-white text-sm py-2.5 rounded-lg font-black border-0 cursor-pointer text-center">
                          تسجيل بلاغ عطل 🔴
                        </button>
                      ) : (
                        <button onClick={() => { setRepairEquipment(item); setIsRepairModalOpen(true); }} className="w-full bg-emerald-600 text-white text-sm py-2.5 rounded-lg font-black border-0 cursor-pointer text-center">
                          إصلاح وجاهزية 🟢
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* في حال عدم وجود بيانات تطابق البحث */}
          {filteredAndSortedList.length === 0 && (
            <p className="text-center text-slate-500 py-8 font-bold text-sm md:text-base">لا توجد أي آليات مسجلة أو تطابق البحث الحالي.</p>
          )}
        </>
      )}

      {/* مودال فتح بلاغ عطل وصيانة */}
      {isFaultModalOpen && faultEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form onSubmit={handleRegisterFault} className={`w-full max-w-xl p-5 md:p-8 rounded-2xl border-2 border-solid shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div>
              <h3 className="text-lg md:text-xl font-black text-red-600 m-0">تسجيل بلاغ عطل فني طارئ</h3>
              <p className="text-sm md:text-base text-slate-800 dark:text-slate-300 font-bold m-0 mt-2">إصدار بلاغ فني للمعدة: <span className="text-blue-800 dark:text-blue-400 font-black">{faultEquipment.code}</span></p>
            </div>

            {faultError && <div className="p-3 text-sm md:text-base font-black bg-red-100 text-red-900 rounded-xl border-2 border-red-200">{faultError}</div>}

            <div className="space-y-2">
              <label className="text-sm md:text-base font-black text-slate-900 dark:text-slate-300 block">تاريخ حدوث العطل الفعلي:</label>
              <input 
                type="date" 
                required 
                value={breakdownDate} 
                onChange={(e) => setBreakdownDate(e.target.value)} 
                className={`w-full px-4 py-2.5 text-sm md:text-base font-bold rounded-xl border-2 outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900 focus:border-red-600'}`} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm md:text-base font-black text-slate-900 dark:text-slate-300 block">وصف وتفاصيل العطل الفني:</label>
              <textarea 
                rows={5} 
                placeholder="يرجى كتابة شرح توضيحي طبيعي للمشكلة الفنية الحالية..." 
                value={faultDetails} 
                onChange={(e) => setFaultDetails(e.target.value)} 
                className={`w-full px-4 py-3 text-sm md:text-base rounded-xl border-2 outline-none min-h-[120px] font-sans font-bold leading-relaxed ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-red-500' : 'bg-white border-slate-300 text-slate-900 focus:border-red-600'}`} 
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 items-center">
              <button 
                type="button" 
                onClick={() => { setIsFaultModalOpen(false); setFaultError(null); }} 
                disabled={submittingFault} 
                className="text-sm md:text-base text-slate-900 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-4 py-2.5 rounded-xl border-0 cursor-pointer font-black hover:bg-slate-300"
              >
                إلغاء
              </button>
              <button 
                type="submit" 
                disabled={submittingFault} 
                className="bg-red-600 text-white font-black text-sm md:text-base px-5 py-2.5 rounded-xl shadow-md border-0 cursor-pointer hover:bg-red-700 disabled:bg-red-800"
              >
                {submittingFault ? 'جاري الحفظ...' : 'حفظ بلاغ العطل'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* مودال تم الإصلاح وإعادة الجاهزية */}
      {isRepairModalOpen && repairEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form onSubmit={handleRegisterRepair} className={`w-full max-w-lg p-5 md:p-8 rounded-2xl border-2 border-solid shadow-2xl space-y-5 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div>
              <h3 className="text-lg md:text-xl font-black text-emerald-600 m-0">إغلاق بلاغ الصيانة والجاهزية</h3>
              <p className="text-sm md:text-base text-slate-800 dark:text-slate-300 font-bold m-0 mt-2">إعادة الآلية: <span className="text-blue-800 dark:text-blue-400 font-black">{repairEquipment.code}</span> لحالة التشغيل.</p>
            </div>

            {repairError && <div className="p-3 text-sm md:text-base font-black bg-red-100 text-red-900 rounded-xl border-2 border-red-200">{repairError}</div>}

            <div className="space-y-2">
              <label className="text-sm md:text-base font-black text-slate-900 dark:text-slate-300 block">التاريخ الفعلي لإتمام الإصلاح:</label>
              <input 
                type="date" 
                required 
                value={repairDate} 
                onChange={(e) => setRepairDate(e.target.value)} 
                className={`w-full px-4 py-2.5 text-sm md:text-base font-bold rounded-xl border-2 outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600'}`} 
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 items-center">
              <button 
                type="button" 
                onClick={() => { setIsRepairModalOpen(false); setRepairError(null); }} 
                disabled={submittingRepair} 
                className="text-sm md:text-base text-slate-900 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-4 py-2.5 rounded-xl border-0 cursor-pointer font-black hover:bg-slate-300"
              >
                إلغاء
              </button>
              <button 
                type="submit" 
                disabled={submittingRepair} 
                className="bg-emerald-600 text-white font-black text-sm md:text-base px-5 py-2.5 rounded-xl shadow-md border-0 cursor-pointer hover:bg-emerald-700 disabled:bg-emerald-800"
              >
                {submittingRepair ? 'جاري التحديث...' : 'تأكيد اكتمال الإصلاح'}
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
