// client/src/pages/Reports.tsx
import React, { useState, useEffect } from 'react';

interface Equipment {
  id: number;
  code: string;
  name: string;
  type: 'equipment' | 'vehicle';
}

interface FaultRecord {
  id: number;
  equipmentId: number;
  equipmentCode: string;
  equipmentName: string;
  equipmentType: 'equipment' | 'vehicle';
  serialNumber: string | null;
  plateNumber: string | null;
  breakdownDate: string;
  repairDate: string | null;
  details: string | null;
  projectNameSnapshot: string;
  purchaseItem: string | null;
  purchasePrice: number | null;
}

interface ReportsProps {
  isDarkMode: boolean;
}

export const Reports: React.FC<ReportsProps> = ({ isDarkMode }) => {
  const [reportTab, setReportTab] = useState<'assets' | 'purchases'>('assets');
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [faultsList, setFaultsList] = useState<FaultRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // الفلاتر
  const [assetTypeFilter, setAssetTypeFilter] = useState<'all' | 'equipment' | 'vehicle'>('all');
  const [specificAssetId, setSpecificAssetId] = useState<string>('all');
  
  const [reportTimeFilter, setReportTimeFilter] = useState<'all' | 'month' | 'range'>('all');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // شاشة تعديل السجل
  const [isEditLogModalOpen, setIsEditLogModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<FaultRecord | null>(null);
  const [editBreakdownDate, setEditBreakdownDate] = useState('');
  const [editRepairDate, setEditRepairDate] = useState('');
  const [editDetails, setEditDetails] = useState('');
  const [updatingLog, setUpdatingLog] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

  const fetchReportsData = async () => {
    setLoading(true);
    const baseUrl = import.meta.env.VITE_API_URL || ""; 
    try {
      const resEquip = await fetch(`${baseUrl}/api/equipment`);
      if (resEquip.ok) {
        const data = await resEquip.json();
        setEquipmentList(data);
      }
      
      const resFaults = await fetch(`${baseUrl}/api/maintenance/reports/all`);
      if (resFaults.ok) {
        const data = await resFaults.json();
        setFaultsList(data);
      }
    } catch (error) {
      console.error('Error fetching data for reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const handleUpdateLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLog) return;

    setUpdatingLog(true);
    setLogError(null);
    const baseUrl = import.meta.env.VITE_API_URL || "";

    try {
      const response = await fetch(`${baseUrl}/api/maintenance/logs/${selectedLog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          breakdownDate: editBreakdownDate,
          repairDate: editRepairDate || null,
          details: editDetails
        })
      });

      if (response.ok) {
        setIsEditLogModalOpen(false);
        fetchReportsData();
      } else {
        const errData = await response.json();
        setLogError(errData.error || 'فشل في تحديث بيانات التقرير.');
      }
    } catch (err) {
      setLogError('حدث خطأ أثناء الاتصال بالنظام.');
    } finally {
      setUpdatingLog(false);
    }
  };

  // تصفية البيانات بناء على الفلاتر
  const filteredFaults = faultsList.filter(record => {
    if (assetTypeFilter !== 'all' && record.equipmentType !== assetTypeFilter) {
      return false;
    }
    if (specificAssetId !== 'all' && record.equipmentId !== parseInt(specificAssetId)) {
      return false;
    }
    if (reportTimeFilter === 'month' && selectedMonth) {
      const recordYearMonth = record.breakdownDate.substring(0, 7);
      if (recordYearMonth !== selectedMonth) return false;
    }
    if (reportTimeFilter === 'range' && startDate && endDate) {
      const recDate = record.breakdownDate.substring(0, 10);
      if (recDate < startDate || recDate > endDate) return false;
    }
    return true;
  });

  const filteredPurchases = filteredFaults.filter(r => r.purchasePrice !== null && (r.purchasePrice ?? 0) > 0);
  const totalFinancialCost = filteredPurchases.reduce((sum, r) => sum + (r.purchasePrice || 0), 0);

  // توليد عنوان التقرير للطباعة
  const generateDynamicTitle = () => {
    let title = "تقرير صيانة ";
    
    if (assetTypeFilter === 'all') title += "المعدات والمركبات الشامل";
    if (assetTypeFilter === 'equipment') title += "المعدات الثقيلة";
    if (assetTypeFilter === 'vehicle') title += "المركبات والسيارات";

    if (specificAssetId !== 'all') {
      const found = equipmentList.find(e => e.id === parseInt(specificAssetId));
      if (found) title += ` للآلية: [ ${found.name} - كود: ${found.code} ]`;
    }

    if (reportTimeFilter === 'month' && selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const monthsArabic = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
      const monthName = monthsArabic[parseInt(month) - 1] || month;
      title += ` - لشهر ${monthName} ${year}`;
    } else if (reportTimeFilter === 'range' && startDate && endDate) {
      const formatD = (dStr: string) => dStr.split('-').reverse().join('/');
      title += ` - للفترة من ( ${formatD(startDate)} ) إلى ( ${formatD(endDate)} )`;
    } else {
      title += " - كلي تراكمي";
    }

    return title;
  };

  const dropdownFilteredEquipment = equipmentList.filter(e => {
    if (assetTypeFilter === 'all') return true;
    return e.type === assetTypeFilter || (assetTypeFilter === 'equipment' && !e.type); 
  });

  return (
    <div className="space-y-6 box-border w-full text-black" dir="rtl">
      
      {/* الهيدر الرسمي للطباعة فقط */}
      <div className="hidden print:flex items-center justify-between border-b-4 border-double border-black pb-4 mb-4 w-full">
        <div className="flex items-center gap-4">
          <img src="/logo.jpg" alt="شعار الشركة" className="w-20 h-20 object-contain border-2 border-solid border-black rounded" onError={(e)=>{(e.target as HTMLElement).style.display='none'}} />
          <div>
            <h1 className="text-xl font-black text-black m-0 tracking-wide">شركة وادي دفا للمقاولات</h1>
            <p className="text-sm font-black text-black m-0 mt-1">نظام إدارة صيانة المعدات والمركبات</p>
          </div>
        </div>
        <div className="text-left">
          <p className="text-xs font-black text-black m-0">تاريخ استخراج التقرير: {new Date().toLocaleDateString('en-GB')}</p>
          <p className="text-xs font-black text-black m-0 mt-1">حالة البيانات: محدثة</p>
        </div>
      </div>

      {/* عنوان التقرير الحالي */}
      <div className="p-4 bg-slate-100 border-2 border-solid border-black rounded-lg text-center shadow-sm">
        <h2 className="text-base md:text-lg font-black text-blue-950 m-0">
          {generateDynamicTitle()}
        </h2>
      </div>

      {/* أزرار التبديل بين التقارير */}
      <div className="flex border-b-4 border-solid border-black gap-4 md:gap-8 font-black text-base no-print">
        <button 
          onClick={() => setReportTab('assets')} 
          className={`pb-3 transition-all border-0 bg-transparent cursor-pointer font-sans text-base md:text-lg font-black ${reportTab === 'assets' ? 'border-b-4 border-solid border-blue-900 text-blue-900' : 'text-black/60 hover:text-black'}`}
        >
          تقرير الأعطال والصيانة
        </button>
        <button 
          onClick={() => setReportTab('purchases')} 
          className={`pb-3 transition-all border-0 bg-transparent cursor-pointer font-sans text-base md:text-lg font-black ${reportTab === 'purchases' ? 'border-b-4 border-solid border-blue-900 text-blue-900' : 'text-black/60 hover:text-black'}`}
        >
          تقرير مشتريات قطع الغيار
        </button>
      </div>

      {/* خيارات البحث والفلترة */}
      <div className="p-5 rounded-xl border-4 border-solid border-black bg-white space-y-4 no-print">
        <h4 className="text-sm font-black text-blue-900 m-0">خيارات فرز وتصفية البيانات:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="space-y-1.5">
            <label className="text-xs text-black font-black block">تصنيف الأصول:</label>
            <select 
              value={assetTypeFilter} 
              onChange={(e) => {
                setAssetTypeFilter(e.target.value as any);
                setSpecificAssetId('all');
              }} 
              className="w-full px-3 py-2.5 rounded border-2 border-solid border-black text-sm font-black bg-white text-black outline-none focus:border-blue-900 cursor-pointer"
            >
              <option value="all">عرض الكل (معدات ومركبات)</option>
              <option value="equipment">المعدات الثقيلة فقط</option>
              <option value="vehicle">المركبات والسيارات فقط</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-black font-black block">اختيار معدة أو مركبة معينة:</label>
            <select 
              value={specificAssetId} 
              onChange={(e) => setSpecificAssetId(e.target.value)} 
              className="w-full px-3 py-2.5 rounded border-2 border-solid border-black text-sm font-black bg-white text-black outline-none focus:border-blue-900 cursor-pointer"
            >
              <option value="all">كل السجلات التابعة للتصنيف المختار</option>
              {dropdownFilteredEquipment.map(e => (
                <option key={e.id} value={e.id}>
                  {e.code} - {e.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-black font-black block">تحديد الفترة الزمنية:</label>
            <select 
              value={reportTimeFilter} 
              onChange={(e) => setReportTimeFilter(e.target.value as any)} 
              className="w-full px-3 py-2.5 rounded border-2 border-solid border-black text-sm font-black bg-white text-black outline-none focus:border-blue-900 cursor-pointer"
            >
              <option value="all">كل التواريخ (تقرير شامل)</option>
              <option value="month">شهر محدد</option>
              <option value="range">من تاريخ إلى تاريخ</option>
            </select>
          </div>

          {reportTimeFilter === 'month' && (
            <div className="space-y-1.5">
              <label className="text-xs text-black font-black block">اختر الشهر:</label>
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-3 py-2 rounded border-2 border-solid border-black text-sm font-black bg-white text-black outline-none focus:border-blue-900" />
            </div>
          )}

          {reportTimeFilter === 'range' && (
            <div className="grid grid-cols-2 gap-2 col-span-1">
              <div className="space-y-1.5">
                <label className="text-xs text-black font-black block">من تاريخ:</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 text-sm font-black rounded border-2 border-solid border-black bg-white text-black outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-black font-black block">إلى تاريخ:</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 text-sm font-black rounded border-2 border-solid border-black bg-white text-black outline-none" />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t-2 border-solid border-black/10">
          <button 
            onClick={() => window.print()} 
            className="bg-black hover:bg-blue-950 text-white font-black px-6 py-2.5 rounded-lg text-sm shadow-md border-2 border-solid border-black cursor-pointer transition-all active:scale-95"
          >
            طباعة التقرير أو التصدير PDF
          </button>
        </div>
      </div>

      {/* عداد السجلات الحالي */}
      <div className="p-3 bg-amber-100 text-black border-2 border-solid border-black rounded-lg text-sm font-black text-center shadow-sm no-print">
        عدد السجلات المطابقة للتصفية الحالية: <span className="text-blue-900 underline font-black text-base">{filteredFaults.length}</span> سجل.
      </div>

      {/* عرض الجداول */}
      {loading ? (
        <p className="text-center text-sm font-black text-blue-900 animate-pulse">جاري تحميل البيانات من النظام...</p>
      ) : reportTab === 'assets' ? (
        <div className="rounded-xl border-4 border-solid border-black overflow-hidden bg-white shadow-md print:border-2">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm table-fixed print:table-auto">
              <thead>
                <tr className="bg-black text-white font-black text-center">
                  <th className="p-3 border-2 border-solid border-black text-xs md:text-sm w-32 print:w-28">نوع الآلية</th>
                  <th className="p-3 border-2 border-solid border-black text-xs md:text-sm w-36 print:w-32">رقم التسلسل / اللوحة</th>
                  <th className="p-3 border-2 border-solid border-black text-xs md:text-sm w-28 print:w-24">كود الآلية</th>
                  <th className="p-3 border-2 border-solid border-black text-xs md:text-sm text-center print:w-auto">تفاصيل العطل</th>
                  <th className="p-3 border-2 border-solid border-black text-xs md:text-sm w-24 print:w-24">تاريخ العطل</th>
                  <th className="p-3 border-2 border-solid border-black text-xs md:text-sm w-24 print:w-24">تاريخ الاصلاح</th>
                  <th className="p-3 border-2 border-solid border-black text-xs md:text-sm w-36 print:w-32">المشروع الحالي</th>
                  <th className="p-3 border-2 border-solid border-black text-xs md:text-sm w-20 no-print">إجراء</th>
                </tr>
              </thead>
              <tbody className="font-black text-black text-center">
                {filteredFaults.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-black font-black text-sm bg-slate-50">لا توجد بيانات مطابقة لخيارات التصفية المحددة.</td>
                  </tr>
                ) : (
                  filteredFaults.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-100 transition-all border-b-2 border-solid border-black/30 page-break-inside-avoid">
                      <td className="p-3 border-2 border-solid border-black text-xs">
                        <span className="font-black block">{record.equipmentType === 'equipment' ? 'معدة ثقيلة' : 'مركبة / سيارة'}</span>
                        <span className="text-blue-900 text-[11px] font-black block mt-0.5">({record.equipmentName})</span>
                      </td>
                      <td className="p-3 font-black font-mono text-black border-2 border-solid border-black text-xs">
                        {record.equipmentType === 'equipment' ? (record.serialNumber || '-') : (record.plateNumber || '-')}
                      </td>
                      <td className="p-3 font-black text-blue-950 uppercase text-xs border-2 border-solid border-black bg-slate-50">{record.equipmentCode}</td>
                      
                      {/* خلية التفاصيل المرنة للطباعة */}
                      <td className="p-3 border-2 border-solid border-black text-right text-xs font-black leading-relaxed break-words whitespace-pre-line overflow-visible">
                        {record.details || 'لم تدون تفاصيل'}
                      </td>
                      
                      <td className="p-3 font-black font-mono text-black border-2 border-solid border-black text-xs">
                        {record.breakdownDate ? new Date(record.breakdownDate).toLocaleDateString('en-GB') : '-'}
                      </td>
                      <td className="p-3 font-black font-mono border-2 border-solid border-black text-xs">
                        {record.repairDate ? (
                          <span className="text-emerald-900 font-black bg-emerald-100 border border-solid border-emerald-900 px-1.5 py-0.5 rounded text-[11px] inline-block print:border-none print:bg-transparent">
                            {new Date(record.repairDate).toLocaleDateString('en-GB')}
                          </span>
                        ) : (
                          <span className="text-red-900 font-black bg-red-100 border border-solid border-red-700 px-1.5 py-0.5 rounded text-[11px] inline-block print:text-black">تحت الصيانة</span>
                        )}
                      </td>
                      <td className="p-3 text-black font-black border-2 border-solid border-black text-right text-xs">
                        {record.projectNameSnapshot}
                      </td>
                      <td className="p-3 border-2 border-solid border-black no-print">
                        <button
                          onClick={() => {
                            setSelectedLog(record);
                            setEditBreakdownDate(record.breakdownDate ? record.breakdownDate.split('T')[0] : '');
                            setEditRepairDate(record.repairDate ? record.repairDate.split('T')[0] : '');
                            setEditDetails(record.details || '');
                            setIsEditLogModalOpen(true);
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-2 py-1 rounded border-2 border-solid border-black cursor-pointer font-black transition-all shadow"
                        >
                          تعديل
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* تقرير المشتريات المالي */
        <div className="space-y-4">
          <div className="p-5 rounded-xl flex justify-between items-center bg-blue-900 text-white border-4 border-solid border-black shadow-lg print:bg-slate-100 print:text-black print:border-2">
            <span className="font-black text-base">إجمالي تكاليف المشتريات والقطع المحددة:</span>
            <span className="text-2xl font-black tracking-wide bg-white text-blue-900 px-4 py-1 rounded border-2 border-solid border-black print:bg-black print:text-white">{totalFinancialCost.toLocaleString()} ريال سعودي</span>
          </div>
          
          <div className="rounded-xl border-4 border-solid border-black overflow-hidden bg-white shadow-md print:border-2">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className="bg-black text-white font-black text-center">
                    <th className="p-4 border-2 border-solid border-black">كود الآلية</th>
                    <th className="p-4 border-2 border-solid border-black">بيان قطعة الغيار أو المشتريات</th>
                    <th className="p-4 border-2 border-solid border-black w-40">التاريخ</th>
                    <th className="p-4 border-2 border-solid border-black w-48">التكلفة المالية</th>
                  </tr>
                </thead>
                <tbody className="font-black text-black text-center">
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-black font-black text-sm bg-slate-50">لا توجد تكاليف مشتريات مسجلة لهذه الفترة.</td>
                    </tr>
                  ) : (
                    filteredPurchases.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-100 transition-all border-b-2 border-solid border-black/30 page-break-inside-avoid">
                        <td className="p-4 font-black text-blue-950 uppercase text-base border-2 border-solid border-black bg-slate-50">{record.equipmentCode}</td>
                        <td className="p-4 text-sm font-black border-2 border-solid border-black text-right">{record.purchaseItem}</td>
                        <td className="p-4 font-black font-mono text-black border-2 border-solid border-black">{record.breakdownDate}</td>
                        <td className="p-4 font-black text-lg text-blue-900 border-2 border-solid border-black bg-blue-50">{(record.purchasePrice || 0).toLocaleString()} ريال</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* شاشة تعديل السجل المنبثقة */}
      {isEditLogModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-md p-6 rounded-xl border-4 border-solid border-black bg-white text-black shadow-lg relative">
            
            <div className="mb-4 pb-2 border-b-4 border-solid border-black flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-blue-900 m-0">تعديل سجل صيانة</h3>
                <p className="text-xs text-black font-black mt-1">كود الآلية: <span className="text-blue-900 underline font-black text-sm uppercase">{selectedLog.equipmentCode}</span></p>
                <p className="text-xs text-black font-black mt-0.5">المشروع: <span className="font-black text-blue-900 bg-blue-50 px-1 rounded">{selectedLog.projectNameSnapshot}</span></p>
              </div>
              <button onClick={() => setIsEditLogModalOpen(false)} className="text-xl font-black bg-transparent border-0 cursor-pointer text-black hover:text-red-700">✕</button>
            </div>
            
            {logError && (
              <div className="p-3 mb-4 text-sm font-black bg-red-100 text-red-900 rounded border-2 border-solid border-red-700">
                {logError}
              </div>
            )}
            
            <form onSubmit={handleUpdateLogSubmit} className="space-y-4 text-sm">
              
              <div className="space-y-1.5">
                <label className="text-xs font-black text-black block">تاريخ العطل:</label>
                <input 
                  type="date" 
                  required 
                  value={editBreakdownDate} 
                  onChange={(e) => setEditBreakdownDate(e.target.value)} 
                  className="w-full px-3 py-2.5 text-sm font-black rounded border-2 border-solid border-black bg-white text-blue-900 outline-none focus:border-blue-900 shadow-sm" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-black block">تاريخ الاصلاح (يترك فارغاً إذا لم يتم الاصلاح بعد):</label>
                <input 
                  type="date" 
                  value={editRepairDate} 
                  onChange={(e) => setEditRepairDate(e.target.value)} 
                  className="w-full px-3 py-2.5 text-sm font-black rounded border-2 border-solid border-black bg-white text-blue-900 outline-none focus:border-blue-900 shadow-sm" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-black block">تفاصيل وبيان العطل:</label>
                <textarea 
                  rows={3} 
                  value={editDetails} 
                  onChange={(e) => setEditDetails(e.target.value)} 
                  placeholder="ادخل تفاصيل العطل بدقة..." 
                  className="w-full px-3 py-2.5 text-sm font-black rounded border-2 border-solid border-black bg-white text-black outline-none resize-none focus:border-blue-900 shadow-sm" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t-4 border-solid border-black">
                <button type="button" onClick={() => setIsEditLogModalOpen(false)} className="text-sm font-black text-black bg-transparent border-0 cursor-pointer hover:underline px-2">إلغاء</button>
                <button 
                  type="submit" 
                  disabled={updatingLog} 
                  className="bg-blue-900 hover:bg-blue-950 text-white font-black text-sm px-6 py-2.5 rounded-lg border-2 border-solid border-black cursor-pointer shadow"
                >
                  {updatingLog ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* أنماط الطباعة المخصصة لضمان النظافة والوضوح التام */}
      <style>{`
        @media print {
          .no-print, button, select, input, textarea, .bg-amber-100 {
            display: none !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          table {
            width: 100% !important;
            table-layout: auto !important;
            border-collapse: collapse !important;
          }
          th {
            background-color: #f3f4f6 !important;
            color: #000000 !important;
            font-weight: 900 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          td, th {
            border: 2px solid #000000 !important;
            padding: 6px !important;
            word-wrap: break-word !important;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

    </div>
  );
};
