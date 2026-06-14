// client/src/components/EquipmentProfileModal.tsx
import React, { useState, useEffect } from 'react';

interface Equipment {
  id: number;
  name: string;
  code: string;
  model: string | null;
  type: 'equipment' | 'vehicle';
  serialNumber: string | null;
  plateNumber: string | null;
  status: 'available' | 'broken';
  projectName: string | null;
}

interface MaintenanceLog {
  id: number;
  projectNameSnapshot: string;
  breakdownDate: string;
  repairDate: string | null;
  details: string | null;
  status: 'broken' | 'repaired';
}

interface PurchaseItem {
  itemName: string;
  price: number;
}

interface EquipmentProfileModalProps {
  equipment: Equipment | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void; // لتحديث الجدول الرئيسي بعد تغيير الحالة
}

export const EquipmentProfileModal: React.FC<EquipmentProfileModalProps> = ({ equipment, isOpen, onClose, onRefresh }) => {
  const [history, setHistory] = useState<MaintenanceLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // حالات تسجيل العطل
  const [showBreakdownForm, setShowBreakdownForm] = useState(false);
  const [breakdownDate, setBreakdownDate] = useState('');
  const [details, setDetails] = useState('');

  // حالات إغلاق العطل والإصلاح
  const [showRepairForm, setShowRepairForm] = useState(false);
  const [repairDate, setRepairDate] = useState('');

  // حالات إضافة مشتريات ديناميكية لفاتورة العطل الحالي
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [activeLogIdForPurchase, setActiveLogIdForPurchase] = useState<number | null>(null);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([{ itemName: '', price: 0 }]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // جلب سجل الصيانة بالمسار النسبي التلقائي لبوابات فيرسيل
  const fetchMaintenanceHistory = async () => {
    if (!equipment) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/maintenance/history/${equipment.id}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen && equipment) {
      fetchMaintenanceHistory();
      setShowBreakdownForm(false);
      setShowRepairForm(false);
      setShowPurchaseForm(false);
      setError(null);
    }
  }, [isOpen, equipment]);

  if (!isOpen || !equipment) return null;

  // الإجراء 1: تسجيل بلاغ عطل (تعطلت)
  const handleLogBreakdown = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/maintenance/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipmentId: equipment.id, breakdownDate, details }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تسجيل العطل');

      setShowBreakdownForm(false);
      fetchMaintenanceHistory();
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // الإجراء 2: تسجيل جاهزية وإصلاح
  const handleLogRepair = async (e: React.FormEvent, logId: number) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/maintenance/repair/${logId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repairDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إغلاق البلاغ');

      setShowRepairForm(false);
      fetchMaintenanceHistory();
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // الإجراء 3: معالجة الفاتورة الديناميكية للمشتريات
  const addPurchaseRow = () => {
    setPurchaseItems([...purchaseItems, { itemName: '', price: 0 }]);
  };

  const removePurchaseRow = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const handlePurchaseItemChange = (index: number, field: keyof PurchaseItem, value: string | number) => {
    const updated = [...purchaseItems];
    if (field === 'price') {
      updated[index].price = Number(value);
    } else {
      updated[index].itemName = value as string;
    }
    setPurchaseItems(updated);
  };

  const handleSavePurchases = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLogIdForPurchase) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenanceLogId: activeLogIdForPurchase, items: purchaseItems }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حفظ Mشتريات');

      setShowPurchaseForm(false);
      setPurchaseItems([{ itemName: '', price: 0 }]);
      alert('تم حفظ فاتورة قطع الغيار بنجاح في سجل العطل ماليًا!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeBrokenLog = history.find(log => log.status === 'broken');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4" dir="rtl">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider bg-blue-600 px-2 py-0.5 rounded ml-2">
              {equipment.code}
            </span>
            <span className="text-lg font-bold">{equipment.name}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
          {error && (
            <div className="bg-red-50 border-r-4 border-red-500 text-red-700 p-3 rounded text-sm">
              ⚠️ {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="space-y-1.5 text-sm">
              <p><span className="text-slate-400">التصنيف الفني:</span> {equipment.type === 'equipment' ? '⚙️ معدة ثقيلة' : '🚚 مركبة حركية'}</p>
              <p><span className="text-slate-400">{equipment.type === 'equipment' ? 'الرقم التسلسلي:' : 'رقم اللوحة:'}</span> <span className="font-mono bg-white px-2 py-0.5 rounded border text-xs">{equipment.type === 'equipment' ? equipment.serialNumber : equipment.plateNumber}</span></p>
              <p><span className="text-slate-400">الموقع الحالي المسجل:</span> <span className="font-semibold text-slate-800">{equipment.projectName || 'خارج الخدمة (الورشة)'}</span></p>
            </div>

            <div className="flex flex-col justify-center items-end gap-2">
              {equipment.status === 'available' ? (
                <button
                  onClick={() => { setShowBreakdownForm(true); setShowRepairForm(false); }}
                  className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all shadow-md shadow-red-600/10"
                >
                  🚨 تسجيل بلاغ عطل فوري (تعطلت)
                </button>
              ) : (
                <div className="w-full space-y-2">
                  <button
                    onClick={() => { setShowRepairForm(true); setShowBreakdownForm(false); }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all shadow-md shadow-emerald-600/10"
                  >
                    🛠️ إغلاق البلاغ وإعلان الجاهزية (تم الإصلاح)
                  </button>
                  {activeBrokenLog && (
                    <button
                      onClick={() => { setShowPurchaseForm(true); setActiveLogIdForPurchase(activeBrokenLog.id); }}
                      className="w-full bg-amber-50 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all shadow-md"
                    >
                      💰 ربط فاتورة قطع غيار ومشتريات للعطل
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* فورم بلاغ العطل */}
          {showBreakdownForm && (
            <form onSubmit={handleLogBreakdown} className="bg-red-50/50 p-4 rounded-xl border border-red-200 animate-in slide-in-from-top-2 space-y-3">
              <h4 className="text-sm font-bold text-red-900">أورنيك بلاغ عطل جديد</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">تاريخ ووقت العطل *</label>
                  <input type="datetime-local" required value={breakdownDate} onChange={(e) => setBreakdownDate(e.target.value)} className="w-full p-2 border rounded-md text-xs bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">تفاصيل ومظهر العطل الفني</label>
                  <input type="text" placeholder="مثال: خلط زيت مع الموية، كسر في الجنزير" value={details} onChange={(e) => setDetails(e.target.value)} className="w-full p-2 border rounded-md text-xs bg-white" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowBreakdownForm(false)} className="px-3 py-1 text-xs text-gray-500">إلغاء</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-1 text-xs bg-red-600 text-white rounded font-medium">تأكيد البلاغ</button>
              </div>
            </form>
          )}

          {/* فورم الإصلاح */}
          {showRepairForm && activeBrokenLog && (
            <form onSubmit={(e) => handleLogRepair(e, activeBrokenLog.id)} className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 animate-in slide-in-from-top-2 space-y-3">
              <h4 className="text-sm font-bold text-emerald-900">إعلان جاهزية الآلية والعودة للميدان</h4>
              <div>
                <label className="block text-xs font-medium mb-1">تاريخ ووقت إتمام الإصلاح الفعلي *</label>
                <input type="datetime-local" required value={repairDate} onChange={(e) => setRepairDate(e.target.value)} className="w-full p-2 border rounded-md text-xs bg-white" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowRepairForm(false)} className="px-3 py-1 text-xs text-gray-500">إلغاء</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-1 text-xs bg-emerald-600 text-white rounded font-medium">تأكيد الجاهزية</button>
              </div>
            </form>
          )}

          {/* فورم المشتريات الفاتورة */}
          {showPurchaseForm && (
            <form onSubmit={handleSavePurchases} className="bg-amber-50/40 p-4 rounded-xl border border-amber-200 space-y-3 animate-in fade-in">
              <h4 className="text-sm font-bold text-amber-900">قائمة مشتريات وقطع غيار العطل الحالي</h4>
              {purchaseItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text" required placeholder="اسم قطعة الغيار" value={item.itemName}
                    onChange={(e) => handlePurchaseItemChange(index, 'itemName', e.target.value)}
                    className="flex-1 p-2 border rounded text-xs bg-white"
                  />
                  <input
                    type="number" required min="1" placeholder="السعر" value={item.price || ''}
                    onChange={(e) => handlePurchaseItemChange(index, 'price', e.target.value)}
                    className="w-28 p-2 border rounded text-xs bg-white"
                  />
                  {purchaseItems.length > 1 && (
                    <button type="button" onClick={() => removePurchaseRow(index)} className="text-red-500 text-sm font-bold px-1">&times;</button>
                  )}
                </div>
              ))}
              <div className="flex justify-between items-center pt-2">
                <button type="button" onClick={addPurchaseRow} className="text-xs text-blue-700 font-semibold hover:underline">
                  ➕ إضافة سطر قطعة غيار أخرى
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowPurchaseForm(false)} className="px-3 py-1 text-xs text-gray-500">إلغاء</button>
                  <button type="submit" disabled={isSubmitting} className="px-4 py-1 text-xs bg-amber-600 text-white rounded font-medium">حفظ الفاتورة</button>
                </div>
              </div>
            </form>
          )}

          {/* سجل تاريخ الصيانة */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-800 border-b pb-1">📋 سجل الصيانة التاريخي للآلية</h4>
            {loadingHistory ? (
              <p className="text-xs text-slate-400">جاري تحميل السجلات التاريخية...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-slate-400">لا توجد بلاغات صيانة سابقة.</p>
            ) : (
              <div className="space-y-3 border-r-2 border-slate-200 mr-2 pr-4 relative">
                {history.map((log) => (
                  <div key={log.id} className="relative text-xs">
                    <div className={`absolute -right-[23px] top-1 w-2.5 h-2.5 rounded-full ${log.status === 'broken' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-800">📍 الموقع: {log.projectNameSnapshot}</span>
                        <span className={`px-1.5 py-0.5 rounded font-bold ${log.status === 'broken' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {log.status === 'broken' ? 'تحت الإصلاح' : 'تم الإصلاح'}
                        </span>
                      </div>
                      {log.details && <p className="text-slate-600"><span className="text-slate-400">التفاصيل:</span> {log.details}</p>}
                      <p className="text-[11px] text-slate-400">
                        🗓️ تعطل: {new Date(log.breakdownDate).toLocaleString('ar-SA')} 
                        {log.repairDate && ` | ✅ جاهزية: ${new Date(log.repairDate).toLocaleString('ar-SA')}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
