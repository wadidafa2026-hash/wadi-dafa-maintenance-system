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
        
        {/* العرض الافتراضي للشاشات الكبيرة والميدانية (جدول متكامل) */}
        <div className={`hidden md:block overflow-x-auto rounded-lg border ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white shadow-sm'}`}>
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className={`border-b ${isDarkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'} text-xs md:text-sm font-bold`}>
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
                  className={`cursor-pointer border-b text-sm font-medium transition-all ${
                    isAlertGroup 
                      ? (isDarkMode ? 'bg-red-950/20 border-red-900/40 text-red-200 hover:bg-red-950/40' : 'bg-red-50/60 border-red-100 text-slate-900 hover:bg-red-50') 
                      : (isDarkMode ? 'border-slate-800 text-slate-200 hover:bg-slate-800/50' : 'border-slate-200 text-slate-900 hover:bg-slate-50')
                  }`}
                >
                  <td className="p-3 font-bold uppercase text-blue-700 dark:text-blue-400">{item.code}</td>
                  <td className="p-3 font-bold">{item.name}</td>
                  <td className="p-3 text-xs font-mono">{item.type === 'equipment' ? `S/N: ${item.serialNumber || '---'}` : `لوحة: ${item.plateNumber || '---'}`}</td>
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

        {/* عرض الجوال المطور: صفوف أفقية مدمجة وشاملة تشبه كشف إكسل وليست كروت */}
        <div className="block md:hidden space-y-1.5">
          {items.map((item) => (
            <div 
              key={item.id}
              onClick={() => { setSelectedEquipment(item); setIsProfileModalOpen(true); }}
              className={`p-3 rounded border flex items-center justify-between gap-2 text-right transition-all cursor-pointer ${
                isAlertGroup 
                  ? (isDarkMode ? 'bg-red-950/20 border-red-900 text-red-200' : 'bg-red-50 border-red-100 text-slate-900') 
                  : (isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-900')
              }`}
            >
              {/* العمود الأيمن: الكود والمسمى الفني والبيان في سطر واحد مضغوط */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-solid border-blue-200 dark:border-blue-900">{item.code}</span>
                  <h5 className="text-sm font-bold m-0 truncate">{item.name}</h5>
                </div>
                <div className="flex items-center gap-4 mt-1 text-[11px] opacity-80">
                  <span className="font-mono">{item.type === 'equipment' ? `S/N: ${item.serialNumber || '---'}` : `لوحة: ${item.plateNumber || '---'}`}</span>
                  <span className="truncate">الموقع: {item.projectName || 'الورشة'}</span>
                </div>
              </div>

              {/* العمود الأيسر: الحالة والأزرار التنفيذية */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isAlertGroup ? 'bg-red-700 text-white' : 'bg-emerald-700 text-white'}`}>
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
                        className="bg-emerald-700 text-white text-[11px] px-2 py-1 rounded font-bold border-0 cursor-pointer"
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
                        className="bg-red-700 text-white text-[11px] px-2 py-1 rounded font-bold border-0 cursor-pointer"
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
      
      {/* التبويبات الفنية الرئيسية */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 justify-start">
        <button onClick={() => setFleetTab('equipment')} className={`pb-3 border-0 bg-transparent cursor-pointer text-base font-bold ${fleetTab === 'equipment' ? 'border-b-2 border-solid border-slate-900 text-slate-900 dark:text-white font-bold' : 'text-slate-400'}`}>
          قسم المعدات الثقيلة
        </button>
        <button onClick={() => setFleetTab('vehicle')} className={`pb-3 border-0 bg-transparent cursor-pointer text-base font-bold ${fleetTab === 'vehicle' ? 'border-b-2 border-solid border-slate-900 text-slate-900 dark:text-white font-bold' : 'text-slate-400'}`}>
          قسم المركبات
        </button>
      </div>

      {/* خيارات البحث والإضافة الميدانية */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 bg-slate-100 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
        <input 
          type="text" 
          placeholder="البحث بإدخال رقم الكود الموحد للمعدة أو المركبة..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className={`w-full md:max-w-xl px-4 py-2.5 rounded border text-sm font-medium outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-slate-700' : 'bg-white border-slate-300 focus:border-slate-400'}`} 
        />
        {userRole !== 'viewer' && (
          <button onClick={() => setIsAddModalOpen(true)} className="w-full md:w-auto bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold px-5 py-2.5 rounded text-sm border-0 cursor-pointer transition-all shadow-sm">
            {fleetTab === 'equipment' ? 'إضافة معدة جديدة' : 'إضافة مركبة جديدة'}
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-center text-sm font-medium text-slate-500 animate-pulse py-6">جاري استدعاء البيانات وحصر الحالات المعروضة...</p>
      ) : (
        <div className="space-y-6 w-full">
          <RenderGroupTable items={brokenItems} title="معدات ومركبات خارج الخدمة (معطلة)" isAlertGroup={true} />
          <RenderGroupTable items={availableItems} title="معدات ومركبات جاهزة للعمل" isAlertGroup={false} />
          {filteredList.length === 0 && <p className="text-center text-slate-500 py-6 font-medium text-sm">لا توجد نتائج تطابق معايير البحث الحالية.</p>}
        </div>
      )}

      {/* المودالات والملفات الفرعية للتحكم والتوثيق */}
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

      {/* مودال تسجيل العطل - تم تكبير حجم الخط والعرض والمسافات لاستعراض حر مريح */}
      {isFaultModalOpen && faultEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-2xl p-6 md:p-8 rounded-xl border shadow-xl ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h3 className="text-xl font-bold text-red-700 mb-4 border-b border-solid border-slate-200/50 pb-3">تسجيل بلاغ عطل فني للمركبة/المعدة ({faultEquipment.code})</h3>
            {faultError && <div className="p-3 mb-4 text-sm font-medium bg-red-500/10 text-red-600 rounded">{faultError}</div>}
            
            <form onSubmit={handleRegisterFault} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-500 dark:text-slate-400">تاريخ ورورد البلاغ ورصد العطل:</label>
                <input type="date" required value={breakdownDate} onChange={(e) => setBreakdownDate(e.target.value)} className={`w-full px-4 py-3 text-sm rounded border outline-none font-medium ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`} />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-500 dark:text-slate-400">وصف العطل الفني ومظاهره الميدانية:</label>
                <textarea rows={5} placeholder="يرجى كتابة تفاصيل العطل الفني المكتشف بدقة (مثال: عطل في ناقل الحركة، تهريب زيت الهيدروليك...)" value={faultDetails} onChange={(e) => setFaultDetails(e.target.value)} className={`w-full px-4 py-3 text-base rounded border outline-none resize-none font-medium ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`} />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-solid border-slate-200/50">
                <button type="button" onClick={() => setIsFaultModalOpen(false)} className="text-sm font-bold text-slate-500 bg-transparent border-0 cursor-pointer hover:text-slate-700 px-3">إلغاء</button>
                <button type="submit" disabled={submittingFault} className="bg-red-700 hover:bg-red-800 text-white font-bold text-sm px-6 py-2.5 rounded border-0 cursor-pointer shadow-md">{submittingFault ? 'جاري توثيق البيانات الفنية...' : 'تثبيت بلاغ العطل وإخراج المركبة/المعدة من الخدمة'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال تأكيد الإصلاح - تم تكبير مساحته لاستعراض البيانات بحرية تامة */}
      {isRepairModalOpen && repairEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-2xl p-6 md:p-8 rounded-xl border shadow-xl ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h3 className="text-xl font-bold text-emerald-700 mb-4 border-b border-solid border-slate-200/50 pb-3">إعلان الجاهزية الفنية وإعادة المركبة/المعدة للخدمة</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">أنت على وشك اعتماد إتمام أعمال الصيانة الشاملة وتغيير الحالة التشغيلية للمركبة/المعدة ذات الكود الموحد <span className="text-blue-700 dark:text-blue-400 font-bold uppercase">{repairEquipment.code}</span> إلى الحالة التشغيلية الكاملة.</p>
            {repairError && <div className="p-3 mb-4 text-sm font-medium bg-red-500/10 text-red-600 rounded">{repairError}</div>}
            
            <form onSubmit={handleRegisterRepair} className="space-y-5 mt-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-500 dark:text-slate-400">تاريخ إتمام أعمال الصيانة والاعتماد الفني:</label>
                <input type="date" required value={repairDate} onChange={(e) => setRepairDate(e.target.value)} className={`w-full px-4 py-3 text-sm rounded border outline-none font-medium ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`} />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-solid border-slate-200/50">
                <button type="button" onClick={() => setIsRepairModalOpen(false)} className="text-sm font-bold text-slate-500 bg-transparent border-0 cursor-pointer hover:text-slate-700 px-3">إلغاء</button>
                <button type="submit" disabled={submittingRepair} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm px-6 py-2.5 rounded border-0 cursor-pointer shadow-md">{submittingRepair ? 'جاري تحديث السجلات التشغيلية...' : 'اعتماد الجاهزية والتشغيل الميداني الفوري'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
