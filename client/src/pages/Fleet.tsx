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
  isDarkMode: boolean; // متروكة للتوافق البرمجي لكن الواجهة ثابتة على تباين عالي ناصع
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
      <div className="space-y-4 pt-4">
        <div className={`p-4 border-4 border-solid border-black ${isAlertGroup ? 'bg-black text-white' : 'bg-white text-black'}`}>
          <h4 className="text-xl md:text-2xl font-black m-0 uppercase tracking-wide">
            {title} (العدد الإجمالي: {items.length})
          </h4>
        </div>
        
        {/* العرض للشاشات الكبيرة (الكمبيوتر وعبر الأسطر) - تباين كامل حاد */}
        <div className="hidden md:block overflow-x-auto border-4 border-solid border-black bg-white">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b-4 border-solid border-black bg-black text-white text-base font-black">
                <th className="p-4 border-l-2 border-solid border-white">كود القيد الموحد</th>
                <th className="p-4 border-l-2 border-solid border-white">الاسم الرسمي</th>
                <th className="p-4 border-l-2 border-solid border-white">البيان الفني الرسمي</th>
                <th className="p-4 border-l-2 border-solid border-white">الموقع والمشروع الحالي</th>
                <th className="p-4 border-l-2 border-solid border-white text-center">الحالة التشغيلية</th>
                {userRole !== 'viewer' && <th className="p-4 text-left">الإجراءات والعمليات</th>}
              </tr>
            </thead>
            <tbody className="text-black font-black text-base divide-y-2 divide-solid divide-black">
              {items.map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => { setSelectedEquipment(item); setIsProfileModalOpen(true); }}
                  className={`cursor-pointer transition-colors hover:bg-black/5 ${isAlertGroup ? 'bg-red-100/50' : 'bg-white'}`}
                >
                  <td className="p-4 border-l border-solid border-black text-lg text-black font-black tracking-wider uppercase">{item.code}</td>
                  <td className="p-4 border-l border-solid border-black text-black">{item.name}</td>
                  <td className="p-4 border-l border-solid border-black text-black">
                    {item.type === 'equipment' ? `رقم التسلسل: ${item.serialNumber || 'غير مسجل'}` : `رقم اللوحة: ${item.plateNumber || 'غير مسجل'}`}
                  </td>
                  <td className="p-4 border-l border-solid border-black text-black font-bold">{item.projectName || 'الورشة المركزية'}</td>
                  <td className="p-4 border-l border-solid border-black text-center">
                    <span className={`inline-block px-4 py-1 border-2 border-solid border-black font-black text-sm ${isAlertGroup ? 'bg-black text-white' : 'bg-white text-black'}`}>
                      {isAlertGroup ? 'معطلة وخارج الخدمة' : 'جاهز للعمل الميداني'}
                    </span>
                  </td>
                  {userRole !== 'viewer' && (
                    <td className="p-4 text-left" onClick={(e) => e.stopPropagation()}>
                      {isAlertGroup ? (
                        <button 
                          onClick={() => { 
                            setRepairEquipment(item); 
                            setIsRepairModalOpen(true); 
                          }} 
                          className="bg-white hover:bg-black hover:text-white text-black text-base px-5 py-2.5 border-4 border-solid border-black font-black cursor-pointer transition-colors"
                        >
                          إعلان جاهزية وإصلاح
                        </button>
                      ) : (
                        <button 
                          onClick={() => { 
                            setFaultEquipment(item); 
                            setIsFaultModalOpen(true); 
                          }} 
                          className="bg-black text-white text-base px-5 py-2.5 border-4 border-solid border-black font-black cursor-pointer transition-colors"
                        >
                          تسجيل بلاغ عطل فني
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* كروت مرنة ومتوافقة للجوال - نصوص سوداء حادة وحقول ضخمة لقراءة سهلة */}
        <div className="block md:hidden space-y-4">
          {items.map((item) => (
            <div 
              key={item.id}
              onClick={() => { setSelectedEquipment(item); setIsProfileModalOpen(true); }}
              className={`p-5 border-4 border-solid border-black flex flex-col gap-3 bg-white ${isAlertGroup ? 'bg-red-50' : 'bg-white'}`}
            >
              <div className="flex justify-between items-center border-b-2 border-solid border-black pb-2">
                <span className="text-xl font-black uppercase text-black tracking-wide">{item.code}</span>
                <span className={`px-3 py-1 border-2 border-solid border-black text-xs font-black ${isAlertGroup ? 'bg-black text-white' : 'bg-white text-black'}`}>
                  {isAlertGroup ? 'معطلة' : 'جاهز'}
                </span>
              </div>
              <div className="space-y-1">
                <h5 className="text-lg font-black m-0 text-black">{item.name}</h5>
                <p className="text-sm font-bold m-0 text-black">
                  {item.type === 'equipment' ? `رقم التسلسل: ${item.serialNumber || 'لا يوجد'}` : `رقم اللوحة: ${item.plateNumber || 'لا يوجد'}`}
                </p>
                <p className="text-sm font-black m-0 text-black pt-1">
                  الموقع: <span className="underline">{item.projectName || 'الورشة المركزية'}</span>
                </p>
              </div>
              {userRole !== 'viewer' && (
                <div className="pt-3 border-t-2 border-solid border-black flex justify-end" onClick={(e) => e.stopPropagation()}>
                  {isAlertGroup ? (
                    <button 
                      onClick={() => { 
                        setRepairEquipment(item); 
                        setIsRepairModalOpen(true); 
                      }} 
                      className="w-full bg-white text-black text-base py-3 border-4 border-solid border-black font-black cursor-pointer"
                    >
                      إعلان جاهزية وإصلاح للمعدة
                    </button>
                  ) : (
                    <button 
                      onClick={() => { 
                        setFaultEquipment(item); 
                        setIsFaultModalOpen(true); 
                      }} 
                      className="w-full bg-black text-white text-base py-3 border-4 border-solid border-black font-black cursor-pointer"
                    >
                      تسجيل بلاغ عطل فني فوري
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
    <div className="space-y-8 w-full box-border bg-white text-black" dir="rtl">
      
      {/* تابات الاختيار والتبديل الموحدة - نصوص صريحة بدون أيقونات */}
      <div className="flex border-b-4 border-solid border-black gap-4 justify-center md:justify-start w-full">
        <button 
          onClick={() => setFleetTab('equipment')} 
          className={`pb-4 px-6 border-0 bg-transparent cursor-pointer text-lg md:text-xl font-black transition-all ${fleetTab === 'equipment' ? 'border-b-8 border-solid border-black text-black' : 'text-black/40'}`}
        >
          قسم المعدات الثقيلة
        </button>
        <button 
          onClick={() => setFleetTab('vehicle')} 
          className={`pb-4 px-6 border-0 bg-transparent cursor-pointer text-lg md:text-xl font-black transition-all ${fleetTab === 'vehicle' ? 'border-b-8 border-solid border-black text-black' : 'text-black/40'}`}
        >
          قسم المركبات
        </button>
      </div>

      {/* محرك البحث والفلترة وإضافة البيانات - حقول ضخمة ومقروءة جداً */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-stretch gap-4 bg-white p-6 border-4 border-solid border-black">
        <input 
          type="text" 
          placeholder="ابحث بإدخال كود القيد الموحد هنا..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className="w-full lg:max-w-2xl px-5 py-4 rounded-none border-4 border-solid border-black text-base md:text-lg font-black text-black outline-none placeholder-black/50 bg-white" 
        />
        {userRole !== 'viewer' && (
          <button 
            onClick={() => setIsAddModalOpen(true)} 
            className="w-full lg:w-auto bg-black hover:bg-black/80 text-white font-black px-8 py-4 rounded-none text-base md:text-lg border-4 border-solid border-black cursor-pointer transition-colors"
          >
            {fleetTab === 'equipment' ? 'إضافة معدة جديدة للأسطول' : 'إضافة مركبة جديدة للأسطول'}
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-center text-xl font-black text-black py-12 animate-pulse">جاري جلب تحديثات قاعدة البيانات حالياً...</p>
      ) : (
        <div className="space-y-12 w-full">
          <RenderGroupTable items={brokenItems} title="كشف البلاغات الحالية: معدات ومركبات معطلة" isAlertGroup={true} />
          <RenderGroupTable items={availableItems} title="كشف الحصر الحالي: معدات ومركبات تعمل بكفاءة" isAlertGroup={false} />
          {filteredList.length === 0 && (
            <div className="text-center p-12 border-4 border-dashed border-black">
              <p className="text-lg font-black text-black m-0">لا توجد نتائج مطابقة لرمز الكود المدخل في البحث.</p>
            </div>
          )}
        </div>
      )}

      {/* 🛠️ المودالات الفرعية المحدثة - الحجم كبير، مريح جداً، والحقول ضخمة للرؤية */}
      <AddEquipmentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} type={fleetTab} onSuccess={fetchEquipmentData} isDarkMode={false} />
      
      {isProfileModalOpen && selectedEquipment && (
        <EquipmentProfileModal 
          equipment={selectedEquipment} 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
          onRefresh={fetchEquipmentData} 
          userRole={userRole} 
          isDarkMode={false} 
        />
      )}

      {/* 🔴 مودال تسجيل العطل - حجم عملاق وحقول ضخمة مريحة للعين والنظر لضعاف النظر */}
      {isFaultModalOpen && faultEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl p-8 bg-white border-4 border-solid border-black text-black rounded-none shadow-none max-h-[90vh] overflow-y-auto" dir="rtl">
            
            <div className="border-b-4 border-solid border-black pb-4 mb-6">
              <h3 className="text-2xl md:text-3xl font-black text-black m-0">تسجيل بلاغ عطل فني</h3>
              <p className="text-base font-bold text-black mt-2">كود القيد المستهدف: <span className="underline font-black">{faultEquipment.code}</span> | الاسم: {faultEquipment.name}</p>
            </div>

            {faultError && (
              <div className="p-4 mb-6 text-base font-black bg-black text-white border-4 border-solid border-black">
                خطأ من السيرفر: {faultError}
              </div>
            )}

            <form onSubmit={handleRegisterFault} className="space-y-6">
              <div className="space-y-2">
                <label className="text-base md:text-lg font-black text-black block">تاريخ رصد وحدوث العطل الميداني:</label>
                <input 
                  type="date" 
                  required 
                  value={breakdownDate} 
                  onChange={(e) => setBreakdownDate(e.target.value)} 
                  className="w-full px-4 py-3.5 text-base md:text-lg font-black rounded-none border-4 border-solid border-black outline-none bg-white text-black" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-base md:text-lg font-black text-black block">بيان ومظاهر المشكلة الفنية بالتفصيل:</label>
                <textarea 
                  rows={4} 
                  required
                  placeholder="الرجاء كتابة تفاصيل العطل هنا بوضوح (مثال: كسر في ذراع الهيدروليك، تهريب زيت الماكينة)" 
                  value={faultDetails} 
                  onChange={(e) => setFaultDetails(e.target.value)} 
                  className="w-full px-4 py-3.5 text-base md:text-lg font-black rounded-none border-4 border-solid border-black outline-none resize-none bg-white text-black" 
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4 border-t-4 border-solid border-black">
                <button 
                  type="button" 
                  onClick={() => setIsFaultModalOpen(false)} 
                  className="w-full sm:w-auto text-base md:text-lg font-black text-black bg-white border-4 border-solid border-black px-6 py-3 cursor-pointer hover:bg-black hover:text-white transition-colors"
                >
                  إلغاء وإغلاق النافذة
                </button>
                <button 
                  type="submit" 
                  disabled={submittingFault} 
                  className="w-full sm:w-auto bg-black text-white font-black text-base md:text-lg px-8 py-3 border-4 border-solid border-black cursor-pointer disabled:opacity-50"
                >
                  {submittingFault ? 'جاري توثيق البلاغ...' : 'اعتماد العطل وإخراجها من الخدمة'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 🟢 مودال تأكيد الإصلاح وإعادة التشغيل - حجم كبير ومقروء جداً لضعاف النظر */}
      {isRepairModalOpen && repairEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl p-8 bg-white border-4 border-solid border-black text-black rounded-none shadow-none max-h-[90vh] overflow-y-auto" dir="rtl">
            
            <div className="border-b-4 border-solid border-black pb-4 mb-6">
              <h3 className="text-2xl md:text-3xl font-black text-black m-0">إعلان جاهزية وإعادة الخدمة للأسطول</h3>
              <p className="text-base font-bold text-black mt-2">أنت تقر بانتهاء أعمال الصيانة بالكامل للرمز الموحد: <span className="underline font-black">{repairEquipment.code}</span></p>
            </div>

            {repairError && (
              <div className="p-4 mb-6 text-base font-black bg-black text-white border-4 border-solid border-black">
                خطأ من السيرفر: {repairError}
              </div>
            )}

            <form onSubmit={handleRegisterRepair} className="space-y-6">
              <div className="space-y-2">
                <label className="text-base md:text-lg font-black text-black block">تاريخ الانتهاء الفعلي من الإصلاح والموافقة:</label>
                <input 
                  type="date" 
                  required 
                  value={repairDate} 
                  onChange={(e) => setRepairDate(e.target.value)} 
                  className="w-full px-4 py-3.5 text-base md:text-lg font-black rounded-none border-4 border-solid border-black outline-none bg-white text-black" 
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4 border-t-4 border-solid border-black">
                <button 
                  type="button" 
                  onClick={() => setIsRepairModalOpen(false)} 
                  className="w-full sm:w-auto text-base md:text-lg font-black text-black bg-white border-4 border-solid border-black px-6 py-3 cursor-pointer hover:bg-black hover:text-white transition-colors"
                >
                  إلغاء الأمر
                </button>
                <button 
                  type="submit" 
                  disabled={submittingRepair} 
                  className="w-full sm:w-auto bg-black text-white font-black text-base md:text-lg px-8 py-3 border-4 border-solid border-black cursor-pointer disabled:opacity-50"
                >
                  {submittingRepair ? 'جاري تحديث السيرفر...' : 'تأكيد وإرجاعها للعمل الميداني فورا'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
