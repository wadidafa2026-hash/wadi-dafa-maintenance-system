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
        <h4 className={`text-base md:text-lg font-bold px-1 flex items-center gap-2 ${isAlertGroup ? 'text-red-700' : 'text-emerald-700'}`}>
          {title} ({items.length})
        </h4>
        
        {/* العرض للشاشات الكبيرة */}
        <div className={`hidden md:block overflow-x-auto rounded-lg border ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-400 bg-white shadow-sm'}`}>
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className={`border-b ${isDarkMode ? 'bg-slate-950 text-slate-200 border-slate-800' : 'bg-slate-200 text-black border-slate-400'} text-xs md:text-sm font-bold`}>
                <th className="p-3">كود البيانات الموحد</th>
                <th className="p-3">اسم المعدة / المركبة</th>
                <th className="p-3">البيان الرقمي (اللوحة / السيريال)</th>
                <th className="p-3">الموقع / المشروع الحالي</th>
                <th className="p-3 text-center">الحالة الفنية</th>
                {userRole !== 'viewer' && <th className="p-3 text-left">الإجراءات التشغيلية</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => { setSelectedEquipment(item); setIsProfileModalOpen(true); }}
                  className={`cursor-pointer border-b text-sm font-bold transition-all ${
                    isAlertGroup 
                      ? (isDarkMode ? 'bg-red-950/20 border-red-900/40 text-red-200 hover:bg-red-950/40' : 'bg-red-50 border-slate-300 text-black hover:bg-red-100') 
                      : (isDarkMode ? 'border-slate-800 text-slate-200 hover:bg-slate-800/50' : 'border-slate-300 text-black hover:bg-slate-100')
                  }`}
                >
                  <td className="p-3 font-bold uppercase text-blue-800 dark:text-blue-400">{item.code}</td>
                  <td className="p-3 font-bold">{item.name}</td>
                  <td className="p-3 text-xs font-mono text-blue-900 dark:text-blue-300">{item.type === 'equipment' ? `S/N: ${item.serialNumber || '---'}` : `لوحة: ${item.plateNumber || '---'}`}</td>
                  <td className="p-3 text-xs">{item.projectName || 'الورشة المركزية'}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-block px-3 py-1 rounded text-xs font-bold ${isAlertGroup ? 'bg-red-700 text-white' : 'bg-emerald-700 text-white'}`}>
                      {isAlertGroup ? 'خارج الخدمة' : 'جاهز للعمل'}
                    </span>
                  </td>
                  {userRole !== 'viewer' && (
                    <td className="p-3 text-left">
                      {isAlertGroup ? (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setRepairEquipment(item); 
                            setIsRepairModalOpen(true); 
                          }} 
                          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-3 py-1.5 rounded font-bold border-0 cursor-pointer shadow"
                        >
                          إعادة الخدمة
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setFaultEquipment(item); 
                            setIsFaultModalOpen(true); 
                          }} 
                          className="bg-red-700 hover:bg-red-800 text-white text-xs px-3 py-1.5 rounded font-bold border-0 cursor-pointer shadow"
                        >
                          تسجيل عطل
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* عرض الجوال المطور كصفوف كاملة العرض شديدة الوضوح في الشمس */}
        <div className="block md:hidden space-y-2">
          {items.map((item) => (
            <div 
              key={item.id}
              onClick={() => { setSelectedEquipment(item); setIsProfileModalOpen(true); }}
              className={`p-3 rounded border flex items-center justify-between gap-2 text-right transition-all cursor-pointer ${
                isAlertGroup 
                  ? (isDarkMode ? 'bg-red-950/20 border-red-900 text-red-200' : 'bg-red-50/80 border-slate-400 text-black') 
                  : (isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-400 text-black shadow-sm')
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-blue-900 dark:text-blue-400 bg-blue-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-solid border-blue-400">{item.code}</span>
                  <h5 className="text-sm font-bold m-0 truncate text-black dark:text-white">{item.name}</h5>
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-black dark:text-slate-300">
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-blue-800 dark:text-blue-300">{item.type === 'equipment' ? `S/N: ${item.serialNumber || '---'}` : `لوحة: ${item.plateNumber || '---'}`}</span>
                  <span className="truncate font-medium">الموقع: {item.projectName || 'الورشة'}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${isAlertGroup ? 'bg-red-700 text-white' : 'bg-emerald-700 text-white'}`}>
                  {isAlertGroup ? 'معطل' : 'جاهز'}
                </span>
                {userRole !== 'viewer' && (
                  <div>
                    {isAlertGroup ? (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setRepairEquipment(item); 
                          setIsRepairModalOpen(true); 
                        }} 
                        className="bg-emerald-700 text-white text-xs px-2.5 py-1 rounded font-bold border-0 cursor-pointer"
                      >
                        إصلاح
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setFaultEquipment(item); 
                          setIsFaultModalOpen(true); 
                        }} 
                        className="bg-red-700 text-white text-xs px-2.5 py-1 rounded font-bold border-0 cursor-pointer"
                      >
                        عطل
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full box-border" dir="rtl">
      
      {/* 📊 تعديل التاب: منقسم بالتساوي 50% لكل قسم وبخطوط سوداء حادة تماماً ومقروءة */}
      <div className="w-full grid grid-cols-2 border-b-2 border-slate-400 dark:border-slate-800">
        <button 
          onClick={() => setFleetTab('equipment')} 
          className={`pb-3 border-0 bg-transparent cursor-pointer text-center text-sm md:text-base font-bold transition-all ${
            fleetTab === 'equipment' 
              ? 'border-b-4 border-solid border-slate-900 dark:border-white text-black dark:text-white font-bold' 
              : 'text-black/60 dark:text-slate-400 hover:text-black'
          }`}
        >
          قسم المعدات الثقيلة
        </button>
        <button 
          onClick={() => setFleetTab('vehicle')} 
          className={`pb-3 border-0 bg-transparent cursor-pointer text-center text-sm md:text-base font-bold transition-all ${
            fleetTab === 'vehicle' 
              ? 'border-b-4 border-solid border-slate-900 dark:border-white text-black dark:text-white font-bold' 
              : 'text-black/60 dark:text-slate-400 hover:text-black'
          }`}
        >
          قسم المركبات
        </button>
      </div>

      {/* خيارات البحث والإضافة */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 bg-slate-100 dark:bg-slate-900 p-4 rounded-lg border border-slate-300 dark:border-slate-800">
        <input 
          type="text" 
          placeholder="البحث بإدخال رقم الكود الموحد للمعدة أو المركبة..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className={`w-full md:max-w-xl px-4 py-2.5 rounded border-2 text-sm font-bold outline-none text-blue-900 ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-600' : 'bg-white border-slate-400 text-black focus:border-black'}`} 
        />
        {userRole !== 'viewer' && (
          <button onClick={() => setIsAddModalOpen(true)} className="w-full md:w-auto bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold px-6 py-2.5 rounded text-sm border-0 cursor-pointer transition-all shadow">
            {fleetTab === 'equipment' ? 'إضافة معدة جديدة' : 'إضافة مركبة جديدة'}
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-center text-sm font-bold text-black dark:text-slate-400 animate-pulse py-6">جاري استدعاء البيانات الفنية وتحديث القوائم...</p>
      ) : (
        <div className="space-y-6 w-full">
          <RenderGroupTable items={brokenItems} title="معدات ومركبات خارج الخدمة (معطلة)" isAlertGroup={true} />
          <RenderGroupTable items={availableItems} title="معدات ومركبات جاهزة للعمل" isAlertGroup={false} />
          {filteredList.length === 0 && <p className="text-center text-black font-bold py-6 text-sm">لا توجد نتائج تطابق معايير البحث الحالية.</p>}
        </div>
      )}

      {/* المودالات الفرعية */}
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

      {/* 🔴 مودال تسجيل العطل - مجهز بالكامل للوضوح تحت أشعة الشمس المباشرة بقلم أسود حاد وبوكس أزرق */}
      {isFaultModalOpen && faultEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-2xl p-6 md:p-8 rounded-xl border-2 shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-500 text-black'}`}>
            <h3 className="text-xl font-bold text-red-700 mb-4 border-b-2 border-solid border-slate-300 pb-3">تسجيل بلاغ عطل فني للمركبة/المعدة ({faultEquipment.code})</h3>
            {faultError && <div className="p-3 mb-4 text-sm font-bold bg-red-500/10 text-red-700 rounded border border-solid border-red-400">{faultError}</div>}
            
            <form onSubmit={handleRegisterFault} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-black dark:text-slate-200">تاريخ ورود البلاغ ورصد العطل:</label>
                <input type="date" required value={breakdownDate} onChange={(e) => setBreakdownDate(e.target.value)} className={`w-full px-4 py-3 text-sm rounded border-2 outline-none font-bold text-blue-900 ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-400 text-blue-900 focus:border-black'}`} />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-black dark:text-slate-200">وصف العطل الفني ومظاهره الميدانية:</label>
                <textarea rows={5} placeholder="يرجى كتابة تفاصيل العطل الفني المكتشف بدقة..." value={faultDetails} onChange={(e) => setFaultDetails(e.target.value)} className={`w-full px-4 py-3 text-base rounded border-2 outline-none resize-none font-bold text-blue-900 ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-400 text-blue-900 focus:border-black'}`} />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t-2 border-solid border-slate-300">
                <button type="button" onClick={() => setIsFaultModalOpen(false)} className="text-sm font-bold text-black dark:text-slate-300 bg-transparent border-0 cursor-pointer hover:underline px-3">إلغاء</button>
                <button type="submit" disabled={submittingFault} className="bg-red-700 hover:bg-red-800 text-white font-bold text-sm px-6 py-2.5 rounded border-0 cursor-pointer shadow-md">{submittingFault ? 'جاري توثيق البيانات الفنية...' : 'تثبيت بلاغ العطل وإخراجها من الخدمة'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🟢 مودال تأكيد الإصلاح - تباين عالي جداً للميدان */}
      {isRepairModalOpen && repairEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-2xl p-6 md:p-8 rounded-xl border-2 shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-500 text-black'}`}>
            <h3 className="text-xl font-bold text-emerald-700 mb-4 border-b-2 border-solid border-slate-300 pb-3">إعلان الجاهزية الفنية وإعادة المركبة/المعدة للخدمة</h3>
            <p className="text-sm text-black dark:text-slate-200 font-bold leading-relaxed">أنت على وشك اعتماد إتمام أعمال الصيانة الشاملة وتغيير الحالة التشغيلية للمركبة/المعدة ذات الكود الموحد <span className="text-blue-800 dark:text-blue-400 font-bold uppercase">{repairEquipment.code}</span> إلى الحالة التشغيلية الكاملة.</p>
            {repairError && <div className="p-3 mb-4 text-sm font-bold bg-red-500/10 text-red-700 rounded border border-solid border-red-400">{repairError}</div>}
            
            <form onSubmit={handleRegisterRepair} className="space-y-5 mt-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-black dark:text-slate-200">تاريخ إتمام أعمال الصيانة والاعتماد الفني:</label>
                <input type="date" required value={repairDate} onChange={(e) => setRepairDate(e.target.value)} className={`w-full px-4 py-3 text-sm rounded border-2 outline-none font-bold text-blue-900 ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-400 text-blue-900 focus:border-black'}`} />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t-2 border-solid border-slate-300">
                <button type="button" onClick={() => setIsRepairModalOpen(false)} className="text-sm font-bold text-black dark:text-slate-300 bg-transparent border-0 cursor-pointer hover:underline px-3">إلغاء</button>
                <button type="submit" disabled={submittingRepair} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm px-6 py-2.5 rounded border-0 cursor-pointer shadow-md">{submittingRepair ? 'جاري تحديث السجلات التشغيلية...' : 'اعتماد الجاهزية والتشغيل الميداني الفوري'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
