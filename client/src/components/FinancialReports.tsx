// client/src/pages/FinancialReports.tsx
import React, { useState, useEffect } from 'react';

interface PurchaseItem {
  id: number;
  name: string;
  price: number;
}

interface FinancialReportRow {
  logId: number;
  projectName: string;
  breakdownDate: string;
  repairDate: string | null;
  equipmentName: string;
  equipmentCode: string;
  equipmentType: 'equipment' | 'vehicle';
  serialNumber: string | null;
  plateNumber: string | null;
  items: PurchaseItem[];
  totalCost: number;
}

export const FinancialReports: React.FC = () => {
  const [reports, setReports] = useState<FinancialReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // جلب البيانات المالية المجمعة من السيرفر
  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/purchases');
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error('Error fetching financial reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  // الفلترة الديناميكية بناءً على بحث المستخدم (الكود، الاسم، أو المشروع)
  const filteredReports = reports.filter((row) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      row.equipmentCode.toLowerCase().includes(searchLower) ||
      row.equipmentName.toLowerCase().includes(searchLower) ||
      row.projectName.toLowerCase().includes(searchLower)
    );
  });

  // حساب إجمالي المبالغ المصروفة حياً بناءً على الجدول المعروض أمام المستخدم حالياً
  const grandTotal = filteredReports.reduce((sum, row) => sum + row.totalCost, 0);

  // دالة تشغيل أمر الطباعة النظيف
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* الهيدر العلوي - يتم إخفاؤه تلقائياً أثناء الطباعة */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">التقارير المالية ومشتريات الأسطول</h1>
            <p className="text-sm text-slate-500 mt-1">رصد مالي تفصيلي لقطع الغيار والصيانة لشركة وادي دفا</p>
          </div>
          
          <button
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-900 text-white font-medium px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 self-start md:self-auto text-sm"
          >
            🖨️ طباعة التقرير الحالي / تصدير PDF
          </button>
        </div>

        {/* شريط البحث السريع وحساب الإجمالي الحي - مخفي في الطباعة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center print:hidden">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="ابحث بكود الآلية، اسم المعدة، أو لقطة الموقع التاريخية..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* صندوق التكلفة الكلية الحي التيكيك */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-4 rounded-xl shadow-md flex justify-between items-center">
            <div>
              <p className="text-xs text-amber-100 font-medium">إجمالي مصاريف الصيانة والقطع</p>
              <h3 className="text-xl font-bold mt-0.5">{grandTotal.toLocaleString('en-US')} ريال</h3>
            </div>
            <span className="text-2xl opacity-30">💰</span>
          </div>
        </div>

        {/* الهيدر الرسمي المخصص للطباعة فقط (يظهر على ورق الـ PDF المخزن) */}
        <div className="hidden print:block text-center space-y-2 border-b-2 border-slate-800 pb-4">
          <h2 className="text-2xl font-bold text-slate-900">تقرير المشتريات والمنصرف المالي للصيانة</h2>
          <p className="text-sm text-slate-600">شركة وادي دفا للتجارة والمقاولات</p>
          <div className="flex justify-between text-xs text-slate-500 pt-2 font-mono">
            <span>تاريخ توليد التقرير: {new Date().toLocaleDateString('ar-SA')}</span>
            <span>إجمالي المنصرف للفترة: {grandTotal.toLocaleString('en-US')} ريال سعودي</span>
          </div>
        </div>

        {/* جدول البيانات العريض الممتع */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:border-none print:shadow-none">
          {loading ? (
            <div className="p-12 text-center text-slate-500">جاري توليد التقرير المالي من الداتابيز...</div>
          ) : filteredReports.length === 0 ? (
            <div className="p-12 text-center text-slate-400">لا توجد سجلات مالية مطابقة للبحث الحالي.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white text-xs md:text-sm border-b border-slate-200 print:bg-slate-100 print:text-black">
                    <th className="p-4 font-semibold">بيانات الآلية / المركبة</th>
                    <th className="p-4 font-semibold">الموقع التاريخي للعطل</th>
                    <th className="p-4 font-semibold">فترة التوقف (الورشة)</th>
                    <th className="p-4 font-semibold">بيان المشتريات وقطع الغيار التفصيلي</th>
                    <th className="p-4 font-semibold text-left">التكلفة الإجمالية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs md:text-sm text-slate-700">
                  {filteredReports.map((row) => (
                    <tr key={row.logId} className="hover:bg-slate-50/50 transition-colors page-break-inside-avoid">
                      
                      {/* بيانات المعدة */}
                      <td className="p-4 space-y-1">
                        <div className="font-bold text-blue-700 uppercase tracking-wider print:text-black">{row.equipmentCode}</div>
                        <div className="font-medium text-slate-900">{row.equipmentName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {row.equipmentType === 'equipment' ? `SN: ${row.serialNumber}` : `لوحة: ${row.plateNumber}`}
                        </div>
                      </td>

                      {/* لقطة الموقع التاريخية */}
                      <td className="p-4 font-medium text-slate-800">
                        📍 {row.projectName}
                      </td>

                      {/* فترات التواريخ */}
                      <td className="p-4 text-[11px] text-slate-500 space-y-1 font-mono">
                        <p>🚨 {new Date(row.breakdownDate).toLocaleDateString('ar-SA')}</p>
                        <p>✅ {row.repairDate ? new Date(row.repairDate).toLocaleDateString('ar-SA') : <span className="text-red-500 font-sans font-bold">تحت الإصلاح 🛠️</span>}</p>
                      </td>

                      {/* المشتريات والقطع التفصيلية الداخلية (Nested Block) */}
                      <td className="p-4">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 max-w-md print:bg-transparent print:border-none print:p-0">
                          {row.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-xs border-b border-dashed border-slate-200 pb-1 last:border-none last:pb-0">
                              <span className="text-slate-700 font-medium">• {item.name}</span>
                              <span className="font-mono font-semibold text-slate-900 bg-white px-1.5 py-0.5 rounded border print:border-none">{item.price} ريال</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* الإجمالي المالي الفرعي للعطل */}
                      <td className="p-4 text-left font-bold text-slate-900 text-sm md:text-base font-mono">
                        {row.totalCost.toLocaleString('en-US')} ريال
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
