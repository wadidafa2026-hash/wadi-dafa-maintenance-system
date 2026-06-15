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
  user: { role: 'super_admin' | 'sub_admin' | 'viewer' };
  isDarkMode: boolean;
}

export const Fleet: React.FC<FleetProps> = ({ user, isDarkMode }) => {
  // ─── حالات التحكم في واجهة العرض الخاصة بالأسطول ─────────────────
  const [fleetTab, setFleetTab] = useState<'equipment' | 'vehicle'>('equipment');
  const [searchQuery, setSearchQuery] = useState('');
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);

  // ─── حالات المودالات (Modals) ────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // تسجيل عطل لحظي
  const [isFaultModalOpen, setIsFaultModalOpen] = useState(false);
  const [faultEquipment, setFaultEquipment] = useState<Equipment | null>(null);
  const [faultDate, setFaultDate] = useState('');
  const [repairDate, setRepairDate] = useState('');
  const [faultDetails, setFaultDetails] = useState('');
  const [hasPurchases, setHasPurchases] = useState(false);
  const [purchaseItem, setPurchaseItem] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');

  // 🔄 دالة جلب الآليات حياً من الباك إند
  const fetchEquipmentData = async () => {
    setLoading(true);
    try {
      const resEquip = await fetch('/api/equipment');
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

  // دالة معالجة تسجيل العطل والربط التلقائي بالمشتريات والموقع اللحظي
  const handleRegisterFault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faultEquipment) return;
    
    const finalStatus = repairDate ? 'available' : 'broken';
    const payload = {
      equipmentId: faultEquipment.id,
      faultDate,
      repairDate: repairDate || null,
      details: faultDetails,
      status: finalStatus,
      projectName: faultEquipment.projectName, // ضمان سلامة التقارير القديمة
      purchaseItem: hasPurchases ? purchaseItem : null,
      purchasePrice: hasPurchases ? parseFloat(purchasePrice) : null
    };

    try {
      const response = await fetch('/api/faults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setIsFaultModalOpen(false);
        setFaultDetails(''); setFaultDate(''); setRepairDate(''); setHasPurchases(false); setPurchaseItem(''); setPurchasePrice('');
        fetchEquipmentData(); // تحديث فوري لحالة المعدة في الأسطول
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* التابات العلوية لفصل المعدات عن السيارات */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8 font-black text-md justify-center md:justify-start">
        <button onClick={() => setFleetTab('equipment')} className={`pb-3 transition-all border-0 bg-transparent cursor-pointer font-sans text-md ${fleetTab === 'equipment' ? 'border-b-4 border-solid border-blue-500 text-blue-500 font-black' : 'text-slate-400 font-bold'}`}>⚙️ قسم المعدات الثقيلة</button>
        <button onClick={() => setFleetTab('vehicle')} className={`pb-3 transition-all border-0 bg-transparent cursor-pointer font-sans text-md ${fleetTab === 'vehicle' ? 'border-b-4 border-solid border-blue-500 text-blue-500 font-black' : 'text-slate-400 font-bold'}`}>🚚 قسم المركبات والسيارات</button>
      </div>

      {/* شريط البحث وزر الإضافة */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-slate-500/5 p-4 rounded-xl">
        <input type="text" placeholder={fleetTab === 'equipment' ? "🔍 ابحث عن معدة برقم الكود..." : "🔍 ابحث عن مركبة برقم الكود..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full md:max-w-md px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-500 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`} />
        {user.role !== 'viewer' && (
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
                {user.role !== 'viewer' && (
                  <div className="mt-4 pt-3 border-t border-solid border-slate-500/10 flex gap-2 justify-end">
                    <button onClick={(e) => { e.stopPropagation(); setFaultEquipment(item); setIsFaultModalOpen(true); }} className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all border-0 cursor-pointer">
                      ⚠️ تعطلت / صيانة
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* ⚠️ مودال فتح بلاغ عطل طارئ ومشتريات طارئة */}
      {isFaultModalOpen && faultEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleRegisterFault} className={`w-full max-w-md p-6 rounded-2xl border border-solid shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'}`}>
            <div>
              <h3 className="text-md font-black text-red-500 m-0">⚠️ فتح بلاغ عطل وصيانة للآلية</h3>
              <p className="text-xs text-slate-400 m-0 mt-0.5">يرتبط تلقائياً بكود الآلية <span className="text-blue-500 font-bold">{faultEquipment.code}</span> وبالمشروع اللحظي لها <span className="text-amber-500 font-bold">({faultEquipment.projectName || 'الورشة'})</span>.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 block">تاريخ العطل:</label>
                <input type="date" required value={faultDate} onChange={(e) => setFaultDate(e.target.value)} className={`w-full px-3 py-1.5 text-xs rounded-xl border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 block">تاريخ الاصلاح (اختياري):</label>
                <input type="date" value={repairDate} onChange={(e) => setRepairDate(e.target.value)} className={`w-full px-3 py-1.5 text-xs rounded-xl border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block">تفاصيل ووصف العطل:</label>
              <textarea rows={3} required placeholder="اكتب تفاصيل العطل الفني بكل أريحية ونزول لأسطر جديدة..." value={faultDetails} onChange={(e) => setFaultDetails(e.target.value)} className={`w-full px-3 py-2 text-xs rounded-xl border outline-none resize-y ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
            </div>

            <div className="p-3 rounded-xl border border-dashed border-slate-500/20 space-y-2 bg-slate-500/5">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="checkPurchases" checked={hasPurchases} onChange={(e) => setHasPurchases(e.target.checked)} className="rounded cursor-pointer" />
                <label htmlFor="checkPurchases" className="text-[11px] font-black text-amber-500 cursor-pointer select-none">💰 هل تم شراء قطع غيار أو زيوت؟ (ربط مالي تلقائي)</label>
              </div>
              {hasPurchases && (
                <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-100">
                  <input type="text" required placeholder="اسم القطعة" value={purchaseItem} onChange={(e) => setPurchaseItem(e.target.value)} className={`w-full px-2 py-1.5 text-xs rounded-lg border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`} />
                  <input type="number" required placeholder="السعر بالريال" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className={`w-full px-2 py-1.5 text-xs rounded-lg border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`} />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-1 items-center">
              <button type="button" onClick={() => setIsFaultModalOpen(false)} className="text-xs text-slate-400 bg-transparent border-0 cursor-pointer font-bold">إلغاء</button>
              <button type="submit" className="bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md border-0 cursor-pointer hover:bg-red-700">💾 حفظ بلاغ الصيانة والمشتريات</button>
            </div>
          </form>
        </div>
      )}

      {/* المودالات الملحقة الذكية الأخرى المستدعاة جاهزة */}
      <AddEquipmentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} type={fleetTab} onSuccess={fetchEquipmentData} isDarkMode={isDarkMode} />
      <EquipmentProfileModal equipment={selectedEquipment} isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onRefresh={fetchEquipmentData} userRole={user.role} isDarkMode={isDarkMode} />

    </div>
  );
};
