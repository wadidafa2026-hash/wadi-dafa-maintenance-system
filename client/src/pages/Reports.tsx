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

  // ─── حقول تحكم مودال التعديل والتصحيح (محفوظة بالكامل دون تغيير البنية) ───
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

  // دالة تحديث السجل الفوري وإرساله للباك إند
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
        fetchReportsData(); // إعادة تحديث الجدول بعد الحفظ مباشرة
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

  // 🧮 محرك الفلترة الذكي (متروك كما هو تماماً لضمان سلامة العمليات)
  const filteredFaults = faultsList.filter(record => {
    if (reportAssetFilter !== 'all' && record.equipmentName !== reportAssetFilter) {
      return false;
    }
    return true;
  });

  // قسم المشتريات - متروك كما هو تماماً وحساب التكلفة الإجمالية دقيق
  const filteredPurchases = filteredFaults.filter(r => r.purchasePrice !== null && (r.purchasePrice ?? 0) > 0);
  const totalFinancialCost = filteredPurchases.reduce((sum, r) => sum + (r.purchasePrice || 0), 0);

  return (
    <div className="space-y-6 box-border w-full text-black" dir="rtl">
      
      {/* تابات التبديل: عريضة وواضحة جداً بالأسود الصريح */}
      <div className="flex border-b-4 border-solid border-black gap-4 md:gap-8 font-black text-base no-print">
        <button 
          onClick={() => setReportTab('assets')} 
          className={`pb-3 transition-all border-0 bg-transparent cursor-pointer font-sans text-base md:text-lg font-black ${reportTab === 'assets' ? 'border-b-4 border-solid border-blue-900 text-blue-900' : 'text-black/60 hover:text-black'}`}
        >
          📋 تقرير المعدات والمركبات (الفني)
        </button>
        <button 
          onClick={() => setReportTab('purchases')} 
          className={`pb-3 transition-all border-0 bg-transparent cursor-pointer font-sans text-base md:text-lg font-black ${reportTab === 'purchases' ? 'border-b-4 border-solid border-blue-900 text-blue-900' : 'text-black/60 hover:text-black'}`}
        >
          💰 تقرير المشتريات المالي
        </button>
      </div>

      {/* محرك البحث والفلترة: تباين عالي وإطار أسود عريض لمنع ضياع الخيارات تحت الشمس */}
      <div className="p-5 rounded-xl border-4 border-solid border-black bg-white space-y-4 no-print">
        <h4 className="text-sm font-black text-blue-900 m-0">⚙️ محرك تصفية وفلترة السجلات حياً من قاعدة البيانات:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="space-y-1.5">
            <label className="text-xs text-black font-black block">ابحث باسم آلية معينة أو اعرض الكل:</label>
            <select 
              value={reportAssetFilter} 
              onChange={(e) => setReportAssetFilter(e.target.value)} 
              className="w-full px-3 py-2.5 rounded border-2 border-solid border-black text-sm font-black bg-white text-black outline-none focus:border-blue-900 cursor-pointer"
            >
              <option value="all" className="font-black">📁 عرض جميع الآليات والمركبات المسجلة</option>
              {equipmentList.map(e => <option key={e.id} value={e.name} className="font-black">{e.name} ({e.code})</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-black font-black block">النطاق الزمني للتقرير:</label>
            <select 
              value={reportTimeFilter} 
              onChange={(e) => setReportTimeFilter(e.target.value as any)} 
              className="w-full px-3 py-2.5 rounded border-2 border-solid border-black text-sm font-black bg-white text-black outline-none focus:border-blue-900 cursor-pointer"
            >
              <option value="all" className="font-black">♾️ تقرير شامل (منذ إطلاق النظام)</option>
              <option value="month" className="font-black">📅 شهر محدد فريد</option>
              <option value="range" className="font-black">⏳ من تاريخ ... إلى تاريخ ...</option>
            </select>
          </div>

          {reportTimeFilter === 'month' && (
            <div className="space-y-1.5">
              <label className="text-xs text-black font-black block">حدد الشهر:</label>
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-3 py-2 rounded border-2 border-solid border-black text-sm font-black bg-white text-black outline-none focus:border-blue-900" />
            </div>
          )}

          {reportTimeFilter === 'range' && (
            <div className="grid grid-cols-2 gap-2">
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
            🖨️ طباعة واستخراج هذا التقرير كـ PDF المعاينة
          </button>
        </div>
      </div>

      {/* 🔍 كاشف وعداد البيانات - إطار أسود مع خلفية صفراء عالية التباين للميدان */}
      <div className="p-3 bg-amber-100 text-black border-2 border-solid border-black rounded-lg text-sm font-black text-center shadow-sm">
        📊 عدد السجلات المستلمة من السيرفر حالياً: <span className="text-blue-900 underline font-black text-base">{faultsList.length}</span> سجل صيانة موثق.
      </div>

      {/* عرض البيانات الحية */}
      {loading ? (
        <p className="text-center text-sm font-black text-blue-900 animate-pulse">جاري تحميل بيانات السجلات الفنية والمالية من قاعدة البيانات...</p>
      ) : reportTab === 'assets' ? (
        /* جدول التقرير الفني: خلفية بيضاء ناصعة وحدود سوداء قوية */
        <div className="rounded-xl border-4 border-solid border-black overflow-hidden bg-white shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-black text-white font-black">
                  <th className="p-3.5 border-2 border-solid border-black text-center text-sm">نوع المعدة - المركبة</th>
                  <th className="p-3.5 border-2 border-solid border-black text-center text-sm">رقم التسلسل أو اللوحة</th>
                  <th className="p-3.5 border-2 border-solid border-black text-center text-sm">كود الآلية المعياري</th>
                  <th className="p-3.5 border-2 border-solid border-black text-center text-sm">تفاصيل وبيان العطل الفني</th>
                  <th className="p-3.5 border-2 border-solid border-black text-center text-sm">تاريخ العطل</th>
                  <th className="p-3.5 border-2 border-solid border-black text-center text-sm">تاريخ الإصلاح</th>
                  <th className="p-3.5 border-2 border-solid border-black text-center text-sm">اسم المشروع الموثق</th>
                  <th className="p-3.5 border-2 border-solid border-black text-center text-sm no-print">إجراء</th>
                </tr>
              </thead>
              <tbody className="font-black text-black">
                {filteredFaults.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-black font-black text-sm bg-slate-50">⚠️ لا توجد بلاغات صيانة أو أعطال مسجلة تطابق خيارات الفلترة المحددة حالياً.</td>
                  </tr>
                ) : (
                  filteredFaults.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-100 transition-all text-center border-b-2 border-solid border-black/30">
                      <td className="p-3.5 border-2 border-solid border-black">
                        <span className="font-black block">{record.equipmentType === 'equipment' ? '⚙️ معدة ثقيلة' : '🚚 مركبة / سيارة'}</span>
                        <span className="text-blue-900 text-xs font-black block mt-0.5">({record.equipmentName})</span>
                      </td>
                      <td className="p-3.5 font-black font-mono text-black border-2 border-solid border-black">
                        {record.equipmentType === 'equipment' ? (record.serialNumber || 'بلا رقم تسلسلي') : (record.plateNumber || 'بلا لوحة مرورية')}
                      </td>
                      <td className="p-3.5 font-black text-blue-950 uppercase tracking-wider text-base border-2 border-solid border-black bg-slate-50">{record.equipmentCode}</td>
                      <td className="p-3.5 max-w-xs whitespace-pre-line text-xs font-black leading-relaxed text-black border-2 border-solid border-black text-right">
                        {record.details || 'لم تدون تفاصيل فنية للمشكلة'}
                      </td>
                      <td className="p-3.5 font-black font-mono text-black border-2 border-solid border-black">
                        {record.breakdownDate ? new Date(record.breakdownDate).toLocaleDateString('en-GB') : '-'}
                      </td>
                      <td className="p-3.5 font-black font-mono border-2 border-solid border-black">
                        {record.repairDate ? (
                          <span className="text-emerald-900 font-black bg-emerald-100 border border-solid border-emerald-900 px-2 py-1 rounded text-xs block">
                            ✅ {new Date(record.repairDate).toLocaleDateString('en-GB')}
                          </span>
                        ) : (
                          <span className="text-red-900 font-black bg-red-100 border border-solid border-red-700 px-2 py-1 rounded text-xs block animate-pulse">⚠️ قيد العطل</span>
                        )}
                      </td>
                      <td className="p-3.5 text-black font-black border-2 border-solid border-black">
                        🚧 {record.projectNameSnapshot}
                      </td>
                      <td className="p-3.5 border-2 border-solid border-black no-print">
                        <button
                          onClick={() => {
                            setSelectedLog(record);
                            setEditBreakdownDate(record.breakdownDate ? record.breakdownDate.split('T')[0] : '');
                            setEditRepairDate(record.repairDate ? record.repairDate.split('T')[0] : '');
                            setEditDetails(record.details || '');
                            setIsEditLogModalOpen(true);
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-1.5 rounded border-2 border-solid border-black cursor-pointer font-black transition-all shadow active:scale-95"
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
        </div>
      ) : (
        /* تقرير المشتريات مالي - إطار أسود عريض مع تباين فادح لمنع اللبس المالي */
        <div className="space-y-4">
          <div className="p-5 rounded-xl flex justify-between items-center bg-blue-900 text-white border-4 border-solid border-black shadow-lg">
            <span className="font-black text-base">💰 إجمالي حصر فواتير ومصاريف المشتريات للفترة المحددة بالفلاتر أعلاه:</span>
            <span className="text-2xl font-black tracking-wide bg-white text-blue-900 px-4 py-1 rounded border-2 border-solid border-black">{totalFinancialCost.toLocaleString()} ريال سعودي</span>
          </div>
          
          <div className="rounded-xl border-4 border-solid border-black overflow-hidden bg-white shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className="bg-black text-white font-black">
                    <th className="p-4 border-2 border-solid border-black">كود الآلية المشتري لها</th>
                    <th className="p-4 border-2 border-solid border-black">اسم قطعة الغيار / المشتري المالي</th>
                    <th className="p-4 border-2 border-solid border-black">التاريخ المالي للقيد</th>
                    <th className="p-4 border-2 border-solid border-black">التكلفة والمدفوع الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="font-black text-black">
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-black font-black text-sm bg-slate-50">💸 لا توجد فواتير مشتريات مربوطة بأعطال في هذه الفترة حالياً.</td>
                    </tr>
                  ) : (
                    filteredPurchases.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-100 transition-all border-b-2 border-solid border-black/30">
                        <td className="p-4 font-black text-blue-950 uppercase text-base border-2 border-solid border-black bg-slate-50">{record.equipmentCode}</td>
                        <td className="p-4 text-sm font-black border-2 border-solid border-black">{record.purchaseItem}</td>
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

      {/* ─── ✏️ مودال منبثق لتعديل وتصحيح السجل الفني (عالي التباين 100%) ─── */}
      {isEditLogModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-md p-6 rounded-xl border-4 border-solid border-black bg-white text-black shadow-[0_0_35px_rgba(0,0,0,0.6)] relative">
            
            <div className="mb-4 pb-2 border-b-4 border-solid border-black flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-blue-900 m-0">✏️ مراجعة وتصحيح سجل صيانة</h3>
                <p className="text-xs text-black font-black mt-1">كود الآلية الحالي: <span className="text-blue-900 underline font-black text-sm uppercase">{selectedLog.equipmentCode}</span></p>
                <p className="text-xs text-black font-black mt-0.5">الموقع الموثق وقت العطل: <span className="font-black text-blue-900 bg-blue-50 px-1 rounded">{selectedLog.projectNameSnapshot}</span></p>
              </div>
              <button onClick={() => setIsEditLogModalOpen(false)} className="text-xl font-black bg-transparent border-0 cursor-pointer text-black hover:text-red-700">✕</button>
            </div>
            
            {logError && (
              <div className="p-3 mb-4 text-sm font-black bg-red-100 text-red-900 rounded border-2 border-solid border-red-700">
                ⚠️ {logError}
              </div>
            )}
            
            <form onSubmit={handleUpdateLogSubmit} className="space-y-4 text-sm">
              
              <div className="space-y-1.5">
                <label className="text-xs font-black text-black block">تاريخ وقوع العطل الفعلي:</label>
                <input 
                  type="date" 
                  required 
                  value={editBreakdownDate} 
                  onChange={(e) => setEditBreakdownDate(e.target.value)} 
                  className="w-full px-3 py-2.5 text-sm font-black rounded border-2 border-solid border-black bg-white text-blue-900 outline-none focus:border-blue-900 shadow-sm" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-black block">تاريخ الإصلاح والجاهزية (اتركه فارغاً إذا لم تصلح بعد):</label>
                <input 
                  type="date" 
                  value={editRepairDate} 
                  onChange={(e) => setEditRepairDate(e.target.value)} 
                  className="w-full px-3 py-2.5 text-sm font-black rounded border-2 border-solid border-black bg-white text-blue-900 outline-none focus:border-blue-900 shadow-sm" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-black block">تعديل الملاحظات والبيان الفني للمشكلة:</label>
                <textarea 
                  rows={3} 
                  value={editDetails} 
                  onChange={(e) => setEditDetails(e.target.value)} 
                  placeholder="اكتب تفاصيل العطل المعدلة هنا..." 
                  className="w-full px-3 py-2.5 text-sm font-black rounded border-2 border-solid border-black bg-white text-black outline-none resize-none focus:border-blue-900 shadow-sm" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t-4 border-solid border-black">
                <button type="button" onClick={() => setIsEditLogModalOpen(false)} className="text-sm font-black text-black bg-transparent border-0 cursor-pointer hover:underline px-2">إلغاء الأمر</button>
                <button 
                  type="submit" 
                  disabled={updatingLog} 
                  className="bg-blue-900 hover:bg-blue-950 text-white font-black text-sm px-6 py-2.5 rounded-lg border-2 border-solid border-black cursor-pointer shadow"
                >
                  {updatingLog ? 'جاري الحفظ...' : '💾 اعتماد التعديل السجل'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* كود التنسيق الخاص بالطباعة عالي التباين لإخفاء العناصر غير المطلوبة والتحكم بالألوان */}
      <style>{`
        @media print {
          .no-print, button, select, input, textarea, .bg-amber-100 {
            display: none !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th {
            background-color: #000000 !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          td, th {
            border: 2px solid #000000 !important;
            padding: 8px !important;
          }
        }
      `}</style>

    </div>
  );
};
