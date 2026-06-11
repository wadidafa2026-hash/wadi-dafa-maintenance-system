import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Truck,
  Wrench,
  AlertTriangle,
  LogOut,
  Plus,
  CheckCircle,
  X,
  FileText,
  ClipboardList,
  Calendar,
  Printer,
  User
} from "lucide-react";

interface DashboardProps {
  user: { name: string; role: string };
  onLogout: () => void;
}

// 1. تعريف واجهة الآليات المطابقة لـ نيون بدقة
interface Equipment {
  id: number;
  name: string;
  code: string;
  model: string | null;
  plateNumber: string | null;
  currentDriver: string;
  status: "available" | "in_maintenance" | "out_of_service";
}

// 2. تعريف واجهة سجلات الصيانة والتقارير
interface MaintenanceLog {
  id: number;
  equipmentId: number;
  driverAtFault: string;
  entryDate: string;
  exitDate: string | null;
  maintenanceType: string;
  details: string | null;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  // التحكم في التبويب الحالي (كشف الآليات أو التقارير)
  const [activeTab, setActiveTab] = useState<"fleet" | "reports">("fleet");
  
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);

  // حالات نافذة إضافة معدة جديدة
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [model, setModel] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [currentDriver, setCurrentDriver] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // حالات نافذة إدخال المعدة للورشة / الصيانة
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
  const [maintenanceType, setMaintenanceType] = useState("إصلاح عطل طارئ");
  const [details, setDetails] = useState("");
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL || "";

  // دالة جلب كل البيانات لايف من السيرفر
  const fetchData = async () => {
    setLoading(true);
    try {
      // جلب الآليات
      const eqRes = await fetch(`${baseUrl}/api/equipment`);
      const eqData = await eqRes.json();
      setEquipmentList(eqData);

      // جلب التقارير والسجلات
      setLogsLoading(true);
      const logRes = await fetch(`${baseUrl}/api/maintenance`);
      const logData = await logRes.json();
      setMaintenanceLogs(logData);
    } catch (err) {
      console.error("فشل سحب البيانات الحية من نيون:", err);
    } finally {
      setLoading(false);
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [baseUrl]);

  // دالة إضافة آلية جديدة ومطابقة للحقول الإجبارية
  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !currentDriver) {
      alert("الرجاء ملء الحقول الأساسية: اسم المعدة، الكود الفريد، والسائق");
      return;
    }
    setAddLoading(true);

    try {
      const response = await fetch(`${baseUrl}/api/equipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, model, plateNumber, currentDriver }),
      });

      const data = await response.json();

      if (response.ok) {
        // الباكيند بيرجع الكائن جوة حقل data.data
        setEquipmentList((prev) => [...prev, data.data]);
        setIsModalOpen(false);
        // تفريغ الفورم
        setName(""); setCode(""); setModel(""); setPlateNumber(""); setCurrentDriver("");
        fetchData(); // تحديث السجلات
      } else {
        alert(data.message || "فشل إضافة الآلية");
      }
    } catch (err) {
      alert("حدث خطأ في الاتصال بالسيرفر");
    } finally {
      setAddLoading(false);
    }
  };

  // دالة فتح أورنيك الورشة (إدخال معدة للصيانة أو إيقاف طارئ)
  const handleEnterMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipmentId || !maintenanceType) return;
    setMaintenanceLoading(true);

    try {
      const response = await fetch(`${baseUrl}/api/maintenance/enter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId: selectedEquipmentId,
          maintenanceType,
          details
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setIsMaintenanceModalOpen(false);
        setDetails("");
        fetchData(); // إعادة سحب البيانات لايف لتحديث العدادات والجدول والتقارير سوا
      } else {
        alert(data.message || "فشل فتح سجل الصيانة");
      }
    } catch (err) {
      alert("خطأ في الاتصال بالسيرفر");
    } finally {
      setMaintenanceLoading(false);
    }
  };

  // دالة إخراج المعدة من الصيانة وإعادتها للخدمة جاهزة (available)
  const handleExitMaintenance = async (equipmentId: number) => {
    // البحث عن السجل المفتوح للمعدة الحالية (اللي ما عنده تاريخ خروج)
    const activeLog = maintenanceLogs.find(log => log.equipmentId === equipmentId && !log.exitDate);
    
    if (!activeLog) {
      // حماية إضافية: لو ما لقى سجل مفتوح نحدث حالتها مباشرة عبر الـ PATCH المرن
      try {
        await fetch(`${baseUrl}/api/equipment/${equipmentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "available" }),
        });
        fetchData();
        return;
      } catch (err) {
        console.error(err);
        return;
      }
    }

    try {
      const response = await fetch(`${baseUrl}/api/maintenance/exit/${activeLog.id}`, {
        method: "POST",
      });
      if (response.ok) {
        fetchData();
      } else {
        alert("فشل إخراج المعدة من الورشة");
      }
    } catch (err) {
      alert("حدث خطأ في الاتصال");
    }
  };

  // العدادات الذكية والمطابقة لمسميات نيون الجديدة
  const total = equipmentList.length;
  const available = equipmentList.filter((e) => e.status === "available").length;
  const inMaintenance = equipmentList.filter((e) => e.status === "in_maintenance").length;
  const outOfService = equipmentList.filter((e) => e.status === "out_of_service").length;

  // دالة مساعدة لترجمة اسم المعدة بناء على الـ ID في جدول التقارير
  const getEquipmentName = (id: number) => {
    const eq = equipmentList.find((e) => e.id === id);
    return eq ? `${eq.name} (${eq.code})` : `معدة رقم #${id}`;
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-right" dir="rtl">
      {/* الهيدر الرئيسي للمشروع */}
      <header className="bg-[#1e3a8a] text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white text-[#1e3a8a] px-3 py-1.5 rounded-xl font-bold text-xl shadow-inner">
              دفا
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">أسطول وادي دفا للآليات</h1>
              <p className="text-xs text-blue-200">نظام المتابعة وأرانيك الصيانة الذكي لايف</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-blue-200">
                {user.role === "super_admin" ? "👑 مشرف عام السيستم" : "👀 مراقب قراءة فقط"}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-600/20 hover:bg-red-600 p-2.5 rounded-xl transition-all text-red-200 hover:text-white flex items-center gap-1 text-sm font-medium shadow-sm"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">خروج آمن</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* قسم العدادات الأربعة الحقيقية */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">إجمالي الأسطول</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{total}</p>
            </div>
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl"><Truck size={24} /></div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">جاهزة ومتاحة للعمل</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{available}</p>
            </div>
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl"><CheckCircle size={24} /></div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">داخل ورشة الصيانة</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{inMaintenance}</p>
            </div>
            <div className="bg-amber-50 text-amber-700 p-3 rounded-xl"><Wrench size={24} /></div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">خارج الخدمة تماماً</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{outOfService}</p>
            </div>
            <div className="bg-red-50 text-red-600 p-3 rounded-xl"><AlertTriangle size={24} /></div>
          </div>
        </div>

        {/* أزرار التنقل بين التبويبات (Tabs) - حل مشكلة اختفاء التقارير */}
        <div className="flex border-b border-slate-200 bg-white p-2 rounded-xl shadow-sm gap-2">
          <button
            onClick={() => setActiveTab("fleet")}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              activeTab === "fleet" ? "bg-[#1e3a8a] text-white shadow" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Truck size={18} />
            <span>كشف ومتابعة الآليات</span>
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              activeTab === "reports" ? "bg-[#1e3a8a] text-white shadow" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <FileText size={18} />
            <span>سجلات صيانة الأرانيك والتقارير ({maintenanceLogs.length})</span>
          </button>
        </div>

        {/* التبويب الأول: كشف الآليات الميدانية */}
        {activeTab === "fleet" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 text-slate-700">
                <LayoutDashboard size={20} />
                <h2 className="font-bold text-base sm:text-lg">متابعة حركة آليات الميدان الحالية</h2>
              </div>
              {user.role === "super_admin" && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-[#1e3a8a] hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1 shadow-sm transition-all"
                >
                  <Plus size={16} />
                  <span>تسجيل آلية جديدة</span>
                </button>
              )}
            </div>

            {/* الجدول الرئيسي للآليات */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-slate-500 text-sm animate-pulse">جاري سحب البيانات الآمنة من نيون سحابياً...</div>
              ) : equipmentList.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
                  <Truck size={40} className="text-slate-300 animate-bounce" />
                  <p className="font-medium text-slate-600">لا توجد آليات مسجلة حالياً في النظام</p>
                </div>
              ) : (
                <>
                  {/* عرض الكمبيوتر */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm font-medium">
                          <th className="p-4">كود الآلية الفريد</th>
                          <th className="p-4">اسم المعدة والموديل</th>
                          <th className="p-4">رقم اللوحة</th>
                          <th className="p-4">السائق الميداني الحالي</th>
                          <th className="p-4">حالة الجاهزية</th>
                          {user.role === "super_admin" && <th className="p-4 text-center">إجراءات الورشة والحركة</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                        {equipmentList.map((eq) => (
                          <tr key={eq.id} className="hover:bg-slate-50/80 transition-all">
                            <td className="p-4 font-mono font-bold text-blue-800">{eq.code}</td>
                            <td className="p-4">
                              <div className="font-semibold text-slate-900">{eq.name}</div>
                              <span className="text-xs text-slate-400">{eq.model || "الموديل غير محدد"}</span>
                            </td>
                            <td className="p-4 font-mono text-slate-600">{eq.plateNumber || "—"}</td>
                            <td className="p-4 font-medium text-slate-700">👤 {eq.currentDriver}</td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                eq.status === "available" ? "bg-emerald-50 text-emerald-700" :
                                eq.status === "in_maintenance" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                              }`}>
                                <span className={`w-2 h-2 rounded-full ${
                                  eq.status === "available" ? "bg-emerald-500" :
                                  eq.status === "in_maintenance" ? "bg-amber-500" : "bg-red-500"
                                }`}></span>
                                {eq.status === "available" ? "جاهزة للعمل" : eq.status === "in_maintenance" ? "في الورشة" : "خارج الخدمة"}
                              </span>
                            </td>
                            {user.role === "super_admin" && (
                              <td className="p-4">
                                <div className="flex justify-center gap-2">
                                  {eq.status !== "available" && (
                                    <button
                                      onClick={() => handleExitMaintenance(eq.id)}
                                      className="px-3 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-medium shadow-sm transition-all"
                                    >
                                      إصلاح وتشغيل جاهز
                                    </button>
                                  )}
                                  {eq.status === "available" && (
                                    <>
                                      <button
                                        onClick={() => { setSelectedEquipmentId(eq.id); setMaintenanceType("صيانة دورية / طارئة"); setIsMaintenanceModalOpen(true); }}
                                        className="px-3 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-medium transition-all"
                                      >
                                        إدخال الورشة
                                      </button>
                                      <button
                                        onClick={() => { setSelectedEquipmentId(eq.id); setMaintenanceType("خارج الخدمة"); setIsMaintenanceModalOpen(true); }}
                                        className="px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-medium transition-all"
                                      >
                                        إيقاف طارئ
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* عرض الموبايل المتناسق */}
                  <div className="block md:hidden divide-y divide-slate-100">
                    {equipmentList.map((eq) => (
                      <div key={eq.id} className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{eq.code}</span>
                            <h3 className="font-bold text-slate-900 text-sm mt-1">{eq.name}</h3>
                            <p className="text-xs text-slate-400">{eq.model} • <span className="font-mono">{eq.plateNumber}</span></p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            eq.status === "available" ? "bg-emerald-50 text-emerald-700" :
                            eq.status === "in_maintenance" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                          }`}>{eq.status === "available" ? "جاهزة" : eq.status === "in_maintenance" ? "بالورشة" : "متوقفة"}</span>
                        </div>
                        <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl">السائق الحالي الموثق: <strong>{eq.currentDriver}</strong></div>
                        {user.role === "super_admin" && (
                          <div className="flex gap-2 pt-1">
                            {eq.status !== "available" && (
                              <button onClick={() => handleExitMaintenance(eq.id)} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium text-center">تشغيل المعدة</button>
                            )}
                            {eq.status === "available" && (
                              <>
                                <button onClick={() => { setSelectedEquipmentId(eq.id); setMaintenanceType("صيانة دورية / طارئة"); setIsMaintenanceModalOpen(true); }} className="flex-1 py-2 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium text-center">الورشة</button>
                                <button onClick={() => { setSelectedEquipmentId(eq.id); setMaintenanceType("خارج الخدمة"); setIsMaintenanceModalOpen(true); }} className="flex-1 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-medium text-center">إيقاف</button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* التبويب الثاني: شاشة أرانيك الصيانة والتقارير المكتملة */}
        {activeTab === "reports" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2 text-slate-700">
                <ClipboardList size={20} className="text-blue-700" />
                <div>
                  <h2 className="font-bold text-base sm:text-lg">أرشيف أرانيك وتقارير صيانة الحركة</h2>
                  <p className="text-xs text-slate-400">توثيق السائق المسؤول والتواريخ آمن برمجياً وقابل للطباعة</p>
                </div>
              </div>
              <button 
                onClick={() => window.print()} 
                className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Printer size={16} />
                <span>طباعة كشف التقارير</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-none">
              {logsLoading ? (
                <div className="p-8 text-center text-slate-500 text-sm">جاري جلب الأرشيف والتقارير الحية...</div>
              ) : maintenanceLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">لا توجد بلاغات أو تقارير صيانة مسجلة في الأرشيف حالياً.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs sm:text-sm font-medium">
                        <th className="p-4">رقم الأورنيك</th>
                        <th className="p-4">الآلية المتضررة</th>
                        <th className="p-4">السائق لحظة وقوع العطل</th>
                        <th className="p-4">نوع الحركة / الصيانة</th>
                        <th className="p-4">تفاصيل العطل والقطع</th>
                        <th className="p-4">تاريخ الدخول</th>
                        <th className="p-4">تاريخ الخروج والجاهزية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 text-xs sm:text-sm">
                      {maintenanceLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/60 transition-all">
                          <td className="p-4 font-mono text-slate-400">#00{log.id}</td>
                          <td className="p-4 font-bold text-slate-900">{getEquipmentName(log.equipmentId)}</td>
                          <td className="p-4 text-red-700 font-medium">🚨 {log.driverAtFault}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${log.maintenanceType === 'خارج الخدمة' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                              {log.maintenanceType}
                            </span>
                          </td>
                          <td className="p-4 max-w-xs truncate text-slate-600" title={log.details || ""}>{log.details || "لا توجد تفاصيل ملحقة"}</td>
                          <td className="p-4 text-slate-500 font-mono text-xs">📅 {new Date(log.entryDate).toLocaleString('ar-EG')}</td>
                          <td className="p-4">
                            {log.exitDate ? (
                              <span className="text-emerald-600 font-mono text-xs font-semibold">
                                ✅ خرجت في: {new Date(log.exitDate).toLocaleString('ar-EG')}
                              </span>
                            ) : (
                              <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                                🛠️ قيد الإصلاح بالورشة
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 1. نافذة إضافة آلية جديدة مع الكود والموديل (Modal) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#1e3a8a] p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2"><Plus size={18} /><span>تسجيل آلية جديدة بالداتابيز</span></h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddEquipment} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">كود الآلية الفريد بالأسطول (إجباري ومميز)*</label>
                <input type="text" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="مثال: W.B.G 0001" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-left font-mono font-bold text-blue-900 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">اسم المعدة / الموديل الكلي*</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: بوكلين كاتر بيلر، قلاب مرسيدس" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">سنة الصنع / الموديل</label>
                  <input type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="مثال: 2024" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">رقم اللوحة المرورية</label>
                  <input type="text" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} placeholder="أ ب ج 123" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">اسم السائق الميداني المسؤول حالياً*</label>
                <input type="text" required value={currentDriver} onChange={(e) => setCurrentDriver(e.target.value)} placeholder="ادخل اسم السائق لتثبيته في البلاغات" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={addLoading} className="flex-1 py-2.5 bg-[#1e3a8a] text-white font-medium rounded-xl text-sm shadow disabled:opacity-50">{addLoading ? "جاري الحفظ والربط الحقيقي..." : "حفظ وتفعيل بالأسطول"}</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. نافذة إدخال الورشة وتوثيق السائق المسؤول لحظة وقوع العطل (Modal) */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-amber-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2"><Wrench size={18} /><span>فتح أورنيك حركة / صيانة آلية</span></h3>
              <button onClick={() => setIsMaintenanceModalOpen(false)} className="text-white/80 hover:text-white p-1 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleEnterMaintenance} className="p-5 space-y-4">
              <div className="bg-amber-50 p-3 rounded-xl text-xs text-amber-800 border border-amber-200">
                💡 <strong>تنبيه ذكي:</strong> النظام سيقوم تلقائياً بسحب اسم السائق الشغال بالمعدة حالياً، ويقوم بتثبيته في الأرشيف كـ <strong>(السائق المسؤول وقت العطل)</strong> لضمان حماية الأصول.
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">نوع بلاغ الحركة الصيانة*</label>
                <select 
                  value={maintenanceType} 
                  onChange={(e) => setMaintenanceType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-amber-500 text-sm"
                >
                  <option value="صيانة عطل طارئ">إصلاح عطل طارئ (ميكانيكا/كهرباء)</option>
                  <option value="صيانة دورية">صيانة دورية (زيوت وفلاتر وحسابات)</option>
                  <option value="خارج الخدمة">إيقاف طارئ خروج عن الخدمة (حادث / عطل جسيم)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">تفاصيل العطل والقطع المتضررة</label>
                <textarea rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="مثال: ضرب جلبة الهيدروليك الخلفية، تحتاج تغيير فلاتر..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-amber-500 text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={maintenanceLoading} className="flex-1 py-2.5 bg-amber-600 text-white font-medium rounded-xl text-sm shadow disabled:opacity-50">{maintenanceLoading ? "جاري فتح الأورنيك وتحديث نيون..." : "تأكيد الحركة وإدخال الورشة"}</button>
                <button type="button" onClick={() => setIsMaintenanceModalOpen(false)} className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
