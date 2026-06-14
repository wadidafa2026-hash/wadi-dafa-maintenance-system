// client/src/pages/Dashboard.tsx
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

// بنية بيانات سجلات الأعطال والمشتريات الحية من الباك إند
interface FaultRecord {
  id: number;
  equipmentId: number;
  equipmentCode: string;
  equipmentName: string;
  equipmentType: 'equipment' | 'vehicle';
  serialNumber: string | null;
  plateNumber: string | null;
  faultDate: string;
  repairDate: string | null;
  details: string;
  projectName: string | null;
  purchaseItem: string | null;
  purchasePrice: number | null;
}

interface DashboardProps {
  user: { id: number; name: string; username: string; role: 'super_admin' | 'sub_admin' | 'viewer' };
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  // ─── حالات التحكم في واجهة العرض ──────────────────────────────────
  const [currentView, setCurrentView] = useState<'hub' | 'fleet' | 'reports'>('hub');
  const [fleetTab, setFleetTab] = useState<'equipment' | 'vehicle'>('equipment');
  const [reportTab, setReportTab] = useState<'assets' | 'purchases'>('assets');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ─── حالات البيانات والفلاتر حياً من السيرفر ───────────────────────
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [faultsList, setFaultsList] = useState<FaultRecord[]>([]); // الداتا بيز الحية للأعطال والمشتريات
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // فلاتر التقارير المتناسقة الموحدة
  const [reportAssetFilter, setReportAssetFilter] = useState('all'); 
  const [reportTimeFilter, setReportTimeFilter] = useState<'all' | 'month' | 'range'>('all');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ─── حالات المودالات (Modals) ────────────────────────────────────
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false);
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

  // 🔄 دالة جلب الآليات والأعطال حياً من الباك إند
  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. جلب الأسطول الحالي
      const resEquip = await fetch('/api/equipment');
      if (resEquip.ok) {
        const data = await resEquip.json();
        setEquipmentList(data);
      }
      // 2. جلب سجل الأعطال والمشتريات المالي والفني المربوط بالباك إند
      const resFaults = await fetch('/api/faults');
      if (resFaults.ok) {
        const data = await resFaults.json();
        setFaultsList(data);
      }
    } catch (error) {
      console.error('Error fetching backend data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
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
      projectName: faultEquipment.projectName, // حفظ المشروع اللحظي وقت وقوع العطل لضمان سلامة التقارير القديمة
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
        fetchAllData(); // تحديث فوري للحالة والتقارير
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 🧮 محرك الفلترة والتصفية الذكي في الفرونت إند بناءً على خياراتك:
  const filteredFaults = faultsList.filter(record => {
    // 1. فلترة حسب اسم الآلية أو الكل
    if (reportAssetFilter !== 'all' && record.equipmentName !== reportAssetFilter) {
      return false;
    }
    // 2. فلترة حسب النطاق الزمني
    if (reportTimeFilter === 'month' && selectedMonth) {
      // مقارنة السنة والشهر (YYYY-MM)
      return record.faultDate.startsWith(selectedMonth);
    }
    if (reportTimeFilter === 'range' && startDate && endDate) {
      return record.faultDate >= startDate && record.faultDate <= endDate;
    }
    return true;
  });

  // تصفية المشتريات فقط (السجلات التي تحتوي على فواتير قطع غيار وأسعار)
  const filteredPurchases = filteredFaults.filter(r => r.purchasePrice !== null && r.purchasePrice > 0);

  // احتساب حصر المبالغ المالية حياً وبشكل تلقائي بناءً على الفلترة القائمة
  const totalFinancialCost = filteredPurchases.reduce((sum, r) => sum + (r.purchasePrice || 0), 0);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} transition-colors duration-300 font-sans`} dir="rtl">
      
      {/* 👑 الهيدر الملكي الموحد لشركة وادي دفا */}
      <header className={`border-b ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-900 border-slate-700'} text-white px-4 md:px-8 py-4 sticky top-0 z-40 shadow-md`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            {currentView !== 'hub' && (
              <button onClick={() => setCurrentView('hub')} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all text-xs font-bold">
                ↩️ الرئيسية
              </button>
            )}
            <div>
              <h1 className="text-xl md:text-2xl font-black text-amber-400">شركة وادي دفا للمقاولات</h1>
              <p className="text-xs text-slate-300 font-medium opacity-95">نظام إدارة وصيانة الآليات والمعدات الفني</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-lg transition-all">
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={() => setIsProfileOpen(true)} className="flex items-center gap-2 bg-gradient-to-l from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md">
              👤 {user.name}
            </button>
          </div>
        </div>
      </header>

      {/* 📋 جسم الواجهة */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 relative">
        
        {/* 1️⃣ الشاشة الرئيسية (Hub Mode) */}
        {currentView === 'hub' && (
          <div className="min-h-[55vh] flex flex-col justify-center items-center py-12">
            <div className="w-full max-w-xl space-y-5">
              <button onClick={() => setCurrentView('fleet')} className={`w-full text-right p-7 rounded-2xl border transition-all transform hover:-translate-y-1 hover:shadow-lg flex items-center justify-between group ${isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-blue-500' : 'bg-white border-slate-100 hover:border-blue-500 shadow-sm'}`}>
                <div className="space-y-1">
                  <h3 className="text-lg font-black group-hover:text-blue-500 transition-colors">🚚 الآليات والمركبات</h3>
                  <p className="text-xs text-slate-400">إدارة الأسطول، فصل التابات، رصد وتحديث الحالات التشغيلية والمواقع الفورية.</p>
                </div>
                <span className="text-2xl bg-blue-500/10 p-3.5 rounded-xl group-hover:scale-110 transition-transform">⚙️</span>
              </button>

              <button onClick={() => setCurrentView('reports')} className={`w-full text-right p-7 rounded-2xl border transition-all transform hover:-translate-y-1 hover:shadow-lg flex items-center justify-between group ${isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-amber-500' : 'bg-white border-slate-100 hover:border-amber-500 shadow-sm'}`}>
                <div className="space-y-1">
                  <h3 className="text-lg font-black group-hover:text-amber-500 transition-colors">📊 التقارير</h3>
                  <p className="text-xs text-slate-400">مراجعة كشوفات الأعطال الفنية الشاملة وسجل المشتريات والقطع المالي المربوط.</p>
                </div>
                <span className="text-2xl bg-amber-500/10 p-3.5 rounded-xl group-hover:scale-110 transition-transform">📉</span>
              </button>
            </div>
          </div>
        )}

        {/* 2️⃣ صفحة الآليات والمركبات (Fleet View) */}
        {currentView === 'fleet' && (
          <div className="space-y-6">
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8 font-black text-md justify-center md:justify-start">
              <button onClick={() => setFleetTab('equipment')} className={`pb-3 transition-all ${fleetTab === 'equipment' ? 'border-b-4 border-blue-500 text-blue-500' : 'text-slate-400'}`}>⚙️ قسم المعدات الثقيلة</button>
              <button onClick={() => setFleetTab('vehicle')} className={`pb-3 transition-all ${fleetTab === 'vehicle' ? 'border-b-4 border-blue-500 text-blue-500' : 'text-slate-400'}`}>🚚 قسم المركبات والسيارات</button>
            </div>

            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-slate-500/5 p-4 rounded-xl">
              <input type="text" placeholder={fleetTab === 'equipment' ? "🔍 ابحث عن معدة برقم الكود..." : "🔍 ابحث عن مركبة برقم الكود..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full md:max-w-md px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-500 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`} />
              {user.role !== 'viewer' && (
                <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md">
                  {fleetTab === 'equipment' ? '➕ إضافة معدة جديدة' : '➕ إضافة مركبة جديدة'}
                </button>
              )}
            </div>

            {loading ? <p className="text-center text-xs text-slate-400 animate-pulse">جاري سحب بيانات الأسطول من السيرفر...</p> : (
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
                          <h4 className="font-bold text-sm">{item.name}</h4>
                          <p className="text-xs text-slate-400 mt-1">
                            {item.type === 'equipment' ? `🔢 السيريال: ${item.serialNumber || '⚠️ غير مسجل'}` : `🔢 اللوحة: ${item.plateNumber || '⚠️ غير مسجل'}`}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-slate-500/10 flex justify-between items-center text-xs text-slate-400">
                          <span>📍 الموقع الحالي:</span>
                          <span className="font-bold text-slate-500 dark:text-slate-300">{item.projectName || 'في الورشة الرئيسية'}</span>
                        </div>
                      </div>
                      {user.role !== 'viewer' && (
                        <div className="mt-4 pt-3 border-t border-slate-500/10 flex gap-2 justify-end">
                          <button onClick={() => { setFaultEquipment(item); setIsFaultModalOpen(true); }} className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all">
                            ⚠️ تعطلت / صيانة
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* 3️⃣ صفحة التقارير الذكية والمربوطة بالداتا بيز (Reports View) */}
        {currentView === 'reports' && (
          <div className="space-y-6">
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8 font-black text-md">
              <button onClick={() => setReportTab('assets')} className={`pb-3 transition-all ${reportTab === 'assets' ? 'border-b-4 border-amber-500 text-amber-500' : 'text-slate-400'}`}>📋 تقرير المعدات والمركبات (الفني)</button>
              <button onClick={() => setReportTab('purchases')} className={`pb-3 transition-all ${reportTab === 'purchases' ? 'border-b-4 border-amber-500 text-amber-500' : 'text-slate-400'}`}>💰 تقرير المشتريات المالي</button>
            </div>

            {/* فلاتر البحث والتقييد الموحدة لشركة وادي دفا */}
            <div className={`p-5 rounded-2xl border space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
              <h4 className="text-xs font-black text-amber-500">⚙️ محرك تصفية وفلترة السجلات حياً من قاعدة البيانات:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">ابحث باسم آلية معينة أو اعرض الكل:</label>
                  <select value={reportAssetFilter} onChange={(e) => setReportAssetFilter(e.target.value)} className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <option value="all">📁 عرض جميع الآليات والمركبات المسجلة</option>
                    {equipmentList.map(e => <option key={e.id} value={e.name}>{e.name} ({e.code})</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">النطاق الزمني للتقرير:</label>
                  <select value={reportTimeFilter} onChange={(e) => setReportTimeFilter(e.target.value as any)} className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <option value="all">♾️ تقرير شامل (منذ إطلاق النظام)</option>
                    <option value="month">📅 شهر محدد فريد</option>
                    <option value="range">⏳ من تاريخ ... إلى تاريخ ...</option>
                  </select>
                </div>

                {reportTimeFilter === 'month' && (
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">حدد الشهر:</label>
                    <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
                  </div>
                )}
                {reportTimeFilter === 'range' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">من تاريخ:</label>
                      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">إلى تاريخ:</label>
                      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-1">
                <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition-all">
                  🖨️ طباعة واستخراج هذا التقرير كـ PDF
                </button>
              </div>
            </div>

            {/* 📑 هنا الجدول المربوط حياً والمطابق للصورة المرفقة تماماً وبترتيبها الهندسي */}
            {reportTab === 'assets' ? (
              <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className={`${isDarkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-100 text-slate-600'} font-black border-b border-slate-500/10`}>
                        <th className="p-4">نوع المعدة - المركبة</th>
                        <th className="p-4">الرقم التسلسلي أو اللوحة</th>
                        <th className="p-4">كود وادي دفا</th>
                        <th className="p-4">تفاصيل العطل</th>
                        <th className="p-4">تاريخ العطل</th>
                        <th className="p-4">تاريخ الاصلاح</th>
                        <th className="p-4">اسم المشروع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-500/10 font-medium">
                      {filteredFaults.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">⚠️ لا توجد بلاغات صيانة أو أعطال مسجلة تطابق خيارات الفلترة المحددة حالياً.</td>
                        </tr>
                      ) : (
                        filteredFaults.map((record) => (
                          <tr key={record.id} className="hover:bg-slate-500/5 transition-all">
                            <td className="p-4">
                              {record.equipmentType === 'equipment' ? '⚙️ معدة ثقيلة' : '🚚 مركبة / سيارة'} 
                              <span className="text-slate-400 text-xs block mt-0.5">({record.equipmentName})</span>
                            </td>
                            <td className="p-4 font-mono text-slate-500 dark:text-slate-300">
                              {record.equipmentType === 'equipment' ? (record.serialNumber || 'بلا سيريال') : (record.plateNumber || 'بلا لوحة')}
                            </td>
                            <td className="p-4 font-black text-blue-500 uppercase tracking-wider">{record.equipmentCode}</td>
                            <td className="p-4 max-w-xs whitespace-pre-line text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                              {record.details}
                            </td>
                            <td className="p-4 font-mono text-slate-500">{record.faultDate}</td>
                            <td className="p-4 font-mono">
                              {record.repairDate ? (
                                <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full text-[11px]">تم الاصلاح ({record.repairDate})</span>
                              ) : (
                                <span className="text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded-full text-[11px]">⚠️ متعطلة</span>
                              )}
                            </td>
                            <td className="p-4 text-slate-700 dark:text-slate-200 font-bold">
                              {record.projectName || 'الورشة المركزية'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* تقرير المشتريات والجانب المالي المتناسق تماماً ويحسب المصاريف تلقائياً بناء على فلترتك */
              <div className="space-y-4">
                <div className="p-4 rounded-xl flex justify-between items-center bg-gradient-to-l from-amber-500 to-orange-600 text-white shadow-md">
                  <span className="font-bold text-sm">💰 إجمالي حصر فواتير ومصاريف المشتريات للفترة المحددة بالفلاتر أعلاه:</span>
                  <span className="text-xl font-black tracking-wide">{totalFinancialCost.toLocaleString()} ريال سعودي</span>
                </div>
                
                <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse text-sm">
                      <thead>
                        <tr className={`${isDarkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-100 text-slate-600'} font-black border-b border-slate-500/10`}>
                          <th className="p-4">كود الآلية المشتري لها</th>
                          <th className="p-4">اسم قطعة الغيار / المشتري المالي</th>
                          <th className="p-4">التاريخ المالي للقيد</th>
                          <th className="p-4">التكلفة والمدفوع الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-500/10 font-medium">
                        {filteredPurchases.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-400 text-xs">💸 لا توجد فواتير مشتريات مربوطة بأعطال في هذه الفترة حالياً.</td>
                          </tr>
                        ) : (
                          filteredPurchases.map((record) => (
                            <tr key={record.id} className="hover:bg-slate-500/5 transition-all">
                              <td className="p-4 font-black text-blue-500 uppercase">{record.equipmentCode}</td>
                              <td className="p-4 text-xs">{record.purchaseItem}</td>
                              <td className="p-4 font-mono text-slate-400">{record.faultDate}</td>
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
        )}

      </main>

      {/* 👤 مودال البروفايل والصلاحيات */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl relative ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'}`}>
            <h3 className="text-md font-black text-blue-500 mb-4 border-b border-slate-500/10 pb-2">👤 إدارة البروفايل الشخصي والصلاحيات</h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-500/5">
                <span className="text-slate-400">الاسم الكامل:</span>
                <span className="font-bold">{user.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-500/5">
                <span className="text-slate-400">اسم المستخدم (اليوزر):</span>
                <span className="font-mono font-bold text-blue-500">{user.username}</span>
              </div>
            </div>

            <div className="mt-4">
              <button onClick={() => setIsPasswordChangeOpen(!isPasswordChangeOpen)} className="w-full text-center text-[11px] text-blue-500 hover:underline font-bold">
                {isPasswordChangeOpen ? '🔼 إلغاء تغيير كلمة المرور' : '🔑 هل ترغب في تغيير كلمة المرور؟'}
              </button>
              {isPasswordChangeOpen && (
                <div className="mt-3 p-3 rounded-xl space-y-2 bg-slate-500/5 border border-slate-500/10">
                  <input type="password" placeholder="كلمة المرور الجديدة" className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`} />
                  <button className="w-full bg-blue-600 text-white text-xs py-1.5 rounded-lg font-bold">تحديث كلمة المرور</button>
                </div>
              )}
            </div>

            {user.role === 'super_admin' && (
              <div className="mt-5 pt-4 border-t-2 border-dashed border-slate-500/10 space-y-2">
                <h4 className="text-xs font-black text-amber-500">🛡️ لوحة تحكم مدير الصيانة (حصرية):</h4>
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 space-y-2">
                  <input type="text" placeholder="اسم المستخدم الفريد للمشرف الجديد" className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`} />
                  <select className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <option value="sub_admin">مشرف فرعي مكمل (تعديل وإضافة)</option>
                    <option value="viewer">مشاهد فقط (قراءة وتقارير بلا تعديل)</option>
                  </select>
                  <button className="w-full bg-amber-500 text-slate-900 text-xs py-1.5 rounded-lg font-black">➕ إصدار صلاحيات المشرف الجديد</button>
                </div>
              </div>
            )}

            <div className="mt-6 pt-3 border-t border-slate-500/10 flex items-center justify-between">
              <button onClick={onLogout} className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-xl font-bold">↩️ تسجيل خروج</button>
              <button onClick={() => { setIsProfileOpen(false); setIsPasswordChangeOpen(false); }} className="text-slate-400 text-xs font-bold">إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ مودال فتح بلاغ عطل طارئ ومشتريات طارئة */}
      {isFaultModalOpen && faultEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <form onSubmit={handleRegisterFault} className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'}`}>
            <div>
              <h3 className="text-md font-black text-red-500">⚠️ فتح بلاغ عطل وصيانة للآلية</h3>
              <p className="text-xs text-slate-400 mt-0.5">يرتبط تلقائياً بكود الآلية <span className="text-blue-500 font-bold">{faultEquipment.code}</span> وبالمشروع اللحظي لها <span className="text-amber-500 font-bold">({faultEquipment.projectName || 'الورشة'})</span>.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">تاريخ العطل:</label>
                <input type="date" required value={faultDate} onChange={(e) => setFaultDate(e.target.value)} className={`w-full px-3 py-1.5 text-xs rounded-xl border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">تاريخ الاصلاح (اختياري):</label>
                <input type="date" value={repairDate} onChange={(e) => setRepairDate(e.target.value)} className={`w-full px-3 py-1.5 text-xs rounded-xl border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">تفاصيل ووصف العطل (نص فضفاض متعدد الأسطر):</label>
              <textarea rows={3} required placeholder="اكتب تفاصيل العطل الفني بكل أريحية ونزول لأسطر جديدة..." value={faultDetails} onChange={(e) => setFaultDetails(e.target.value)} className={`w-full px-3 py-2 text-xs rounded-xl border outline-none resize-y ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
            </div>

            <div className="p-3 rounded-xl border border-dashed border-slate-500/20 space-y-2 bg-slate-500/5">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="checkPurchases" checked={hasPurchases} onChange={(e) => setHasPurchases(e.target.checked)} className="rounded" />
                <label htmlFor="checkPurchases" className="text-[11px] font-black text-amber-500 cursor-pointer select-none">💰 هل تم شراء قطع غيار أو زيوت؟ (ربط مالي تلقائي)</label>
              </div>
              {hasPurchases && (
                <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-100">
                  <input type="text" required placeholder="اسم القطعة" value={purchaseItem} onChange={(e) => setPurchaseItem(e.target.value)} className={`w-full px-2 py-1.5 text-xs rounded-lg border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`} />
                  <input type="number" required placeholder="السعر بالريال" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className={`w-full px-2 py-1.5 text-xs rounded-lg border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`} />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setIsFaultModalOpen(false)} className="text-xs text-slate-400">إلغاء</button>
              <button type="submit" className="bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md">💾 حفظ بلاغ الصيانة والمشتريات</button>
            </div>
          </form>
        </div>
      )}

      {/* المودالات الملحقة الذكية الأخرى */}
      <AddEquipmentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} type={fleetTab} onSuccess={fetchAllData} isDarkMode={isDarkMode} />
      <EquipmentProfileModal equipment={selectedEquipment} isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onRefresh={fetchAllData} userRole={user.role} isDarkMode={isDarkMode} />

    </div>
  );
};
