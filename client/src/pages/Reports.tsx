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

  const [reportAssetFilter, setReportAssetFilter] = useState('all'); 
  const [reportTimeFilter, setReportTimeFilter] = useState<'all' | 'month' | 'range'>('all');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  const filteredFaults = faultsList.filter(record => {
    if (reportAssetFilter !== 'all' && record.equipmentName !== reportAssetFilter) {
      return false;
    }
    return true;
  });

  const filteredPurchases = filteredFaults.filter(r => r.purchasePrice !== null && (r.purchasePrice ?? 0) > 0);
  const totalFinancialCost = filteredPurchases.reduce((sum, r) => sum + (r.purchasePrice || 0), 0);

  // تنسيقات ذكية بناءً على وضع النظام (داكن أو فاتح) مع الحفاظ على روح الكحلي الملكي
  const cardBg = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-md';
  const textTitle = isDarkMode ? 'text-slate-200' : 'text-slate-800';
  const textMuted = isDarkMode ? 'text-slate-400' : 'text-slate-600';
  const inputBg = isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900';

  return (
    <div className="space-y-6 w-full box-border" dir="rtl">
      
      {/* ─── التابات: كحلي ملكي فخم يحدد التاب النشط بوضوح ─── */}
      <div className={`flex border-b gap-4 justify-center md:justify-start w-full ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        <button 
          onClick={() => setReportTab('assets')} 
          className={`pb-3 px-4 border-0 bg-transparent cursor-pointer text-base md:text-lg font-black transition-all ${
            reportTab === 'assets' 
              ? 'border-b-4 border-solid border-slate-900 dark:border-blue-500 text-slate-900 dark:text-blue-400' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          📋 تقرير المعدات والمركبات الفني
        </button>
        <button 
          onClick={() => setReportTab('purchases')} 
          className={`pb-3 px-4 border-0 bg-transparent cursor-pointer text-base md:text-lg font-black transition-all ${
            reportTab === 'purchases' 
              ? 'border-b-4 border-solid border-slate-900 dark:border-blue-500 text-slate-900 dark:text-blue-400' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          💰 تقرير المشتريات المالي
        </button>
      </div>

      {/* ─── محرك البحث والفلترة: أنيق ومريح ومحدد المعالم ─── */}
      <div className={`p-6 border border-solid rounded-2xl space-y-4 no-print ${cardBg}`}>
        <div className="flex items-center gap-2 pb-2 border-b border-solid border-slate-500/10">
          <h4 className="text-sm md:text-base font-black text-slate-900 dark:text-blue-400 m-0">⚙️ تصفية وفلترة سجلات التقارير الفورية:</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-500 dark:text-slate-400 block">اختيار المعدة أو المركبة:</label>
            <select 
              value={reportAssetFilter} 
              onChange={(e) => setReportAssetFilter(e.target.value)} 
              className={`w-full px-3 py-2.5 rounded-xl border text-sm font-bold outline-none shadow-sm ${inputBg}`}
            >
              <option value="all">📁 عرض جميع المعدات والمركبات المسجلة</option>
              {equipmentList.map(e => <option key={e.id} value={e.name}>{e.name} ({e.code})</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-slate-500 dark:text-slate-400 block">النطاق الزمني المحدد:</label>
            <select 
              value={reportTimeFilter} 
              onChange={(e) => setReportTimeFilter(e.target.value as any)} 
              className={`w-full px-3 py-2.5 rounded-xl border text-sm font-bold outline-none shadow-sm ${inputBg}`}
            >
              <option value="all">♾️ تقرير شامل وعام منذ إطلاق النظام</option>
              <option value="month">📅 تقرير شهر محدد فريد</option>
              <option value="range">⏳ من تاريخ محدد إلى تاريخ محدد</option>
            </select>
          </div>

          {reportTimeFilter === 'month' && (
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 block">حدد الشهر المطلوب:</label>
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
                className={`w-full px-3 py-2.5 rounded-xl border text-sm font-bold outline-none ${inputBg}`} 
              />
            </div>
          )}

          {reportTimeFilter === 'range' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 block">من تاريخ:</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm font-bold outline-none ${inputBg}`} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 block">إلى تاريخ:</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm font-bold outline-none ${inputBg}`} 
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-solid border-slate-500/10">
          <button 
            onClick={() => window.print()} 
            className="w-full sm:w-auto bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-black px-6 py-2.5 rounded-xl text-sm border-0 cursor-pointer shadow transition-all"
          >
            🖨️ طباعة وحفظ التقرير كـ PDF
          </button>
        </div>
      </div>

      {/* شريط الإحصاء الفوري المريح للعين */}
      <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-black text-center border border-solid border-blue-500/20">
        📊 إجمالي السجلات المستلمة من الفرز الحالي: {faultsList.length} سجل معتمد
      </div>

      {/* ─── كشوفات البيانات والجداول ─── */}
      {loading ? (
        <p className={`text-center text-base font-black py-12 animate-pulse ${textMuted}`}>جاري معالجة وفحص سجلات الأسطول حالياً...</p>
      ) : reportTab === 'assets' ? (
        <div className="space-y-4">
          
          {/* جدول شاشات الكمبيوتر: تصميم عصري مريح وبلمسة كحلية فخمة للرأس */}
          <div className={`hidden md:block overflow-x-auto rounded-2xl border border-solid ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className={`${isDarkMode ? 'bg-slate-950 text-slate-300' : 'bg-slate-900 text-white'} font-black`}>
                  <th className="p-4 border-b border-solid border-slate-500/10 text-center rounded-tr-2xl">نوع الصنف</th>
                  <th className="p-4 border-b border-solid border-slate-500/10 text-center">البيان الرسمي</th>
                  <th className="p-4 border-b border-solid border-slate-500/10 text-center">كود القيد</th>
                  <th className="p-4 border-b border-solid border-slate-500/10 text-center">مظاهر العطل الفني</th>
                  <th className="p-4 border-b border-solid border-slate-500/10 text-center">تاريخ البلاغ</th>
                  <th className="p-4 border-b border-solid border-slate-500/10 text-center">حالة الجاهزية</th>
                  <th className="p-4 border-b border-solid border-slate-500/10 text-center">الموقع الميداني</th>
                  <th className="p-4 border-b border-solid border-slate-500/10 text-center rounded-tl-2xl no-print">إجراء</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-solid divide-slate-500/10 font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {filteredFaults.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400 font-bold text-sm">
                      ⚠️ لا توجد بلاغات صيانة أو أعطال مسجلة تطابق خيارات الفلترة المحددة.
                    </td>
                  </tr>
                ) : (
                  filteredFaults.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-500/5 text-center transition-all">
                      <td className="p-4">
                        <span className="font-black">{record.equipmentType === 'equipment' ? '⚙️ معدة ثقيلة' : '🚚 مركبة'}</span>
                        <span className={`text-xs block mt-0.5 ${textMuted}`}>({record.equipmentName})</span>
                      </td>
                      <td className="p-4 font-mono">
                        {record.equipmentType === 'equipment' ? (record.serialNumber || 'بلا سيريال') : (record.plateNumber || 'بلا لوحة')}
                      </td>
                      <td className="p-4 font-black text-blue-500 dark:text-blue-400 uppercase tracking-wider">{record.equipmentCode}</td>
                      <td className="p-4 max-w-xs whitespace-pre-line text-xs leading-relaxed text-right">
                        {record.details || 'لم تدون تفاصيل'}
                      </td>
                      <td className="p-4 font-mono">
                        {record.breakdownDate ? new Date(record.breakdownDate).toLocaleDateString('en-GB') : '-'}
                      </td>
                      <td className="p-4">
                        {record.repairDate ? (
                          <span className="inline-block bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full text-xs font-black">
                            ✓ تم الإصلاح ({new Date(record.repairDate).toLocaleDateString('en-GB')})
                          </span>
                        ) : (
                          <span className="inline-block bg-red-500/10 text-red-500 px-2.5 py-1 rounded-full text-xs font-black">
                            ⚠️ لا تزال معطلة
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-900 dark:text-slate-100 font-black">
                        {record.projectNameSnapshot}
                      </td>
                      <td className="p-4 no-print">
                        <button
                          onClick={() => {
                            setSelectedLog(record);
                            setEditBreakdownDate(record.breakdownDate ? record.breakdownDate.split('T')[0] : '');
                            setEditRepairDate(record.repairDate ? record.repairDate.split('T')[0] : '');
                            setEditDetails(record.details || '');
                            setIsEditLogModalOpen(true);
                          }}
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs px-3 py-1.5 rounded-lg border-0 cursor-pointer font-black transition-all shadow-sm"
                        >
                          ✏️ تعديل
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* كروت شاشات الجوال: تصميم مريح مقسم لكتل جذابة وسهلة التصفح */}
          <div className="block md:hidden space-y-4">
            {filteredFaults.map((record) => (
              <div key={record.id} className={`p-5 border border-solid rounded-2xl flex flex-col gap-3 ${cardBg}`}>
                <div className="flex justify-between items-center border-b border-solid border-slate-500/10 pb-2">
                  <span className="text-lg font-black text-blue-500 dark:text-blue-400 uppercase tracking-wide">{record.equipmentCode}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${record.repairDate ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {record.repairDate ? 'جاهزة' : 'معطلة'}
                  </span>
                </div>
                <div className={`space-y-1 text-sm font-bold ${textTitle}`}>
                  <p className="m-0 font-black">الاسم: {record.equipmentName} ({record.equipmentType === 'equipment' ? 'معدة ثقيلة' : 'مركبة'})</p>
                  <p className="m-0 text-xs">البيان: {record.equipmentType === 'equipment' ? `رقم التسلسل: ${record.serialNumber || 'لا يوجد'}` : `رقم اللوحة: ${record.plateNumber || 'لا يوجد'}`}</p>
                  <p className="m-0 text-xs pt-2 border-t border-dashed border-slate-500/10">التفاصيل: {record.details || 'لم تدون تفاصيل'}</p>
                  <p className="m-0 text-xs mt-1">تاريخ البلاغ: {record.breakdownDate ? new Date(record.breakdownDate).toLocaleDateString('en-GB') : '-'}</p>
                  <p className="m-0 text-xs">تاريخ الاصلاح: {record.repairDate ? new Date(record.repairDate).toLocaleDateString('en-GB') : 'قيد الصيانة الميدانية'}</p>
                  <p className="m-0 text-xs font-black mt-1">الموقع: <span className="underline text-slate-900 dark:text-slate-200">{record.projectNameSnapshot}</span></p>
                </div>
                <div className="pt-3 border-t border-solid border-slate-500/10 flex justify-end no-print">
                  <button 
                    onClick={() => {
                      setSelectedLog(record);
                      setEditBreakdownDate(record.breakdownDate ? record.breakdownDate.split('T')[0] : '');
                      setEditRepairDate(record.repairDate ? record.repairDate.split('T')[0] : '');
                      setEditDetails(record.details || '');
                      setIsEditLogModalOpen(true);
                    }}
                    className="w-full bg-slate-900 dark:bg-blue-600 text-white text-sm py-2.5 rounded-xl border-0 font-black cursor-pointer shadow"
                  >
                    ✏️ مراجعة وتصحيح بيانات السجل
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      ) : (
        /* ─── تقرير المشتريات المالي: لمسات كحلية أنيقة وبطاقة رقمية متميزة ─── */
        <div className="space-y-4">
          <div className="p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center bg-slate-900 text-white dark:bg-blue-950 dark:border dark:border-solid dark:border-blue-900 gap-4 shadow-lg">
            <span className="font-black text-sm md:text-base">💰 إجمالي حصر فواتير ومصاريف المشتريات للفترة المحددة:</span>
            <span className="text-xl md:text-2xl font-black text-emerald-400 tracking-wide underline decoration-double">{totalFinancialCost.toLocaleString()} ريال سعودي</span>
          </div>
          
          <div className={`rounded-2xl border border-solid overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className={`${isDarkMode ? 'bg-slate-950 text-slate-300' : 'bg-slate-900 text-white'} font-black`}>
                    <th className="p-4">كود القيد</th>
                    <th className="p-4">قطعة الغيار / البيان المالي</th>
                    <th className="p-4">التاريخ المالي للقيد</th>
                    <th className="p-4 text-left">التكلفة والمدفوع الإجمالي</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-solid divide-slate-500/10 font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 text-xs">💸 لا توجد فواتير مشتريات مربوطة بأعطال في هذه الفترة حالياً.</td>
                    </tr>
                  ) : (
                    filteredPurchases.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-500/5 transition-all">
                        <td className="p-4 font-black text-blue-500 dark:text-blue-400 uppercase">{record.equipmentCode}</td>
                        <td className="p-4 text-xs md:text-sm">{record.purchaseItem}</td>
                        <td className="p-4 font-mono text-slate-500 dark:text-slate-400">{record.breakdownDate}</td>
                        <td className="p-4 font-black text-emerald-600 dark:text-emerald-400 text-left">{parseInt(record.purchasePrice?.toString() || '0').toLocaleString()} ريال</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── المودال المنبثق للتعديل والتصحيح: عصري وأنيق وحقوله واضحة وكبيرة ─── */}
      {isEditLogModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
          <div className={`w-full max-w-lg p-6 rounded-2xl border shadow-2xl relative ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
            
            <div className="mb-4 pb-3 border-b border-solid border-slate-500/10">
              <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-blue-400 m-0">✏️ مراجعة وتصحيح سجل صيانة</h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">المعدة: <span className="font-black text-blue-500">{selectedLog.equipmentCode}</span> | الموقع الموثق: {selectedLog.projectNameSnapshot}</p>
            </div>
            
            {logError && (
              <div className="p-3 mb-4 text-xs font-bold bg-red-500/10 text-red-500 rounded-xl border border-solid border-red-500/20">
                ⚠️ خطأ: {logError}
              </div>
            )}
            
            <form onSubmit={handleUpdateLogSubmit} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400">تاريخ وقوع العطل الفعلي:</label>
                <input 
                  type="date" 
                  required 
                  value={editBreakdownDate} 
                  onChange={(e) => setEditBreakdownDate(e.target.value)} 
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-bold outline-none ${inputBg}`} 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400">تاريخ الإصلاح والجاهزية (اتركه فارغاً إذا لم تُصلح بعد):</label>
                <input 
                  type="date" 
                  value={editRepairDate} 
                  onChange={(e) => setEditRepairDate(e.target.value)} 
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-bold outline-none ${inputBg}`} 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400">تعديل البيان الفني وملاحظات المشكلة:</label>
                <textarea 
                  rows={3} 
                  value={editDetails} 
                  onChange={(e) => setEditDetails(e.target.value)} 
                  placeholder="اكتب تفاصيل العطل هنا..." 
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-bold outline-none resize-none ${inputBg}`} 
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-solid border-slate-500/10">
                <button 
                  type="button" 
                  onClick={() => setIsEditLogModalOpen(false)} 
                  className="text-xs font-black text-slate-400 bg-transparent border-0 cursor-pointer hover:text-slate-600"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  disabled={updatingLog} 
                  className="bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-black text-xs px-5 py-2 rounded-xl border-0 cursor-pointer shadow transition-all"
                >
                  {updatingLog ? 'جاري الحفظ...' : '💾 حفظ التعديلات'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* كود التنسيق الخاص بالطباعة */}
      <style>{`
        @media print {
          .no-print, button, select, input {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

    </div>
  );
};
