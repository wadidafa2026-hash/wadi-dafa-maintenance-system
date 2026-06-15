// client/src/pages/Reports.tsx
import React, { useState, useEffect } from 'react';

interface Equipment {
  id: number;
  code: string;
  name: string;
}

interface FaultRecord {
  id: number;
  equipmentId: number;
  equipmentCode: string;
  equipmentName: string;
  equipmentType: 'equipment' | 'vehicle';
  serialNumber: string | null;
  plateNumber: string | null;
  breakdownDate: string; // تم التحديث ليطابق حقل الباك إند الفعلي
  repairDate: string | null;
  details: string | null;
  projectNameSnapshot: string; // تم التحديث ليطابق حقل الباك إند الفعلي
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

  const [reportAssetFilter, setReportAssetFilter] = useState('all'); 
  const [reportTimeFilter, setReportTimeFilter] = useState<'all' | 'month' | 'range'>('all');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReportsData = async () => {
    setLoading(true);
    const baseUrl = import.meta.env.VITE_API_URL || ""; 
    try {
      const resEquip = await fetch(`${baseUrl}/api/equipment`);
      if (resEquip.ok) {
        const data = await resEquip.json();
        setEquipmentList(data);
      }
      
      // ضرب الراوت الجديد الموحد في الباك إند
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

  // 🧮 محرك الفلترة الذكي (تم فك قيد التواريخ مؤقتاً للتأكد من وصول البيانات)
  const filteredFaults = faultsList.filter(record => {
    // 1. الفلترة باسم الآلية فقط
    if (reportAssetFilter !== 'all' && record.equipmentName !== reportAssetFilter) {
      return false;
    }
    return true;
  });

  // قسم المشتريات - متروك كما هو تماماً
  const filteredPurchases = filteredFaults.filter(r => r.purchasePrice !== null && (r.purchasePrice ?? 0) > 0);
  const totalFinancialCost = filteredPurchases.reduce((sum, r) => sum + (r.purchasePrice || 0), 0);

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* تابات التبديل */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8 font-black text-md">
        <button onClick={() => setReportTab('assets')} className={`pb-3 transition-all border-0 bg-transparent cursor-pointer font-sans text-md ${reportTab === 'assets' ? 'border-b-4 border-solid border-amber-500 text-amber-500 font-black' : 'text-slate-400 font-bold'}`}>📋 تقرير المعدات والمركبات (الفني)</button>
        <button onClick={() => setReportTab('purchases')} className={`pb-3 transition-all border-0 bg-transparent cursor-pointer font-sans text-md ${reportTab === 'purchases' ? 'border-b-4 border-solid border-amber-500 text-amber-500 font-black' : 'text-slate-400 font-bold'}`}>💰 تقرير المشتريات المالي</button>
      </div>

      {/* محرك البحث والفلترة */}
      <div className={`p-5 rounded-2xl border border-solid space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-sm'}`}>
        <h4 className="text-xs font-black text-amber-500 m-0">⚙️ محرك تصفية وفلترة السجلات حياً من قاعدة البيانات:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 block font-bold">ابحث باسم آلية معينة أو اعرض الكل:</label>
            <select value={reportAssetFilter} onChange={(e) => setReportAssetFilter(e.target.value)} className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
              <option value="all">📁 عرض جميع الآليات والمركبات المسجلة</option>
              {equipmentList.map(e => <option key={e.id} value={e.name}>{e.name} ({e.code})</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 block font-bold">النطاق الزمني للتقرير:</label>
            <select value={reportTimeFilter} onChange={(e) => setReportTimeFilter(e.target.value as any)} className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
              <option value="all">♾️ تقرير شامل (منذ إطلاق النظام)</option>
              <option value="month">📅 شهر محدد فريد</option>
              <option value="range">⏳ من تاريخ ... إلى تاريخ ...</option>
            </select>
          </div>

          {reportTimeFilter === 'month' && (
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 block font-bold">حدد الشهر:</label>
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
            </div>
          )}

          {reportTimeFilter === 'range' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 block font-bold">من تاريخ:</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`w-full px-3 py-1.5 text-xs rounded-xl border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 block font-bold">إلى تاريخ:</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={`w-full px-3 py-1.5 text-xs rounded-xl border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs shadow border-0 cursor-pointer transition-all">
            🖨️ طباعة واستخراج هذا التقرير كـ PDF
          </button>
        </div>
      </div>

      {/* 🔍 كاشف وعداد البيانات من الجوال */}
      <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl text-xs font-bold text-center">
        📊 عدد السجلات المستلمة من السيرفر حالياً: {faultsList.length} سجل
      </div>

      {/* عرض البيانات */}
      {loading ? (
        <p className="text-center text-xs text-slate-400 animate-pulse">جاري تحميل بيانات السجلات الفنية والمالية...</p>
      ) : reportTab === 'assets' ? (
        <div className={`rounded-2xl border border-solid overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs md:text-sm">
              <thead>
                <tr className={`${isDarkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-100 text-slate-600'} font-black border-b border-solid border-slate-500/10`}>
                  <th className="p-4 border border-solid border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-950 text-center">نوع المعدة - المركبة</th>
                  <th className="p-4 border border-solid border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-950 text-center">رقم التسلسل او اللوحة</th>
                  <th className="p-4 border border-solid border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-950 text-center">كود وادي دفا</th>
                  <th className="p-4 border border-solid border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-950 text-center">تفاصيل العطل</th>
                  <th className="p-4 border border-solid border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-950 text-center">تاريخ العطل</th>
                  <th className="p-4 border border-solid border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-950 text-center">تاريخ الاصلاح</th>
                  <th className="p-4 border border-solid border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-950 text-center">اسم المشروع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-solid divide-slate-500/10 font-medium">
                {filteredFaults.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">⚠️ لا توجد بلاغات صيانة أو أعطال مسجلة تطابق خيارات الفلترة المحددة حالياً.</td>
                  </tr>
                ) : (
                  filteredFaults.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-500/5 transition-all text-center">
                      <td className="p-4 border border-solid border-slate-200 dark:border-slate-800">
                        {record.equipmentType === 'equipment' ? '⚙️ معدة ثقيلة' : '🚚 مركبة / سيارة'} 
                        <span className="text-slate-400 text-xs block mt-0.5">({record.equipmentName})</span>
                      </td>
                      <td className="p-4 font-mono text-slate-500 dark:text-slate-300 border border-solid border-slate-200 dark:border-slate-800">
                        {record.equipmentType === 'equipment' ? (record.serialNumber || 'بلا سيريال') : (record.plateNumber || 'بلا لوحة')}
                      </td>
                      <td className="p-4 font-black text-blue-500 uppercase tracking-wider border border-solid border-slate-200 dark:border-slate-800">{record.equipmentCode}</td>
                      <td className="p-4 max-w-xs whitespace-pre-line text-xs leading-relaxed text-slate-600 dark:text-slate-300 border border-solid border-slate-200 dark:border-slate-800 text-right">
                        {record.details || 'لم تدون تفاصيل'}
                      </td>
                      <td className="p-4 font-mono text-slate-500 border border-solid border-slate-200 dark:border-slate-800">
                        {record.breakdownDate ? new Date(record.breakdownDate).toLocaleDateString('en-GB') : '-'}
                      </td>
                      <td className="p-4 font-mono border border-solid border-slate-200 dark:border-slate-800">
                        {record.repairDate ? (
                          <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full text-[11px]">
                            {new Date(record.repairDate).toLocaleDateString('en-GB')}
                          </span>
                        ) : (
                          <span className="text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded-full text-[11px]">⚠️ متعطلة</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-200 font-bold border border-solid border-slate-200 dark:border-slate-800">
                        {record.projectNameSnapshot}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* تقرير المشتريات مالي - متروك كما هو تماماً */
        <div className="space-y-4">
          <div className="p-4 rounded-xl flex justify-between items-center bg-gradient-to-l from-amber-500 to-orange-600 text-white shadow-md">
            <span className="font-bold text-sm">💰 إجمالي حصر فواتير ومصاريف المشتريات للفترة المحددة بالفلاتر أعلاه:</span>
            <span className="text-xl font-black tracking-wide">{totalFinancialCost.toLocaleString()} ريال سعودي</span>
          </div>
          
          <div className={`rounded-2xl border border-solid overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className={`${isDarkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-100 text-slate-600'} font-black border-b border-solid border-slate-500/10`}>
                    <th className="p-4">كود الآلية المشتري لها</th>
                    <th className="p-4">اسم قطعة الغيار / المشتري المالي</th>
                    <th className="p-4">التاريخ المالي للقيد</th>
                    <th className="p-4">التكلفة والمدفوع الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-solid divide-slate-500/10 font-medium">
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 text-xs">💸 لا توجد فواتير مشتريات مربوطة بأعطال في هذه الفترة حالياً.</td>
                    </tr>
                  ) : (
                    filteredPurchases.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-500/5 transition-all">
                        <td className="p-4 font-black text-blue-500 uppercase">{record.equipmentCode}</td>
                        <td className="p-4 text-xs">{record.purchaseItem}</td>
                        <td className="p-4 font-mono text-slate-400">{record.breakdownDate}</td>
                        <td className="p-4 font-bold text-amber-500">{(record.purchasePrice || 0).toLocaleString()} ريال</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
