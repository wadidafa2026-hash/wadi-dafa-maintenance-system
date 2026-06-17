// client/src/pages/Reports.tsx
import React, { useState, useEffect } from 'react';

interface MaintenanceReportRecord {
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
}

interface ReportsProps {
  userRole: 'super_admin' | 'sub_admin' | 'viewer';
  isDarkMode: boolean;
}

export const Reports: React.FC<ReportsProps> = ({ userRole, isDarkMode }) => {
  const [reportsData, setReportsData] = useState<MaintenanceReportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ─── حالات مودال التعديل وتصحيح السجلات ───────────────────────────
  const [isEditLogModalOpen, setIsEditLogModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MaintenanceReportRecord | null>(null);
  const [editBreakdownDate, setEditBreakdownDate] = useState('');
  const [editRepairDate, setEditRepairDate] = useState('');
  const [editDetails, setEditDetails] = useState('');
  const [updatingLog, setUpdatingLog] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

  const isAuthorized = userRole === 'super_admin' || userRole === 'sub_admin';

  // جلب تقارير الصيانة الشاملة من السيرفر
  const fetchComprehensiveReports = async () => {
    setLoading(true);
    const baseUrl = import.meta.env.VITE_API_URL || "";
    try {
      const res = await fetch(`${baseUrl}/api/maintenance/reports/all`);
      if (res.ok) {
        const data = await res.json();
        setReportsData(data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComprehensiveReports();
  }, []);

  // دالة إرسال التعديلات الجديدة للسيرفر وحفظ السجل
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
        fetchComprehensiveReports(); // تحديث الجدول تلقائياً بدون تحديث الصفحة
      } else {
        const errData = await response.json();
        setLogError(errData.error || 'فشل في تحديث بيانات التقرير المختار.');
      }
    } catch (err) {
      setLogError('حدث خطأ أثناء الاتصال بالنظام.');
    } finally {
      setUpdatingLog(false);
    }
  };

  // فرز الفلترة والبحث حسب كود المعدة
  const filteredRecords = reportsData.filter(record =>
    record.equipmentCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // دالة طباعة التقارير الرسمية
  const handlePrint = () => {
    window.print();
  };

  // دوال لتنسيق شكل التواريخ المعروضة
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '---';
    return dateString.split('T')[0];
  };

  return (
    <div className="space-y-6 w-full box-border" dir="rtl">
      
      {/* هيدر الصفحة وأزرار التحكم */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 border-slate-500/10">
        <div>
          <h2 className="text-xl font-black text-blue-800 dark:text-blue-400 m-0">📊 التقارير الإدارية وسجلات حركة الأعطال والصيانة</h2>
          <p className="text-xs text-slate-400 m-0 mt-1">تصدير، مراجعة، وتصحيح بيانات جاهزية أسطول الآليات والمركبات بوادي دفا قبل الطباعة.</p>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-slate-800 hover:bg-slate-900 text-white font-black text-sm px-5 py-2.5 rounded-xl border-0 cursor-pointer shadow flex items-center gap-2"
        >
          🖨️ طباعة وتصدير التقرير الحالي
        </button>
      </div>

      {/* حقل البحث والتصفية الفورية */}
      <div className="bg-blue-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-blue-100 dark:border-slate-800">
        <input 
          type="text" 
          placeholder="🔍 اكتب كود الآلية لفلترة السجلات المحددة فوراً..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className={`w-full md:max-w-xl px-4 py-2.5 rounded-xl border-2 text-sm font-bold outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300'}`} 
        />
      </div>

      {/* جدول البيانات الرئيسى للتقارير */}
      {loading ? (
        <p className="text-center text-sm font-bold text-slate-500 animate-pulse py-6">جاري توليد التقارير الموحدة...</p>
      ) : (
        <div className={`overflow-x-auto rounded-xl border-2 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white shadow-sm'}`}>
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className={`border-b ${isDarkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'} text-xs font-black`}>
                <th className="p-3">كود الآلية</th>
                <th className="p-3">الاسم الفني</th>
                <th className="p-3">الموقع وقت العطل</th>
                <th className="p-3">تاريخ وقوع العطل</th>
                <th className="p-3">تاريخ الإصلاح</th>
                <th className="p-3">البيان وتفاصيل المشكلة</th>
                <th className="p-3 text-center">حالة البلاغ</th>
                {isAuthorized && <th className="p-3 text-center no-print">إجراءات التصحيح</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr 
                  key={record.id} 
                  className={`border-b transition-all font-bold ${isDarkMode ? 'border-slate-800 text-slate-200 hover:bg-slate-800/40' : 'border-slate-200 text-slate-900 hover:bg-slate-50'}`}
                >
                  <td className="p-3 uppercase text-blue-700 dark:text-blue-400 font-black">{record.equipmentCode}</td>
                  <td className="p-3 text-xs md:text-sm">{record.equipmentName}</td>
                  <td className="p-3 text-xs text-amber-600 dark:text-amber-400">{record.projectNameSnapshot}</td>
                  <td className="p-3 text-xs font-sans text-red-600">{formatDate(record.breakdownDate)}</td>
                  <td className="p-3 text-xs font-sans text-emerald-600">{record.repairDate ? formatDate(record.repairDate) : '---'}</td>
                  <td className="p-3 text-xs opacity-90 max-w-xs truncate" title={record.details || ''}>{record.details || 'بدون تفاصيل'}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black text-white ${record.repairDate ? 'bg-emerald-600' : 'bg-red-600'}`}>
                      {record.repairDate ? 'مغلق ومصلح' : 'مفتوح (معطلة)'}
                    </span>
                  </td>
                  {isAuthorized && (
                    <td className="p-3 text-center no-print">
                      <button
                        onClick={() => {
                          setSelectedLog(record);
                          setEditBreakdownDate(record.breakdownDate ? record.breakdownDate.split('T')[0] : '');
                          setEditRepairDate(record.repairDate ? record.repairDate.split('T')[0] : '');
                          setEditDetails(record.details || '');
                          setIsEditLogModalOpen(true);
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-1.5 rounded-lg border-0 cursor-pointer font-black shadow-sm"
                      >
                        ✏️ تصحيح السجل
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500 font-bold">لا توجد سجلات حركة صيانة مطابقة للبحث.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── ✏️ مودال تصحيح وتعديل بيانات السجل الخاطئ ─────────────────── */}
      {isEditLogModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" dir="rtl">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl relative ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'}`}>
            
            <div className="mb-4 pb-2 border-b border-slate-500/10">
              <h3 className="text-base font-black text-amber-500 m-0">✏️ مراجعة وتصحيح سجل صيانة ({selectedLog.equipmentCode})</h3>
              <p className="text-[11px] text-slate-400 mt-1">الموقع الموثق وقت العطل تاريخياً: <span className="font-bold text-blue-500">{selectedLog.projectNameSnapshot}</span></p>
            </div>
            
            {logError && (
              <div className="p-3 mb-4 text-xs font-bold bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
                ⚠️ {logError}
              </div>
            )}
            
            <form onSubmit={handleUpdateLogSubmit} className="space-y-4 text-sm">
              
              {/* تعديل تاريخ وقوع العطل */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">تاريخ وقوع العطل الفعلي:</label>
                <input 
                  type="date" 
                  required 
                  value={editBreakdownDate} 
                  onChange={(e) => setEditBreakdownDate(e.target.value)} 
                  className={`w-full px-3 py-2 text-sm rounded-xl border outline-none font-bold ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} 
                />
              </div>

              {/* تعديل تاريخ الإصلاح */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">تاريخ الإصلاح والجاهزية (امسحه ليظل العطل مفتوحاً):</label>
                <input 
                  type="date" 
                  value={editRepairDate} 
                  onChange={(e) => setEditRepairDate(e.target.value)} 
                  className={`w-full px-3 py-2 text-sm rounded-xl border outline-none font-bold ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} 
                />
              </div>

              {/* تعديل وصف وتفاصيل المشكلة */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">تعديل الملاحظات والبيان الفني للمشكلة:</label>
                <textarea 
                  rows={3} 
                  value={editDetails} 
                  onChange={(e) => setEditDetails(e.target.value)} 
                  placeholder="اكتب تفاصيل العطل المعدلة هنا..." 
                  className={`w-full px-3 py-2 text-sm rounded-xl border outline-none resize-none font-bold ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} 
                />
              </div>

              {/* أزرار الحفظ والإغلاق */}
              <div className="flex justify-end gap-2 pt-3 border-t border-solid border-slate-500/10">
                <button type="button" onClick={() => setIsEditLogModalOpen(false)} className="text-xs font-bold text-slate-400 bg-transparent border-0 cursor-pointer">إلغاء الأمر</button>
                <button 
                  type="submit" 
                  disabled={updatingLog} 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-5 py-2 rounded-xl border-0 cursor-pointer shadow-md"
                >
                  {updatingLog ? 'جاري حفظ التعديل...' : '💾 اعتماد وتصحيح التقرير'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* كود تنسيق إضافي لعملية الطباعة لمنع طباعة أزرار التعديل والبحث */}
      <style>{`
        @media print {
          .no-print, button, input, .bg-blue-50 {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          table {
            border: 1px solid #000 !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #000 !important;
            padding: 8px !important;
          }
        }
      `}</style>

    </div>
  );
};
