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

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* التابات العلوية واضحة ومكبرة */}
      <div className="flex border-b-2 border-slate-200 dark:border-slate-800 gap-10 justify-center md:justify-start">
        <button 
          onClick={() => setFleetTab('equipment')} 
          className={`pb-4 transition-all border-0 bg-transparent cursor-pointer font-sans text-lg ${fleetTab === 'equipment' ? 'border-b-4 border-solid border-blue-800 text-blue-800 font-black' : 'text-slate-500 font-bold'}`}
        >
          قسم المعدات الثقيلة
        </button>
        <button 
          onClick={() => setFleetTab('vehicle')} 
          className={`pb-4 transition-all border-0 bg-transparent cursor-pointer font-sans text-lg ${fleetTab === 'vehicle' ? 'border-b-4 border-solid border-blue-800 text-blue-800 font-black' : 'text-slate-500 font-bold'}`}
        >
          قسم المركبات والسيارات
        </button>
      </div>

      {/* شريط البحث وزر الإضافة متباينة الألوان */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-blue-50 dark:bg-slate-900 p-5 rounded-2xl border-2 border-solid border-blue-100 dark:border-slate-800">
        <input 
          type="text" 
          placeholder={fleetTab === 'equipment' ? "البحث عن معدة بإدخال رقم الكود الموحد..." : "البحث عن مركبة بإدخال رقم الكود الموحد..."} 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className={`w-full md:max-w-xl px-5 py-3 rounded-xl border-2 text-base font-bold outline-none focus:border-blue-800 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'}`} 
        />
        {userRole !== 'viewer' && (
          <button 
            onClick={() => setIsAddModalOpen(true)} 
            className="bg-blue-800 hover:bg-blue-900 text-white font-black px-6 py-3.5 rounded-xl text-base shadow-md border-0 cursor-pointer transition-all"
          >
            {fleetTab === 'equipment' ? 'إضافة معدة جديدة للأسطول' : 'إضافة مركبة جديدة للأسطول'}
          </button>
        )}
      </div>

      {/* عرض كروت الأسطول بخطوط داكنة وعريضة جداً */}
      {loading ? (
        <p className="text-center text-lg font-bold text-slate-700 dark:text-slate-400 animate-pulse py-6">جاري تحميل بيانات الأسطول الحالية...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipmentList
            .filter(item => item.type === fleetTab && item.code.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((item) => (
              <div key={item.id} className={`p-6 rounded-2xl border-2 flex flex-col justify-between hover:shadow-lg transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
                <div className="cursor-pointer space-y-4" onClick={() => { setSelectedEquipment(item); setIsProfileModalOpen(true); }}>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-black text-blue-900 dark:text-blue-400 uppercase tracking-wide">{item.code}</span>
                    <span className={`px-4 py-1 rounded-full text-sm font-black ${item.status === 'available' ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-950 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {item.status === 'available' ? 'جاهز للعمل' : 'معطلة حالياً'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-lg text-slate-900 dark:text-white m-0 leading-tight">{item.name}</h4>
                    <p className="text-base text-slate-800 dark:text-slate-300 font-bold m-0 mt-2">
                      {item.type === 'equipment' ? `الرقم التسلسلي: ${item.serialNumber || 'غير مسجل'}` : `رقم اللوحة المرورية: ${item.plateNumber || 'غير مسجل'}`}
                    </p>
                  </div>

                  <div className="pt-3 border-t-2 border-solid border-slate-200 dark:border-slate-800 flex justify-between items-center text-base">
                    <span className="text-slate-900 dark:text-slate-400 font-bold">الموقع الميداني الحالي:</span>
                    <span className="font-black text-blue-900 dark:text-blue-400">{item.projectName || 'الورشة المركزية'}</span>
                  </div>

                </div>
                
                {/* الأزرار التبادلية الواضحة وسهلة الضغط */}
                {userRole !== 'viewer' && (
                  <div className="mt-5 pt-4 border-t-2 border-solid border-slate-200 dark:border-slate-800 flex gap-2 justify-end">
                    {item.status === 'available' ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setFaultEquipment(item); setIsFaultModalOpen(true); }} 
                        className="bg-red-100 hover:bg-red-600 text-red-900 hover:text-white dark:bg-red-900/20 dark:text-red-400 text-sm px-5 py-2.5 rounded-xl font-black transition-all border-0 cursor-pointer shadow-sm"
                      >
                        تسجيل بلاغ عطل
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setRepairEquipment(item); setIsRepairModalOpen(true); }} 
                        className="bg-emerald-100 hover:bg-emerald-600 text-emerald-900 hover:text-white dark:bg-emerald-900/20 dark:text-emerald-400 text-sm px-5 py-2.5 rounded-xl font-black transition-all border-0 cursor-pointer shadow-sm"
                      >
                        إصلاح وإعادة الخدمة
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* مودال فتح بلاغ عطل وصيانة */}
      {isFaultModalOpen && faultEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form onSubmit={handleRegisterFault} className={`w-full max-w-xl p-8 rounded-2xl border-2 border-solid shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div>
              <h3 className="text-xl font-black text-red-600 m-0">تسجيل بلاغ عطل فني طارئ</h3>
              <p className="text-base text-slate-800 dark:text-slate-300 font-bold m-0 mt-2">إصدار بلاغ فني مخصص للمعدة ذات الكود المشترك: <span className="text-blue-800 dark:text-blue-400 font-black">{faultEquipment.code}</span></p>
            </div>

            {faultError && <div className="p-4 text-base font-black bg-red-100 text-red-900 rounded-xl border-2 border-red-200">{faultError}</div>}

            <div className="space-y-2">
              <label className="text-base font-black text-slate-900 dark:text-slate-300 block">تاريخ حدوث العطل الفعلي:</label>
              <input 
                type="date" 
                required 
                value={breakdownDate} 
                onChange={(e) => setBreakdownDate(e.target.value)} 
                className={`w-full px-4 py-3 text-base font-bold rounded-xl border-2 outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900 focus:border-red-600'}`} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-base font-black text-slate-900 dark:text-slate-300 block">وصف وتفاصيل العطل الفني (توضيح طبيعة المشكلة):</label>
              <textarea 
                rows={6} 
                placeholder="يرجى كتابة شرح توضيحي طبيعي للمشكلة الفنية الحالية، مثل تعطل منظومة الهيدروليك أو الحاجة لاستبدال قطع محددة..." 
                value={faultDetails} 
                onChange={(e) => setFaultDetails(e.target.value)} 
                className={`w-full px-4 py-3 text-base rounded-xl border-2 outline-none min-h-[150px] font-sans font-bold leading-relaxed ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-red-500' : 'bg-white border-slate-300 text-slate-900 focus:border-red-600'}`} 
              />
            </div>

            <div className="flex justify-end gap-4 pt-3 items-center">
              <button 
                type="button" 
                onClick={() => { setIsFaultModalOpen(false); setFaultError(null); }} 
                disabled={submittingFault} 
                className="text-base text-slate-900 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-5 py-2.5 rounded-xl border-0 cursor-pointer font-black hover:bg-slate-300"
              >
                إلغاء التعديل
              </button>
              <button 
                type="submit" 
                disabled={submittingFault} 
                className="bg-red-600 text-white font-black text-base px-6 py-3 rounded-xl shadow-md border-0 cursor-pointer hover:bg-red-700 disabled:bg-red-800"
              >
                {submittingFault ? 'جاري حفظ القيد...' : 'حفظ بلاغ العطل بالنظام'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* مودال تم الإصلاح وإعادة الجاهزية للعمل */}
      {isRepairModalOpen && repairEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form onSubmit={handleRegisterRepair} className={`w-full max-w-lg p-8 rounded-2xl border-2 border-solid shadow-2xl space-y-5 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div>
              <h3 className="text-xl font-black text-emerald-600 m-0">إغلاق بلاغ الصيانة وإعادة الجاهزية</h3>
              <p className="text-base text-slate-800 dark:text-slate-300 font-bold m-0 mt-2">سيتم إعادة تعيين كود الآلية: <span className="text-blue-800 dark:text-blue-400 font-black">{repairEquipment.code}</span> إلى حالة التشغيل الجاهزة.</p>
            </div>

            {repairError && <div className="p-4 text-base font-black bg-red-100 text-red-900 rounded-xl border-2 border-red-200">{repairError}</div>}

            <div className="space-y-2">
              <label className="text-base font-black text-slate-900 dark:text-slate-300 block">التاريخ الفعلي لإتمام الإصلاح والجاهزية للعمل:</label>
              <input 
                type="date" 
                required 
                value={repairDate} 
                onChange={(e) => setRepairDate(e.target.value)} 
                className={`w-full px-4 py-3 text-base font-bold rounded-xl border-2 outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600'}`} 
              />
            </div>

            <div className="flex justify-end gap-4 pt-3 items-center">
              <button 
                type="button" 
                onClick={() => { setIsRepairModalOpen(false); setRepairError(null); }} 
                disabled={submittingRepair} 
                className="text-base text-slate-900 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-5 py-2.5 rounded-xl border-0 cursor-pointer font-black hover:bg-slate-300"
              >
                إلغاء التعديل
              </button>
              <button 
                type="submit" 
                disabled={submittingRepair} 
                className="bg-emerald-600 text-white font-black text-base px-6 py-3 rounded-xl shadow-md border-0 cursor-pointer hover:bg-emerald-700 disabled:bg-emerald-800"
              >
                {submittingRepair ? 'جاري تحديث القيد...' : 'تأكيد اكتمال الإصلاح الفني'}
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
