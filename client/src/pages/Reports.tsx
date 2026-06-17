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
  isDarkMode: boolean; // متروكة للتوافق البرمجي لكن الواجهة ثابتة على تباين عالي ناصع
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

  return (
    <div className="space-y-8 w-full box-border bg-white text-black" dir="rtl">
      
      {/* ─── تابات التبديل الموحدة: خط ضخم وعريض جداً وسهل التنقل والضغط ─── */}
      <div className="flex border-b-4 border-solid border-black gap-4 justify-center md:justify-start w-full">
        <button 
          onClick={() => setReportTab('assets')} 
          className={`pb-4 px-6 border-0 bg-transparent cursor-pointer text-lg md:text-xl font-black transition-all ${reportTab === 'assets' ? 'border-b-8 border-solid border-black text-black' : 'text-black/40'}`}
        >
          تقرير المعدات والمركبات الفني
        </button>
        <button 
          onClick={() => setReportTab('purchases')} 
          className={`pb-4 px-6 border-0 bg-transparent cursor-pointer text-lg md:text-xl font-black transition-all ${reportTab === 'purchases' ? 'border-b-8 border-solid border-black text-black' : 'text-black/40'}`}
        >
          تقرير المشتريات المالي
        </button>
      </div>

      {/* ─── محرك البحث والفلترة: حقول ضخمة وعريضة جداً بتباين عالٍ ─── */}
      <div className="p-6 bg-white border-4 border-solid border-black space-y-6 no-print">
        <div className="border-b-2 border-solid border-black pb-2">
          <h4 className="text-lg md:text-xl font-black text-black m-0">تصفية وفلترة سجلات التقارير حياً:</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-2">
            <label className="text-base md:text-lg font-black text-black block">اختيار المعدة أو المركبة:</label>
            <select 
              value={reportAssetFilter} 
              onChange={(e) => setReportAssetFilter(e.target.value)} 
              className="w-full px-4 py-3.5 rounded-none border-4 border-solid border-black text-base md:text-lg font-black text-black bg-white outline-none"
            >
              <option value="all">عرض جميع المعدات والمركبات المسجلة بالكامل</option>
              {equipmentList.map(e => <option key={e.id} value={e.name}>{e.name} ({e.code})</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-base md:text-lg font-black text-black block">النطاق الزمني المحدد:</label>
            <select 
              value={reportTimeFilter} 
              onChange={(e) => setReportTimeFilter(e.target.value as any)} 
              className="w-full px-4 py-3.5 rounded-none border-4 border-solid border-black text-base md:text-lg font-black text-black bg-white outline-none"
            >
              <option value="all">تقرير شامل وعام منذ إطلاق النظام</option>
              <option value="month">تقرير شهر محدد فريد</option>
              <option value="range">من تاريخ محدد إلى تاريخ محدد</option>
            </select>
          </div>

          {reportTimeFilter === 'month' && (
            <div className="space-y-2 md:col-span-2">
              <label className="text-base md:text-lg font-black text-black block">حدد الشهر المطلوب:</label>
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
                className="w-full px-4 py-3.5 rounded-none border-4 border-solid border-black text-base md:text-lg font-black text-black bg-white outline-none" 
              />
            </div>
          )}

          {reportTimeFilter === 'range' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">
              <div className="space-y-2">
                <label className="text-base md:text-lg font-black text-black block">من تاريخ:</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className="w-full px-4 py-3.5 rounded-none border-4 border-solid border-black text-base md:text-lg font-black text-black bg-white outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-base md:text-lg font-black text-black block">إلى تاريخ:</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  className="w-full px-4 py-3.5 rounded-none border-4 border-solid border-black text-base md:text-lg font-black text-black bg-white outline-none" 
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t-2 border-solid border-black">
          <button 
            onClick={() => window.print()} 
            className="w-full sm:w-auto bg-black text-white font-black px-8 py-4 rounded-none text-base md:text-lg border-4 border-solid border-black cursor-pointer hover:bg-black/80 transition-colors"
          >
            طباعة واستخراج هذا التقرير كـ PDF مالي وفني
          </button>
        </div>
      </div>

      {/* عداد حصر فوري مبسط وواضح جداً للرؤية */}
      <div className="p-4 border-4 border-solid border-black bg-black text-white text-base md:text-lg font-black text-center">
        إجمالي السجلات الحالية المكتشفة في الفرز: {faultsList.length} سجل معتمد
      </div>

      {/* ─── عرض الجداول والبيانات الفنية والمالية ─── */}
      {loading ? (
        <p className="text-center text-xl font-black text-black py-12 animate-pulse">جاري جلب ومعالجة سجلات قاعدة البيانات الحالية...</p>
      ) : reportTab === 'assets' ? (
        <div className="space-y-4">
          
          {/* جدول شاشات الكمبيوتر: تباين عالي ونصوص واضحة وعريضة */}
          <div className="hidden md:block overflow-x-auto border-4 border-solid border-black bg-white">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b-4 border-solid border-black bg-black text-white text-base font-black">
                  <th className="p-4 border-l-2 border-solid border-white text-center">التصنيف الرسمي</th>
                  <th className="p-4 border-l-2 border-solid border-white text-center">البيان (اللوحة / السيريال)</th>
                  <th className="p-4 border-l-2 border-solid border-white text-center">كود القيد</th>
                  <th className="p-4 border-l-2 border-solid border-white text-center">تفاصيل ومظاهر العطل</th>
                  <th className="p-4 border-l-2 border-solid border-white text-center">تاريخ البلاغ</th>
                  <th className="p-4 border-l-2 border-solid border-white text-center">تاريخ الإصلاح</th>
                  <th className="p-4 border-l-2 border-solid border-white text-center">الموقع الميداني الموثق</th>
                  <th className="p-4 text-center no-print">التصحيح</th>
                </tr>
              </thead>
              <tbody className="text-black font-black text-base divide-y-2 divide-solid divide-black bg-white">
                {filteredFaults.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-black font-black text-lg bg-white">
                      لا توجد بلاغات صيانة أو أعطال مسجلة تطابق خيارات الفلترة المحددة حالياً.
                    </td>
                  </tr>
                ) : (
                  filteredFaults.map((record) => (
                    <tr key={record.id} className="hover:bg-black/5 text-center transition-colors">
                      <td className="p-4 border-l border-solid border-black">
                        {record.equipmentType === 'equipment' ? 'معدة ثقيلة' : 'مركبة'} 
                        <span className="text-black/70 text-sm block font-bold mt-1">({record.equipmentName})</span>
                      </td>
                      <td className="p-4 border-l border-solid border-black text-black font-bold">
                        {record.equipmentType === 'equipment' ? (record.serialNumber || 'بدون رقم تسلسلي') : (record.plateNumber || 'بدون رقم لوحة')}
                      </td>
                      <td className="p-4 border-l border-solid border-black text-lg text-black font-black uppercase tracking-wider">{record.equipmentCode}</td>
                      <td className="p-4 max-w-xs whitespace-pre-line text-sm leading-relaxed text-black border-l border-solid border-black text-right font-bold">
                        {record.details || 'لم تدون تفاصيل فنية'}
                      </td>
                      <td className="p-4 border-l border-solid border-black text-black">
                        {record.breakdownDate ? new Date(record.breakdownDate).toLocaleDateString('en-GB') : '-'}
                      </td>
                      <td className="p-4 border-l border-solid border-black">
                        {record.repairDate ? (
                          <span className="inline-block bg-black text-white px-3 py-1 font-black text-xs border border-solid border-black">
                            تم الإصلاح: {new Date(record.repairDate).toLocaleDateString('en-GB')}
                          </span>
                        ) : (
                          <span className="inline-block bg-white text-black px-3 py-1 font-black text-xs border-2 border-solid border-black">
                            لا تزال معطلة
                          </span>
                        )}
                      </td>
                      <td className="p-4 border-l border-solid border-black text-black font-black">
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
                          className="bg-white text-black hover:bg-black hover:text-white text-base px-4 py-2 border-4 border-solid border-black font-black cursor-pointer transition-colors"
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

          {/* كروت شاشات الجوال: خطوط ضخمة ومقروءة وحواف حادة جداً */}
          <div className="block md:hidden space-y-4">
            {filteredFaults.map((record) => (
              <div key={record.id} className="p-5 border-4 border-solid border-black bg-white flex flex-col gap-3">
                <div className="flex justify-between items-center border-b-2 border-solid border-black pb-2">
                  <span className="text-xl font-black uppercase text-black tracking-wide">{record.equipmentCode}</span>
                  <span className={`px-3 py-1 border-2 border-solid border-black text-xs font-black ${record.repairDate ? 'bg-black text-white' : 'bg-white text-black'}`}>
                    {record.repairDate ? 'جاهزة' : 'معطلة'}
                  </span>
                </div>
                <div className="space-y-1 text-black">
                  <p className="text-base font-black m-0">الاسم الرسمي: {record.equipmentName} ({record.equipmentType === 'equipment' ? 'معدة ثقيلة' : 'مركبة'})</p>
                  <p className="text-sm font-bold m-0">البيان: {record.equipmentType === 'equipment' ? `رقم التسلسل: ${record.serialNumber || 'لا يوجد'}` : `رقم اللوحة: ${record.plateNumber || 'لا يوجد'}`}</p>
                  <p className="text-sm font-black m-0 pt-1 border-t border-dashed border-black/30">تفاصيل العطل: {record.details || 'لم تدون تفاصيل'}</p>
                  <p className="text-sm font-bold m-0">تاريخ البلاغ: {record.breakdownDate ? new Date(record.breakdownDate).toLocaleDateString('en-GB') : '-'}</p>
                  <p className="text-sm font-bold m-0">تاريخ الاصلاح: {record.repairDate ? new Date(record.repairDate).toLocaleDateString('en-GB') : 'خارج الخدمة حتى الان'}</p>
                  <p className="text-sm font-black m-0">الموقع الميداني الموثق: <span className="underline">{record.projectNameSnapshot}</span></p>
                </div>
                <div className="pt-3 border-t-2 border-solid border-black flex justify-end no-print">
                  <button 
                    onClick={() => {
                      setSelectedLog(record);
                      setEditBreakdownDate(record.breakdownDate ? record.breakdownDate.split('T')[0] : '');
                      setEditRepairDate(record.repairDate ? record.repairDate.split('T')[0] : '');
                      setEditDetails(record.details || '');
                      setIsEditLogModalOpen(true);
                    }}
                    className="w-full bg-white text-black text-base py-3 border-4 border-solid border-black font-black cursor-pointer"
                  >
                    تعديل وتصحيح بيانات السجل الفني
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      ) : (
        /* ─── تقرير المشتريات المالي: تباين عالي وحواف حادة دون تدرجات ملونة ─── */
        <div className="space-y-6">
          <div className="p-6 border-4 border-solid border-black bg-black text-white flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="font-black text-lg md:text-xl">إجمالي كلفة فواتير المشتريات للفترة المحددة:</span>
            <span className="text-2xl md:text-4xl font-black tracking-wide underline">{totalFinancialCost.toLocaleString()} ريال سعودي</span>
          </div>
          
          <div className="border-4 border-solid border-black bg-white overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b-4 border-solid border-black bg-black text-white text-base font-black">
                  <th className="p-4 border-l-2 border-solid border-white">كود القيد المستهدف</th>
                  <th className="p-4 border-l-2 border-solid border-white">بيان المشتريات وقيد قطعة الغيار</th>
                  <th className="p-4 border-l-2 border-solid border-white">التاريخ المالي للقيد</th>
                  <th className="p-4 text-left">التكلفة والمدفوع المالي بالريال</th>
                </tr>
              </thead>
              <tbody className="text-black font-black text-base divide-y-2 divide-solid divide-black bg-white">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-black font-black text-lg bg-white">
                      لا توجد فواتير أو قيود مشتريات مالية مربوطة بأعطال في هذه الفترة حالياً.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((record) => (
                    <tr key={record.id} className="hover:bg-black/5 transition-colors">
                      <td className="p-4 font-black text-lg text-black uppercase tracking-wider">{record.equipmentCode}</td>
                      <td className="p-4 text-black font-bold">{record.purchaseItem}</td>
                      <td className="p-4 text-black">{record.breakdownDate}</td>
                      <td className="p-4 font-black text-black text-left">{parseInt(record.purchasePrice?.toString() || '0').toLocaleString()} ريال</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── المودال المنبثق للتعديل والتصحيح: حجم عملاق وحقول ضخمة للعين ─── */}
      {isEditLogModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-2xl p-8 bg-white border-4 border-solid border-black text-black rounded-none shadow-none max-h-[90vh] overflow-y-auto">
            
            <div className="border-b-4 border-solid border-black pb-4 mb-6">
              <h3 className="text-2xl md:text-3xl font-black text-black m-0">مراجعة وتصحيح سجل الصيانة</h3>
              <p className="text-base font-bold text-black mt-2">كود القيد: <span className="underline font-black">{selectedLog.equipmentCode}</span> | الموقع الميداني: {selectedLog.projectNameSnapshot}</p>
            </div>
            
            {logError && (
              <div className="p-4 mb-6 text-base font-black bg-black text-white border-4 border-solid border-black">
                خطأ من السيرفر: {logError}
              </div>
            )}
            
            <form onSubmit={handleUpdateLogSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-base md:text-lg font-black text-black block">تاريخ حدوث ووقوع العطل الفعلي:</label>
                <input 
                  type="date" 
                  required 
                  value={editBreakdownDate} 
                  onChange={(e) => setEditBreakdownDate(e.target.value)} 
                  className="w-full px-4 py-3.5 text-base md:text-lg font-black rounded-none border-4 border-solid border-black outline-none bg-white text-black" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-base md:text-lg font-black text-black block">تاريخ الإصلاح وإعلان الجاهزية (امسحه إذا كانت لا تزال معطلة):</label>
                <input 
                  type="date" 
                  value={editRepairDate} 
                  onChange={(e) => setEditRepairDate(e.target.value)} 
                  className="w-full px-4 py-3.5 text-base md:text-lg font-black rounded-none border-4 border-solid border-black outline-none bg-white text-black" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-base md:text-lg font-black text-black block">تعديل وكتابة البيان والملاحظات الفنية للمشكلة بالكامل:</label>
                <textarea 
                  rows={4} 
                  value={editDetails} 
                  onChange={(e) => setEditDetails(e.target.value)} 
                  placeholder="تعديل تفاصيل العطل الفني..." 
                  className="w-full px-4 py-3.5 text-base md:text-lg font-black rounded-none border-4 border-solid border-black outline-none resize-none bg-white text-black" 
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4 border-t-4 border-solid border-black">
                <button 
                  type="button" 
                  onClick={() => setIsEditLogModalOpen(false)} 
                  className="w-full sm:w-auto text-base md:text-lg font-black text-black bg-white border-4 border-solid border-black px-6 py-3 cursor-pointer hover:bg-black hover:text-white transition-colors"
                >
                  إلغاء الأمر وإغلاق النافذة
                </button>
                <button 
                  type="submit" 
                  disabled={updatingLog} 
                  className="w-full sm:w-auto bg-black text-white font-black text-base md:text-lg px-8 py-3 border-4 border-solid border-black cursor-pointer disabled:opacity-50"
                >
                  {updatingLog ? 'جاري حفظ التعديلات...' : 'اعتماد وحفظ التعديل النهائي'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* كود التنسيق الخاص بالطباعة لإخفاء العناصر غير المطلوبة تلقائياً */}
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
