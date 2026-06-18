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
        setError(errData.error || 'فشل في تسجيل بلاغ العطل.');
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
        <h4 className={`text-lg font-black px-1 flex items-center gap-2 ${isAlertGroup ? 'text-red-800' : 'text-emerald-800'}`}>
          {title} ({items.length})
        </h4>
        
        {/* العرض للشاشات الكبيرة */}
        <div className="hidden md:block overflow-x-auto rounded-lg border-2 border-black bg-white shadow-sm">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-200 text-black border-b-2 border-black text-sm font-black">
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
                  className={`cursor-pointer border-b border-solid border-black text-sm font-black ${isAlertGroup ? 'bg-red-50 hover:bg-red-100 text-black' : 'bg-white hover:bg-slate-100 text-black'}`}
                >
                  <td className="p-3 font-black uppercase text-blue-900">{item.code}</td>
                  <td className="p-3 font-black text-black">{item.name}</td>
                  <td className="p-3 text-xs font-mono text-blue-900">{item.type === 'equipment' ? `S/N: ${item.serialNumber || '---'}` : `لوحة: ${item.plateNumber || '---'}`}</td>
                  <td className="p-3 text-xs text-black font-black">{item.projectName || 'الورشة المركزية'}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-block px-3 py-1 rounded text-xs font-black ${isAlertGroup ? 'bg-red-700 text-white' : 'bg-emerald-700 text-white'}`}>
                      {isAlertGroup ? 'خارج الخدمة' : 'جاهز للعمل'}
                    </span>
                  </td>
                  {userRole !== 'viewer' && (
                    <td className="p-3 text-left">
                      {isAlertGroup ? (
                        <button onClick={(e) => { e.stopPropagation(); setRepairEquipment(item); setIsRepairModalOpen(true); }} className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-3 py-1.5 rounded-lg font-black border-2 border-solid border-black cursor-pointer shadow">إعادة الخدمة</button>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); setFaultEquipment(item); setIsFaultModalOpen(true); }} className="bg-red-700 hover:bg-red-800 text-white text-xs px-3 py-1.5 rounded-lg font-black border-2 border-solid border-black cursor-pointer shadow">تسجيل عطل</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* عرض الجوال - تم نسف الرمادي وجعل لون الاسم أسود فاحم 100% لتحدي وهج الشمس */}
        <div className="block md:hidden space-y-3">
          {items.map((item) => (
            <div 
              key={item.id}
              onClick={() => { setSelectedEquipment(item); setIsProfileModalOpen(true); }}
              className={`p-4 rounded-xl border-2 border-solid border-black flex items-center justify-between gap-2 text-right shadow-sm ${isAlertGroup ? 'bg-red-50 text-black' : 'bg-white text-black'}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-blue-900 bg-blue-100 px-2 py-0.5 rounded border-2 border-solid border-blue-950">{item.code}</span>
                  {/* هنا التغيير الجوهري: اسم الآلية أسود صريح وعريض جداً */}
                  <h5 className="text-base font-black m-0 truncate text-black">{item.name}</h5>
                </div>
                <div className="flex flex-col gap-1 mt-2 text-xs text-black font-black">
                  <div><span className="font-mono bg-blue-50 px-1 rounded text-blue-900 border border-solid border-blue-200">{item.type === 'equipment' ? `S/N: ${item.serialNumber || '---'}` : `لوحة: ${item.plateNumber || '---'}`}</span></div>
                  <div className="truncate text-black mt-0.5">📍 الموقع: {item.projectName || 'الورشة المركزية'}</div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 shrink-0">
                <span className={`px-2 py-1 rounded text-xs font-black ${isAlertGroup ? 'bg-red-700 text-white' : 'bg-emerald-700 text-white'}`}>
                  {isAlertGroup ? 'معطل' : 'جاهز للعمل'}
                </span>
                {userRole !== 'viewer' && (
                  <div>
                    {isAlertGroup ? (
                      <button onClick={(e) => { e.stopPropagation(); setRepairEquipment(item); setIsRepairModalOpen(true); }} className="bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-md font-black border-2 border-solid border-black cursor-pointer">إصلاح</button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); setFaultEquipment(item); setIsFaultModalOpen(true); }} className="bg-red-700 text-white text-xs px-3 py-1.5 rounded-md font-black border-2 border-solid border-black cursor-pointer">عطل</button>
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
    <div className="space-y-6 w-full box-border text-black" dir="rtl">
      
      {/* 📊 التاب المحدث: مقسم 50/50 بخطوط سوداء فاحمة 100% في جميع الحالات */}
      <div className="w-full grid grid-cols-2 border-b-4 border-solid border-black bg-slate-100 rounded-t-lg">
        <button 
          onClick={() => setFleetTab('equipment')} 
          className={`py-3.5 border-0 bg-transparent cursor-pointer text-center text-base font-black transition-all ${
            fleetTab === 'equipment' 
              ? 'border-b-4 border-solid border-blue-900 text-blue-900 bg-white' 
              : 'text-black hover:text-blue-900 hover:bg-slate-50'
          }`}
        >
          قسم المعدات الثقيلة
        </button>
        <button 
          onClick={() => setFleetTab('vehicle')} 
          className={`py-3.5 border-0 bg-transparent cursor-pointer text-center text-base font-black transition-all ${
            fleetTab === 'vehicle' 
              ? 'border-b-4 border-solid border-blue-900 text-blue-900 bg-white' 
              : 'text-black hover:text-blue-900 hover:bg-slate-50'
          }`}
        >
          قسم المركبات
        </button>
      </div>

      {/* خيارات البحث والإضافة */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 bg-white p-4 rounded-xl border-2 border-solid border-black shadow-sm">
        <input 
          type="text" 
          placeholder="البحث بإدخل رقم الكود الموحد للمعدة أو المركبة..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className="w-full md:max-w-xl px-4 py-3 rounded border-2 border-solid border-black text-sm font-black outline-none bg-white text-blue-900 placeholder:text-blue-950 focus:border-blue-950 shadow-sm" 
        />
        {userRole !== 'viewer' && (
          <button onClick={() => setIsAddModalOpen(true)} className="w-full md:w-auto bg-black hover:bg-slate-900 text-white font-black px-6 py-3 rounded-lg text-sm border-2 border-solid border-black cursor-pointer transition-all shadow active:scale-95">
            {fleetTab === 'equipment' ? '➕ إضافة معدة جديدة' : '➕ إضافة مركبة جديدة'}
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-center text-base font-black text-black animate-pulse py-6">جاري استدعاء البيانات الفنية وتحديث القوائم الميدانية...</p>
      ) : (
        <div className="space-y-6 w-full">
          <RenderGroupTable items={brokenItems} title="🔴 معدات ومركبات خارج الخدمة (معطلة)" isAlertGroup={true} />
          <RenderGroupTable items={availableItems} title="🟢 معدات ومركبات جاهزة للعمل" isAlertGroup={false} />
          {filteredList.length === 0 && <p className="text-center text-black font-black py-6 text-sm">لا توجد نتائج تطابق معايير البحث الحالية.</p>}
        </div>
      )}

      {/* المودالات المنفصلة */}
      <AddEquipmentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} type={fleetTab} onSuccess={fetchEquipmentData} isDarkMode={false} />
      
      {isProfileModalOpen && selectedEquipment && (
        <EquipmentProfileModal equipment={selectedEquipment} isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onRefresh={fetchEquipmentData} userRole={userRole} isDarkMode={false} />
      )}

      {/* 🔴 مودال تسجيل العطل المحدث بالأسود الفاحم المانع لإنعكاسات الشمس */}
      {isFaultModalOpen && faultEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl p-6 md:p-8 rounded-xl border-4 border-solid border-black bg-white text-black shadow-2xl">
            <h3 className="text-xl font-black text-red-700 mb-4 border-b-4 border-solid border-black pb-3">تسجيل بلاغ عطل فني للمركبة/المعدة ({faultEquipment.code})</h3>
            {faultError && <div className="p-3 mb-4 text-sm font-black bg-red-100 text-red-900 rounded border-2 border-solid border-red-700">{faultError}</div>}
            
            <form onSubmit={handleRegisterFault} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-base font-black text-black">تاريخ ورود البلاغ ورصد العطل:</label>
                <input type="date" required value={breakdownDate} onChange={(e) => setBreakdownDate(e.target.value)} className="w-full px-4 py-3 text-base font-black rounded border-2 border-solid border-black bg-white text-blue-900 outline-none focus:border-black" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-base font-black text-black">وصف العطل الفني ومظاهره الميدانية:</label>
                <textarea rows={5} placeholder="يرجى كتابة تفاصيل العطل الفني المكتشف بدقة..." value={faultDetails} onChange={(e) => setFaultDetails(e.target.value)} className="w-full px-4 py-3 text-base font-black rounded border-2 border-solid border-black bg-white text-blue-900 placeholder:text-blue-900/70 outline-none resize-none focus:border-black" />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t-4 border-solid border-black">
                <button type="button" onClick={() => setIsFaultModalOpen(false)} className="text-base font-black text-black bg-transparent border-0 cursor-pointer hover:underline px-3">إلغاء</button>
                <button type="submit" disabled={submittingFault} className="bg-red-700 hover:bg-red-800 text-white font-black text-base px-6 py-3 rounded-lg border-2 border-solid border-black cursor-pointer shadow">{submittingFault ? 'جاري التوثيق...' : 'تثبيت بلاغ العطل وإخراجها من الخدمة'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🟢 مودال تأكيد الإصلاح المحدث */}
      {isRepairModalOpen && repairEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl p-6 md:p-8 rounded-xl border-4 border-solid border-black bg-white text-black shadow-2xl">
            <h3 className="text-xl font-black text-emerald-700 mb-4 border-b-4 border-solid border-black pb-3">إعلان الجاهزية الفنية وإعادة المركبة/المعدة للخدمة</h3>
            <p className="text-base text-black font-black leading-relaxed">أنت على وشك اعتماد إتمام أعمال الصيانة الشاملة وتغيير الحالة التشغيلية للمركبة/المعدة ذات الكود الموحد <span className="text-blue-900 font-black uppercase">{repairEquipment.code}</span>.</p>
            {repairError && <div className="p-3 mb-4 text-sm font-black bg-red-100 text-red-900 rounded border-2 border-solid border-red-700">{repairError}</div>}
            
            <form onSubmit={handleRegisterRepair} className="space-y-5 mt-4">
              <div className="space-y-1.5">
                <label className="text-base font-black text-black">تاريخ إتمام أعمال الصيانة والاعتماد الفني:</label>
                <input type="date" required value={repairDate} onChange={(e) => setRepairDate(e.target.value)} className="w-full px-4 py-3 text-base font-black rounded border-2 border-solid border-black bg-white text-blue-900 outline-none focus:border-black" />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t-4 border-solid border-black">
                <button type="button" onClick={() => setIsRepairModalOpen(false)} className="text-base font-black text-black bg-transparent border-0 cursor-pointer hover:underline px-3">إلغاء</button>
                <button type="submit" disabled={submittingRepair} className="bg-emerald-700 hover:bg-emerald-800 text-white font-black text-base px-6 py-3 rounded-lg border-2 border-solid border-black cursor-pointer shadow">{submittingRepair ? 'جاري التحديث...' : 'اعتماد الجاهزية والتشغيل الميداني الفوري'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
