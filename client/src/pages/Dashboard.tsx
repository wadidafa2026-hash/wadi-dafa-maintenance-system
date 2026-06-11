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
  Search,
  Calendar,
  Download,
  Moon,
  Sun,
  Edit3
} from "lucide-react";

interface DashboardProps {
  user: { name: string; role: string };
  onLogout: () => void;
}

interface Equipment {
  id: number;
  name: string;
  code: string;
  model: string | null;
  plateNumber: string | null;
  currentDriver: string;
  status: "available" | "in_maintenance" | "out_of_service";
}

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
  const [activeTab, setActiveTab] = useState<"fleet" | "reports">("fleet");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("wadi_dafa_theme") === "dark";
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEquipmentFilter, setSelectedEquipmentFilter] = useState<string>("all");
  const [dateFilterType, setDateFilterType] = useState<"all" | "month" | "range">("all");
  const [filterMonth, setFilterMonth] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [model, setModel] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [currentDriver, setCurrentDriver] = useState("");
  const [maintenanceType, setMaintenanceType] = useState("صيانة عطل طارئ");
  const [details, setDetails] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const [selectedEquipmentProfile, setSelectedEquipmentProfile] = useState<Equipment | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editPlateNumber, setEditPlateNumber] = useState("");
  const [editDriver, setEditDriver] = useState<"available" | "in_maintenance" | "out_of_service">("available");
  const [editStatus, setEditStatus] = useState<"available" | "in_maintenance" | "out_of_service">("available");

  const baseUrl = import.meta.env.VITE_API_URL || "";

  const fetchData = async () => {
    setLoading(true);
    try {
      const eqRes = await fetch(`${baseUrl}/api/equipment`);
      const eqData = await eqRes.json();
      setEquipmentList(eqData);

      const logRes = await fetch(`${baseUrl}/api/maintenance`);
      const logData = await logRes.json();
      setMaintenanceLogs(logData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [baseUrl]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    localStorage.setItem("wadi_dafa_theme", !isDarkMode ? "dark" : "light");
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !currentDriver) return;
    setAddLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/equipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, model, plateNumber, currentDriver }),
      });
      if (response.ok) {
        setIsAddModalOpen(false);
        setName(""); setCode(""); setModel(""); setPlateNumber(""); setCurrentDriver("");
        fetchData();
      }
    } catch (err) {
      alert("خطأ في الاتصال");
    } finally {
      setAddLoading(false);
    }
  };

  const handleEnterMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipmentId) return;
    try {
      const response = await fetch(`${baseUrl}/api/maintenance/enter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equipmentId: selectedEquipmentId, maintenanceType, details }),
      });
      if (response.ok) {
        setIsMaintenanceModalOpen(false);
        setDetails("");
        fetchData();
      }
    } catch (err) {
      alert("خطأ اتصال");
    }
  };

  const handleExitMaintenance = async (equipmentId: number) => {
    const activeLog = maintenanceLogs.find(log => log.equipmentId === equipmentId && !log.exitDate);
    try {
      if (activeLog) {
        await fetch(`${baseUrl}/api/maintenance/exit/${activeLog.id}`, { method: "POST" });
      } else {
        await fetch(`${baseUrl}/api/equipment/${equipmentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "available" }),
        });
      }
      fetchData();
      setSelectedEquipmentProfile(null);
    } catch (err) {
      alert("خطأ");
    }
  };

  const handleUpdateEquipmentProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipmentProfile) return;
    try {
      const response = await fetch(`${baseUrl}/api/equipment/${selectedEquipmentProfile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          code: editCode,
          model: editModel,
          plateNumber: editPlateNumber,
          currentDriver: editDriver,
          status: editStatus
        }),
      });
      if (response.ok) {
        setIsEditMode(false);
        setSelectedEquipmentProfile(null);
        fetchData();
      }
    } catch (err) {
      alert("خطأ تحديث");
    }
  };

  const openProfileDrawer = (eq: Equipment) => {
    setSelectedEquipmentProfile(eq);
    setEditName(eq.name);
    setEditCode(eq.code);
    setEditModel(eq.model || "");
    setEditPlateNumber(eq.plateNumber || "");
    setEditDriver(eq.currentDriver as any);
    setEditStatus(eq.status);
    setIsEditMode(false);
  };

  // توليد ملف إكسل رسمي يجبر البرنامج على الفتح من اليمين لليسار (RTL) تلقائياً
  const handleExportExcelRTL = () => {
    const tableRows = filteredLogs.map(log => {
      const eq = equipmentList.find(e => e.id === log.equipmentId);
      return `
        <tr>
          <td>${log.id}</td>
          <td>${eq ? eq.code : "—"}</td>
          <td>${eq ? eq.name : "—"}</td>
          <td>${log.driverAtFault}</td>
          <td>${log.maintenanceType}</td>
          <td>${log.details || "—"}</td>
          <td>${new Date(log.entryDate).toLocaleDateString("ar-EG")}</td>
          <td>${log.exitDate ? new Date(log.exitDate).toLocaleDateString("ar-EG") : "تحت الصيانة"}</td>
        </tr>
      `;
    }).join("");

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; direction: rtl; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-family: sans-serif; }
          th { bg-color: #1e3a8a; color: white; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>رقم الأورنيك</th>
              <th>كود الآلية</th>
              <th>اسم المعدة</th>
              <th>السائق</th>
              <th>نوع الإجراء</th>
              <th>التفاصيل والقطع</th>
              <th>تاريخ الدخول</th>
              <th>تاريخ الجاهزية</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `تقارير_وادي_دفا_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEquipment = equipmentList.filter(eq => 
    eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    eq.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    eq.currentDriver.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = maintenanceLogs.filter(log => {
    const eq = equipmentList.find(e => e.id === log.equipmentId);
    if (selectedEquipmentFilter !== "all" && log.equipmentId.toString() !== selectedEquipmentFilter) return false;
    if (searchQuery) {
      const match = (eq?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (eq?.code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    log.driverAtFault.toLowerCase().includes(searchQuery.toLowerCase());
      if (!match) return false;
    }
    const entryDate = new Date(log.entryDate);
    if (dateFilterType === "month" && filterMonth) {
      const [year, month] = filterMonth.split("-");
      return entryDate.getFullYear() === parseInt(year) && (entryDate.getMonth() + 1) === parseInt(month);
    }
    if (dateFilterType === "range" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return entryDate >= start && entryDate <= end;
    }
    return true;
  });

  const total = equipmentList.length;
  const available = equipmentList.filter(e => e.status === "available").length;
  const inMaintenance = equipmentList.filter(e => e.status === "in_maintenance").length;
  const outOfService = equipmentList.filter(e => e.status === "out_of_service").length;

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${isDarkMode ? "bg-[#0A192F] text-slate-100" : "bg-[#f8fafc] text-slate-800"}`} dir="rtl">
      
      {/* 🧭 السايد بار الاحترافي المستقر */}
      <aside className={`w-64 flex flex-col shrink-0 transition-all border-l ${
        isDarkMode ? "bg-[#112240] border-slate-800" : "bg-white border-slate-200"
      } ${sidebarOpen ? "block" : "hidden"}`}>
        
        <div className="p-6 border-b border-slate-500/10">
          <h1 className="font-bold text-lg tracking-tight text-blue-600">نظام إدارة الأسطول</h1>
          <p className="text-xs text-slate-400 mt-1">شركة وادي دفا</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <button
            onClick={() => setActiveTab("fleet")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === "fleet" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-500/5"
            }`}
          >
            <Truck size={18} />
            <span>كشف الآليات</span>
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === "reports" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-500/5"
            }`}
          >
            <FileText size={18} />
            <span>سجلات وتقارير الحركة</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-500/10 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg text-xs font-semibold bg-slate-500/5 hover:bg-slate-500/10"
          >
            <div className="flex items-center gap-2">
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
              <span>{isDarkMode ? "الوضع المضيء" : "الوضع الداكن"}</span>
            </div>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all"
          >
            <LogOut size={14} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* 🖥️ مساحة العرض الرئيسية المرنة والمحمية من الانضغاط */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        <header className={`p-4 flex justify-between items-center border-b md:px-8 ${
          isDarkMode ? "bg-[#112240]/50 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-500/10 hover:bg-slate-500/20"
            >
              القائمة الجانبية
            </button>
            <h2 className="text-base font-bold">
              {activeTab === "fleet" ? "متابعة حركة الآليات الحية" : "أرشيف التقارير واستخراج الملفات"}
            </h2>
          </div>
        </header>

        <div className="p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* 📊 الإحصائيات العامة: تظهر هنا مرة واحدة للكل فوق ونظيفة جداً وبدون تكرار */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-xl border ${isDarkMode ? "bg-[#112240] border-slate-800" : "bg-white border-slate-200"}`}>
              <p className="text-xs font-medium text-slate-400">إجمالي الأسطول</p>
              <p className="text-2xl font-bold mt-2">{total}</p>
            </div>
            <div className={`p-5 rounded-xl border ${isDarkMode ? "bg-[#112240] border-slate-800" : "bg-white border-slate-200"}`}>
              <p className="text-xs font-medium text-slate-400">جاهز ومتاح</p>
              <p className="text-2xl font-bold mt-2 text-emerald-500">{available}</p>
            </div>
            <div className={`p-5 rounded-xl border ${isDarkMode ? "bg-[#112240] border-slate-800" : "bg-white border-slate-200"}`}>
              <p className="text-xs font-medium text-slate-400">في الورشة</p>
              <p className="text-2xl font-bold mt-2 text-amber-500">{inMaintenance}</p>
            </div>
            <div className={`p-5 rounded-xl border ${isDarkMode ? "bg-[#112240] border-slate-800" : "bg-white border-slate-200"}`}>
              <p className="text-xs font-medium text-slate-400">خارج الخدمة</p>
              <p className="text-2xl font-bold mt-2 text-red-500">{outOfService}</p>
            </div>
          </div>

          {/* تبويب الأسطول الأساسي */}
          {activeTab === "fleet" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                <div className="relative w-full sm:max-w-md">
                  <input
                    type="text"
                    placeholder="ابحث برقم الكود أو اسم الآلية أو السائق..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg text-sm border outline-none focus:border-blue-600 ${
                      isDarkMode ? "bg-[#112240] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                {user.role === "super_admin" && (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                  >
                    تسجيل آلية جديدة
                  </button>
                )}
              </div>

              {/* الجدول الرسمي والنظيف */}
              <div className={`rounded-xl border overflow-hidden ${isDarkMode ? "bg-[#112240] border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className={`text-xs border-b ${isDarkMode ? "text-slate-400 bg-slate-800/40 border-slate-800" : "text-slate-500 bg-slate-50 border-slate-200"}`}>
                        <th className="p-4">كود الآلية</th>
                        <th className="p-4">المعدة والموديل</th>
                        <th className="p-4">رقم اللوحة</th>
                        <th className="p-4">السائق</th>
                        <th className="p-4">الحالة التشغيلية</th>
                        {user.role === "super_admin" && <th className="p-4 text-center">إجراءات الورشة</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm divide-slate-500/10">
                      {filteredEquipment.map(eq => (
                        <tr 
                          key={eq.id} 
                          onClick={() => openProfileDrawer(eq)}
                          className="hover:bg-slate-500/5 cursor-pointer transition-all"
                        >
                          <td className="p-4 font-mono font-bold text-blue-500">{eq.code}</td>
                          <td className="p-4">
                            <div className="font-semibold">{eq.name}</div>
                            <span className="text-xs text-slate-400">{eq.model || "—"}</span>
                          </td>
                          <td className="p-4 font-mono text-slate-400">{eq.plateNumber || "—"}</td>
                          <td className="p-4 text-slate-400">{eq.currentDriver}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              eq.status === "available" ? "bg-emerald-500/10 text-emerald-500" :
                              eq.status === "in_maintenance" ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                            }`}>
                              {eq.status === "available" ? "جاهزة للعمل" : eq.status === "in_maintenance" ? "في الورشة" : "خارج الخدمة"}
                            </span>
                          </td>
                          {user.role === "super_admin" && (
                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-center">
                                {eq.status !== "available" ? (
                                  <button
                                    onClick={() => handleExitMaintenance(eq.id)}
                                    className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700"
                                  >
                                    إصلاح وتشغيل جاهز
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => { setSelectedEquipmentId(eq.id); setMaintenanceType("صيانة عطل طارئ"); setIsMaintenanceModalOpen(true); }}
                                    className="px-3 py-1 bg-amber-600 text-white rounded text-xs font-medium hover:bg-amber-700"
                                  >
                                    دخول صيانة
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* تبويب سجلات الحركة والتقارير المتقدمة */}
          {activeTab === "reports" && (
            <div className="space-y-4">
              <div className={`p-6 rounded-xl border space-y-4 ${isDarkMode ? "bg-[#112240] border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">حصر التقارير لـ</label>
                    <select
                      value={selectedEquipmentFilter}
                      onChange={(e) => setSelectedEquipmentFilter(e.target.value)}
                      className={`w-full p-2 rounded-lg text-xs font-medium border outline-none ${
                        isDarkMode ? "bg-[#1a365d] border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <option value="all">تقرير شامل لكافة أسطول الآليات</option>
                      {equipmentList.map(e => (
                        <option key={e.id} value={e.id.toString()}>{e.name} ({e.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">النطاق الزمني</label>
                    <select
                      value={dateFilterType}
                      onChange={(e) => setDateFilterType(e.target.value as any)}
                      className={`w-full p-2 rounded-lg text-xs font-medium border outline-none ${
                        isDarkMode ? "bg-[#1a365d] border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <option value="all">تقرير شامل من البداية</option>
                      <option value="month">حصر بشهر محدد</option>
                      <option value="range">تحديد تاريخ مخصص</option>
                    </select>
                  </div>

                  {dateFilterType === "month" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">اختر الشهر</label>
                      <input
                        type="month"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className={`w-full p-2 rounded-lg text-xs font-medium border outline-none ${
                          isDarkMode ? "bg-[#1a365d] border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                        }`}
                      />
                    </div>
                  )}

                  {dateFilterType === "range" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">من</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 rounded-lg text-xs border" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">إلى</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 rounded-lg text-xs border" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleExportExcelRTL}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all"
                  >
                    <Download size={14} />
                    <span>تصدير ملف Excel المعتمد (من اليمين لليسار)</span>
                  </button>
                </div>
              </div>

              {/* جدول أرشيف الحركة المالي والإجرائي النظيف */}
              <div className={`rounded-xl border overflow-hidden ${isDarkMode ? "bg-[#112240] border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className={`text-xs border-b ${isDarkMode ? "text-slate-400 bg-slate-800/40" : "text-slate-50 bg-slate-50"}`}>
                        <th className="p-4">رقم الأورنيك</th>
                        <th className="p-4">الآلية الكودية</th>
                        <th className="p-4">السائق</th>
                        <th className="p-4">نوع الإجراء</th>
                        <th className="p-4">التفاصيل الفنية</th>
                        <th className="p-4">تاريخ الدخول</th>
                        <th className="p-4">حالة الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {filteredLogs.map(log => {
                        const eq = equipmentList.find(e => e.id === log.equipmentId);
                        return (
                          <tr key={log.id} className="hover:bg-slate-500/5">
                            <td className="p-4 font-mono text-slate-400">#00{log.id}</td>
                            <td className="p-4">
                              <div className="font-semibold text-slate-400">{eq?.name || "—"}</div>
                              <span className="text-xs font-mono text-blue-500">{eq?.code || "—"}</span>
                            </td>
                            <td className="p-4 text-slate-400">{log.driverAtFault}</td>
                            <td className="p-4"><span className="px-2 py-0.5 bg-slate-500/10 rounded text-xs">{log.maintenanceType}</span></td>
                            <td className="p-4 text-slate-400 max-w-xs truncate" title={log.details || ""}>{log.details || "—"}</td>
                            <td className="p-4 font-mono text-xs text-slate-400">{new Date(log.entryDate).toLocaleDateString('ar-EG')}</td>
                            <td className="p-4">
                              {log.exitDate ? (
                                <span className="text-emerald-500 text-xs">جاهزة للعمل</span>
                              ) : (
                                <span className="text-amber-500 text-xs font-bold">داخل الورشة</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 📥 مودال تسجيل آلية جديدة النظيف والمحكم */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-xl w-full max-w-lg overflow-hidden ${isDarkMode ? "bg-[#112240] text-white" : "bg-white text-slate-800"}`}>
            <div className="bg-blue-900 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">تسجيل آلية جديدة بالأسطول</h3>
              <button onClick={() => setIsAddModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddEquipment} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">كود الآلية المميز*</label>
                  <input type="text" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="W.B.G 001" className="w-full px-3 py-2 bg-slate-500/5 border rounded-lg text-left font-mono outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">اسم المعدة الإجمالي*</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="بلدوزر كوماتسو" className="w-full px-3 py-2 bg-slate-500/5 border rounded-lg outline-none text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">الموديل</label>
                  <input type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="2024" className="w-full px-3 py-2 bg-slate-500/5 border rounded-lg outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">رقم اللوحة</label>
                  <input type="text" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} placeholder="1234 أ ب ج" className="w-full px-3 py-2 bg-slate-500/5 border rounded-lg outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">السائق*</label>
                <input type="text" required value={currentDriver} onChange={(e) => setCurrentDriver(e.target.value)} placeholder="اسم السائق الثلاثي" className="w-full px-3 py-2 bg-slate-500/5 border rounded-lg outline-none text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={addLoading} className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-lg text-sm">{addLoading ? "جاري الحفظ..." : "تأكيد وإضافة"}</button>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-slate-500/10 text-slate-400 rounded-lg text-sm">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📥 مودال دخول الورشة الموحد */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-xl w-full max-w-md overflow-hidden ${isDarkMode ? "bg-[#112240] text-white" : "bg-white text-slate-800"}`}>
            <div className="bg-amber-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">أورنيك حركة جديد (دخول صيانة)</h3>
              <button onClick={() => setIsMaintenanceModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleEnterMaintenance} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">نوع بلاغ دخول الورشة</label>
                <select
                  value={maintenanceType}
                  onChange={(e) => setMaintenanceType(e.target.value)}
                  className="w-full p-2 rounded-lg text-sm border bg-transparent outline-none font-medium"
                >
                  <option value="صيانة عطل طارئ">إصلاح عطل طارئ (ميكانيكا/كهرباء)</option>
                  <option value="صيانة دورية">صيانة دورية (زيوت وفلاتر)</option>
                  <option value="خارج الخدمة">إيقاف كلي عن الخدمة (حادث جسيم)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">أعراض العطل والقطع المطلوبة</label>
                <textarea rows={4} required value={details} onChange={(e) => setDetails(e.target.value)} placeholder="اكتب تفاصيل فحص الورشة هنا..." className="w-full px-3 py-2 bg-slate-500/5 border rounded-lg text-sm outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-amber-600 text-white font-semibold rounded-lg text-sm">إرسال لملف الورشة</button>
                <button type="button" onClick={() => setIsMaintenanceModalOpen(false)} className="px-4 py-2.5 bg-slate-500/10 text-slate-400 rounded-lg text-sm">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🗂️ النافذة المنبصقة الهادئة والراقية لبروفايل المعدة (Centered Corporate Profile Modal) */}
      {selectedEquipmentProfile && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
            isDarkMode ? "bg-[#112240] text-slate-100" : "bg-white text-slate-800"
          }`}>
            
            {/* هيدر النافذة */}
            <div className="p-6 bg-slate-500/5 border-b border-slate-500/10 flex justify-between items-center">
              <div>
                <span className="text-xs font-mono font-bold text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-md">{selectedEquipmentProfile.code}</span>
                <h3 className="font-bold text-lg mt-1">{selectedEquipmentProfile.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedEquipmentProfile(null)}
                className="p-1.5 rounded-lg bg-slate-500/10 hover:bg-slate-500/20"
              >
                <X size={18} />
              </button>
            </div>

            {/* محتوى النافذة المنقسم بنظافة وهدوء لراحة العين */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* القسم الأيمن: العرض العادي أو فورم التعديل */}
              <div className="space-y-4 border-l border-slate-500/10 pl-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider">الملف التعريفي للأصل</h4>
                  <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className="text-xs text-amber-500 underline font-semibold hover:text-amber-600"
                  >
                    {isEditMode ? "إلغاء التعديل" : "تعديل البيانات"}
                  </button>
                </div>

                {!isEditMode ? (
                  <div className="space-y-4 text-sm bg-slate-500/5 p-4 rounded-xl">
                    <div>
                      <span className="text-xs text-slate-400 block">سنة الصنع والموديل</span>
                      <p className="font-semibold">{selectedEquipmentProfile.model || "غير مسجل"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">رقم اللوحة المرورية</span>
                      <p className="font-mono font-semibold">{selectedEquipmentProfile.plateNumber || "—"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">السائق المعتمد حالياً</span>
                      <p className="font-semibold text-slate-400">{selectedEquipmentProfile.currentDriver}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">حالة التشغيل في النظام</span>
                      <p className="font-semibold text-blue-500">{selectedEquipmentProfile.status}</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateEquipmentProfile} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">كود الآلية</label>
                      <input type="text" required value={editCode} onChange={(e) => setEditCode(e.target.value)} className="w-full p-2 bg-slate-500/10 border rounded-lg font-mono outline-none" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">اسم المعدة</label>
                      <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-2 bg-slate-500/10 border rounded-lg outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 mb-1">الموديل</label>
                        <input type="text" value={editModel} onChange={(e) => setEditModel(e.target.value)} className="w-full p-2 bg-slate-500/10 border rounded-lg outline-none" />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">رقم اللوحة</label>
                        <input type="text" value={editPlateNumber} onChange={(e) => setEditPlateNumber(e.target.value)} className="w-full p-2 bg-slate-500/10 border rounded-lg outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">السائق الحالي</label>
                      <input type="text" required value={editDriver} onChange={(e) => setEditDriver(e.target.value as any)} className="w-full p-2 bg-slate-500/10 border rounded-lg outline-none" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">الحالة البرمجية</label>
                      <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)} className="w-full p-2 bg-slate-500/10 border rounded-lg outline-none">
                        <option value="available">متاحة وجاهزة للعمل</option>
                        <option value="in_maintenance">داخل الورشة للصيانة</option>
                        <option value="out_of_service">خارج الخدمة طارئ</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">حفظ التغييرات</button>
                  </form>
                )}
              </div>

              {/* القسم الأيسر: الأرشيف والسجل التاريخي الخاص بالمعدة بنظافة وتنسيق مريح */}
              <div className="space-y-4 flex flex-col">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">السجل التاريخي لتقارير الورشة</h4>
                <div className="flex-1 max-h-[300px] overflow-y-auto space-y-2 pr-1">
                  {maintenanceLogs.filter(l => l.equipmentId === selectedEquipmentProfile.id).length === 0 ? (
                    <p className="text-xs text-slate-400 py-8 text-center bg-slate-500/5 rounded-xl">المعدة خالية تماماً من البلاغات ولم تدخل الورشة مسبقاً.</p>
                  ) : (
                    maintenanceLogs.filter(l => l.equipmentId === selectedEquipmentProfile.id).map(log => (
                      <div key={log.id} className="p-3 bg-slate-500/5 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between font-semibold">
                          <span className="text-red-500">الإجراء: {log.maintenanceType}</span>
                          <span className="text-slate-400 font-mono">#00{log.id}</span>
                        </div>
                        <p className="text-slate-400">{log.details}</p>
                        <div className="flex justify-between items-center pt-1 text-[10px] text-slate-400 border-t border-slate-500/5 mt-1">
                          <span>السائق: {log.driverAtFault}</span>
                          <span>تاريخ الدخول: {new Date(log.entryDate).toLocaleDateString('ar-EG')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* فوتر النافذة المنبصقة */}
            <div className="p-4 bg-slate-500/5 border-t border-slate-500/10 flex justify-end gap-2">
              {selectedEquipmentProfile.status !== "available" && (
                <button
                  onClick={() => handleExitMaintenance(selectedEquipmentProfile.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg"
                >
                  إصلاح فوري وإعادتها للخدمة
                </button>
              )}
              <button 
                onClick={() => setSelectedEquipmentProfile(null)}
                className="px-4 py-2 bg-slate-500/10 text-slate-400 rounded-lg text-xs"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
