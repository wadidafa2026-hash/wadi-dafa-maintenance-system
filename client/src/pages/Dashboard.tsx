import { useState, useEffect } from "react";
import {
  Truck,
  Wrench,
  LogOut,
  Plus,
  X,
  FileText,
  Search,
  Calendar,
  Download,
  Moon,
  Sun,
  Edit3,
  User,
  ShieldAlert,
  Printer,
  ArrowRight,
  Image as ImageIcon
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
  image1?: string | null;
  image2?: string | null;
  image3?: string | null;
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
  // إدارة التنقل بين الصفحات: home, fleet, reports
  const [currentView, setCurrentView] = useState<"home" | "fleet" | "reports">("home");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("wadi_dafa_theme") === "dark";
  });

  // التحكم في المودالات الشاملة
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);

  // داتا الأسطول والصيانة
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  // الفلاتر والبحث
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEquipmentFilter, setSelectedEquipmentFilter] = useState<string>("all");
  const [dateFilterType, setDateFilterType] = useState<"all" | "month" | "range">("all");
  const [filterMonth, setFilterMonth] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showReportResult, setShowReportResult] = useState(false);

  // فورم إضافة معدة
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [model, setModel] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [currentDriver, setCurrentDriver] = useState("");
  const [maintenanceType, setMaintenanceType] = useState("صيانة عطل طارئ");
  const [details, setDetails] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // فورم الملف الشخصي والأمان
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [supName, setSupName] = useState("");
  const [supUsername, setSupUsername] = useState("");
  const [supRole, setSupRole] = useState("main_supervisor");

  // تعديل بروفايل المعدة والصور الثلاثة
  const [selectedEquipmentProfile, setSelectedEquipmentProfile] = useState<Equipment | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editPlateNumber, setEditPlateNumber] = useState("");
  const [editDriver, setEditDriver] = useState("");
  const [editStatus, setEditStatus] = useState<"available" | "in_maintenance" | "out_of_service">("available");
  const [img1, setImg1] = useState<string | null>(null);
  const [img2, setImg2] = useState<string | null>(null);
  const [img3, setImg3] = useState<string | null>(null);

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
          status: editStatus,
          image1: img1,
          image2: img2,
          image3: img3
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
    setEditDriver(eq.currentDriver);
    setEditStatus(eq.status);
    setImg1(eq.image1 || null);
    setImg2(eq.image2 || null);
    setImg3(eq.image3 || null);
    setIsEditMode(false);
  };

  const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (index === 1) setImg1(reader.result as string);
        if (index === 2) setImg2(reader.result as string);
        if (index === 3) setImg3(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("كلمات المرور غير متطابقة");
      return;
    }
    alert("تم تحديث كلمة المرور بنجاح");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleAddSupervisor = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`تم تسجيل المشرف ${supName} بصلاحية ${supRole === "main_supervisor" ? "مشرف رئيسي" : "مشرف قراءة فقط"} بنجاح`);
    setSupName("");
    setSupUsername("");
  };

  const getReportTitle = () => {
    if (selectedEquipmentFilter !== "all") {
      const eq = equipmentList.find(e => e.id.toString() === selectedEquipmentFilter);
      return `تقرير الآلية برقم الكود (${eq ? eq.code : ""})`;
    }
    if (dateFilterType === "month" && filterMonth) {
      const [year, month] = filterMonth.split("-");
      const monthsNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
      return `تقرير شهر ${monthsNames[parseInt(month) - 1]} ${year}`;
    }
    if (dateFilterType === "range" && startDate && endDate) {
      return `تقرير من تاريخ ${startDate} إلى تاريخ ${endDate}`;
    }
    return "تقرير شامل لكل الآليات والمعدات";
  };

  // تصفية كشف الآليات بالبحث المعتمد على رقم الكود فقط
  const filteredEquipment = equipmentList.filter(eq => 
    eq.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // تصفية سجلات الحركة للتقارير
  const filteredLogs = maintenanceLogs.filter(log => {
    const eq = equipmentList.find(e => e.id === log.equipmentId);
    if (selectedEquipmentFilter !== "all" && log.equipmentId.toString() !== selectedEquipmentFilter) return false;
    
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

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${isDarkMode ? "bg-[#0A192F] text-slate-100" : "bg-[#f8fafc] text-slate-800"}`} dir="rtl">
      
      {/* 👑 الهيدر الملكي الثابت (مختفي عند طباعة الورق لتجنب التكرار) */}
      <header className="print:hidden w-full sticky top-0 z-40 px-6 py-4 flex justify-between items-center bg-[#112240] text-white shadow-xl border-b border-blue-900/40">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-xl p-0.5 overflow-hidden shadow-md flex items-center justify-center">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">وادي دفا للمقاولات</h1>
            <p className="text-xs text-blue-400 font-medium">نظام متابعة صيانة المعدات والآليات</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-amber-400 transition-all"
            title="تبديل المظهر"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-sm transition-all shadow-md"
          >
            <User size={16} />
            <span>{user.name}</span>
          </button>
        </div>
      </header>

      {/* 🖥️ مساحة العرض الرئيسية (خلفية بيضاء راقية ومزخرفة في وضع النهار) */}
      <main className={`flex-1 w-full max-w-7xl mx-auto p-6 md:p-8 relative ${!isDarkMode ? "bg-white" : ""}`}>
        
        {/* زخارف شفافة راقية مريحة للعين */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />

        {/* 1️⃣ الشاشة الرئيسية (Home View) */}
        {currentView === "home" && (
          <div className="h-full flex flex-col justify-center items-center py-20 space-y-12 animate-fadeIn">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">مرحباً بك في لوحة التحكم الإدارية</h2>
              <p className="text-sm text-slate-400">يرجى اختيار القسم المطلوب لمباشرة العمل</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl px-4">
              {/* كرت دخول قسم المعدات */}
              <button
                onClick={() => { setCurrentView("fleet"); setSearchQuery(""); }}
                className={`group p-8 rounded-2xl border text-right transition-all flex flex-col justify-between h-52 shadow-md hover:shadow-xl ${
                  isDarkMode ? "bg-[#112240] border-slate-800 hover:border-blue-500" : "bg-slate-50 border-slate-200 hover:border-blue-600"
                }`}
              >
                <div className="p-3 bg-blue-600 text-white rounded-xl w-fit group-hover:scale-110 transition-transform">
                  <Truck size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">المعدات والآليات</h3>
                  <p className="text-xs text-slate-400">استعراض كشف الآليات، البحث برقم الكود، تعديل ملفاتها ودخول الورشة.</p>
                </div>
              </button>

              {/* كرت دخول قسم التقارير */}
              <button
                onClick={() => { setCurrentView("reports"); setShowReportResult(false); }}
                className={`group p-8 rounded-2xl border text-right transition-all flex flex-col justify-between h-52 shadow-md hover:shadow-xl ${
                  isDarkMode ? "bg-[#112240] border-slate-800 hover:border-emerald-500" : "bg-slate-50 border-slate-200 hover:border-emerald-600"
                }`}
              >
                <div className="p-3 bg-emerald-600 text-white rounded-xl w-fit group-hover:scale-110 transition-transform">
                  <FileText size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">التقارير وسجلات الحركة</h3>
                  <p className="text-xs text-slate-400">توليد تقارير فرز مخصصة بالتاريخ أو الآلية مع ميزة الطباعة الرسمية النظيفة.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 2️⃣ شاشة المعدات والآليات (Fleet View) */}
        {currentView === "fleet" && (
          <div className="space-y-6 animate-fadeIn print:hidden">
            <div className="flex justify-between items-center border-b pb-4 border-slate-500/10">
              <button 
                onClick={() => setCurrentView("home")}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:underline"
              >
                <ArrowRight size={14} /> الشاشة الرئيسية
              </button>
              <h2 className="text-lg font-bold">إدارة شؤون الآليات الحية</h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute right-3 top-2.5 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="ابحث هنا برقم الكود المعتمد فقط..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pr-10 pl-4 py-2 rounded-xl text-sm border outline-none focus:border-blue-600 ${
                    isDarkMode ? "bg-[#112240] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
              {user.role === "super_admin" && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> تسجيل آلية جديدة
                </button>
              )}
            </div>

            {/* جدول المعدات */}
            <div className={`rounded-xl border overflow-hidden shadow-sm ${isDarkMode ? "bg-[#112240] border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className={`text-xs border-b ${isDarkMode ? "text-slate-400 bg-slate-800/40 border-slate-800" : "text-slate-500 bg-slate-50 border-slate-200"}`}>
                      <th className="p-4">كود الآلية</th>
                      <th className="p-4">المعدة والموديل</th>
                      <th className="p-4">رقم اللوحة المرورية</th>
                      <th className="p-4">السائق المعتمد</th>
                      <th className="p-4">حالة الجاهزية</th>
                      {user.role === "super_admin" && <th className="p-4 text-center">إجراءات الورشة</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm divide-slate-500/10">
                    {filteredEquipment.map(eq => (
                      <tr 
                        key={eq.id} 
                        onClick={() => openProfileDrawer(eq)}
                        className="hover:bg-blue-600/5 cursor-pointer transition-all"
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
                                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700"
                                >
                                  إصلاح وتشغيل جاهز
                                </button>
                              ) : (
                                <button
                                  onClick={() => { setSelectedEquipmentId(eq.id); setMaintenanceType("صيانة عطل طارئ"); setIsMaintenanceModalOpen(true); }}
                                  className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700"
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

        {/* 3️⃣ شاشة التقارير والطباعة (Reports View) */}
        {currentView === "reports" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* الفلتر والبحث - يختفي كلياً عند أمر الطباعة */}
            <div className="print:hidden space-y-6">
              <div className="flex justify-between items-center border-b pb-4 border-slate-500/10">
                <button 
                  onClick={() => { setCurrentView("home"); setShowReportResult(false); }}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:underline"
                >
                  <ArrowRight size={14} /> الشاشة الرئيسية
                </button>
                <h2 className="text-lg font-bold">بوابة استخراج التقارير الرسمية</h2>
              </div>

              <div className={`p-6 rounded-2xl border space-y-4 ${isDarkMode ? "bg-[#112240] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">تحديد هدف البحث</label>
                    <select
                      value={selectedEquipmentFilter}
                      onChange={(e) => { setSelectedEquipmentFilter(e.target.value); setShowReportResult(false); }}
                      className={`w-full p-2.5 rounded-xl text-xs font-medium border outline-none ${
                        isDarkMode ? "bg-[#1a365d] border-slate-700 text-white" : "bg-white border-slate-200"
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
                      onChange={(e) => { setDateFilterType(e.target.value as any); setShowReportResult(false); }}
                      className={`w-full p-2.5 rounded-xl text-xs font-medium border outline-none ${
                        isDarkMode ? "bg-[#1a365d] border-slate-700 text-white" : "bg-white border-slate-200"
                      }`}
                    >
                      <option value="all">تقرير شامل من البداية</option>
                      <option value="month">حصر بشهر محدد</option>
                      <option value="range">تحديد تاريخ مخصص</option>
                    </select>
                  </div>

                  {dateFilterType === "month" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">اختر الشهر المالي</label>
                      <input
                        type="month"
                        value={filterMonth}
                        onChange={(e) => { setFilterMonth(e.target.value); setShowReportResult(false); }}
                        className={`w-full p-2.5 rounded-xl text-xs font-medium border outline-none ${
                          isDarkMode ? "bg-[#1a365d] border-slate-700 text-white" : "bg-white border-slate-200"
                        }`}
                      />
                    </div>
                  )}

                  {dateFilterType === "range" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">من تاريخ</label>
                        <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setShowReportResult(false); }} className="w-full p-2.5 rounded-xl text-xs border" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">إلى تاريخ</label>
                        <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setShowReportResult(false); }} className="w-full p-2.5 rounded-xl text-xs border" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowReportResult(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    بدء البحث وتوليد التقرير
                  </button>
                </div>
              </div>
            </div>

            {/* 🖨️ مستند التقرير المعزول والجاهز للطباعة فوراً */}
            {showReportResult && (
              <div className="space-y-4 p-4 md:p-8 bg-white text-black border border-slate-300 rounded-2xl shadow-xl print:shadow-none print:border-none print:p-0">
                
                {/* أزرار الإجراءات - تختفي كلياً عند سحب الورقة من الطابعة */}
                <div className="print:hidden flex justify-between items-center border-b pb-4 border-slate-200 mb-4">
                  <span className="text-xs text-amber-600 font-bold bg-amber-50 p-2 rounded-lg border border-amber-200">⚠️ جاهز للطباعة: سيتم عزل الأزرار الحالية تلقائياً من المستند الورقي.</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.print()}
                      className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Printer size={14} /> طباعة التقرير الفورية
                    </button>
                  </div>
                </div>

                {/* 📄 الهيدر الرسمي المعتمد للتقرير المعزول */}
                <div className="w-full flex justify-between items-center border-b-2 border-black pb-4 mb-6">
                  <div className="text-right">
                    <h2 className="text-xl font-bold">وادي دفا للمقاولات</h2>
                    <p className="text-sm font-semibold text-slate-700 mt-0.5">قسم الصيانة</p>
                  </div>
                  <div className="w-16 h-16 border border-slate-300 p-0.5 rounded-lg">
                    <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                </div>

                {/* عنوان التقرير الديناميكي المكتوب بوقار */}
                <div className="text-center my-6">
                  <h3 className="text-base font-bold underline bg-slate-100 py-2 rounded-lg tracking-wide">{getReportTitle()}</h3>
                  <p className="text-[10px] text-slate-500 mt-2">تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')} م</p>
                </div>

                {/* جدول تقرير الصيانة مع مرونة الصفوف واستيعاب النصوص الطويلة */}
                <div className="border border-black rounded-lg overflow-hidden">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="text-xs bg-slate-900 text-white font-bold border-b border-black">
                        <th className="p-3 border-l border-black">رقم الأورنيك</th>
                        <th className="p-3 border-l border-black">الآلية الكودية</th>
                        <th className="p-3 border-l border-black">السائق المسؤول</th>
                        <th className="p-3 border-l border-black">نوع الإجراء</th>
                        <th className="p-3 border-l border-black w-1/3">التفاصيل الفنية والأعراض</th>
                        <th className="p-3 border-l border-black">تاريخ الدخول</th>
                        <th className="p-3">حالة الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black text-xs font-medium">
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">لا توجد سجلات حركة أو بلاغات صيانة مطابقة للخيارات المحددة.</td>
                        </tr>
                      ) : (
                        filteredLogs.map(log => {
                          const eq = equipmentList.find(e => e.id === log.equipmentId);
                          return (
                            <tr key={log.id} className="align-top page-break-inside-avoid">
                              <td className="p-3 border-l border-black font-mono">#00{log.id}</td>
                              <td className="p-3 border-l border-black">
                                <div className="font-bold text-black">{eq?.name || "—"}</div>
                                <span className="font-mono text-blue-700 font-bold text-[11px]">{eq?.code || "—"}</span>
                              </td>
                              <td className="p-3 border-l border-black text-slate-800">{log.driverAtFault}</td>
                              <td className="p-3 border-l border-black"><span className="font-bold">{log.maintenanceType}</span></td>
                              
                              {/* خلايا مرنة مبرمجة لاستيعاب السطور الطويلة دون تشويه أو قطع */}
                              <td className="p-3 border-l border-black text-slate-800 whitespace-normal break-words leading-relaxed">
                                {log.details || "—"}
                              </td>
                              
                              <td className="p-3 border-l border-black font-mono">{new Date(log.entryDate).toLocaleDateString('ar-EG')}</td>
                              <td className="p-3 font-bold">
                                {log.exitDate ? (
                                  <span className="text-emerald-700">جاهزة للعمل ({new Date(log.exitDate).toLocaleDateString('ar-EG')})</span>
                                ) : (
                                  <span className="text-amber-700">داخل الورشة حالياً</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* الفوتر الرسمي للتوقيع في التقرير الورقي المطبوع */}
                <div className="mt-12 pt-8 border-t border-dotted border-slate-400 grid grid-cols-2 text-xs font-bold text-slate-700">
                  <p>توقيع مهندس قسم الصيانة: ............................</p>
                  <p className="text-left">اعتماد مدير الإدارة: ............................</p>
                </div>

              </div>
            )}
          </div>
        )}
      </main>

      {/* 👤 مودال الملف الشخصي والأمان الشامل (إضافة مشرفين وسوبر أدمن) */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border ${isDarkMode ? "bg-[#112240] border-slate-800 text-white" : "bg-white text-slate-800"}`}>
            <div className="bg-blue-900 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <User size={18} />
                <h3 className="font-bold text-sm">بوابة الملف الشخصي والأمان الرقمي</h3>
              </div>
              <button onClick={() => setIsProfileModalOpen(false)} className="p-1 rounded-lg hover:bg-white/10"><X size={18} /></button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* قسم المعلومات الشخصية */}
              <div className="space-y-2 border-b pb-4 border-slate-500/10">
                <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider">المعلومات الشخصية الحالية</h4>
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-500/5 p-3 rounded-xl">
                  <div>
                    <span className="text-slate-400 block mb-0.5">الاسم الكامل</span>
                    <p className="font-bold">{user.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">صلاحية النظام</span>
                    <p className="font-mono text-blue-400 font-bold">{user.role === "super_admin" ? "مدير نظام (Super Admin)" : "مشرف رئيسي"}</p>
                  </div>
                </div>
              </div>

              {/* قسم تغيير كلمة المرور */}
              <div className="space-y-3 border-b pb-4 border-slate-500/10">
                <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider">تأمين الحساب وتغيير كلمة المرور</h4>
                <form onSubmit={handlePasswordChange} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input 
                        type="password" 
                        required 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="كلمة المرور الجديدة" 
                        className="w-full p-2.5 bg-slate-500/5 border rounded-lg text-xs outline-none" 
                      />
                    </div>
                    <div>
                      <input 
                        type="password" 
                        required 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="تأكيد كلمة المرور" 
                        className="w-full p-2.5 bg-slate-500/5 border rounded-lg text-xs outline-none" 
                      />
                    </div>
                  </div>
                  <button type="submit" className="bg-slate-800 text-white hover:bg-slate-900 px-4 py-2 rounded-lg text-xs font-bold transition-all">تحديث كلمة السر</button>
                </form>
              </div>

              {/* قسم إضافة مشرف جديد - صلاحية السوبر أدمن فقط */}
              {user.role === "super_admin" && (
                <div className="space-y-3 border-b pb-4 border-slate-500/10 bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
                  <div className="flex items-center gap-1.5 text-blue-500">
                    <ShieldAlert size={14} />
                    <h4 className="text-xs font-bold uppercase tracking-wider">صلاحيات الإدارة (تسجيل مشرف جديد)</h4>
                  </div>
                  <form onSubmit={handleAddSupervisor} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input 
                        type="text" 
                        required 
                        value={supName}
                        onChange={(e) => setSupName(e.target.value)}
                        placeholder="اسم المشرف الكامل" 
                        className="w-full p-2.5 bg-transparent border border-slate-400/30 rounded-lg text-xs outline-none" 
                      />
                      <input 
                        type="text" 
                        required 
                        value={supUsername}
                        onChange={(e) => setSupUsername(e.target.value)}
                        placeholder="اسم المستخدم للدخول" 
                        className="w-full p-2.5 bg-transparent border border-slate-400/30 rounded-lg text-xs outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">نوع صلاحية المشرف</label>
                      <select
                        value={supRole}
                        onChange={(e) => setSupRole(e.target.value)}
                        className="w-full p-2 bg-slate-800 text-white rounded-lg text-xs outline-none font-medium"
                      >
                        <option value="main_supervisor">مشرف رئيسي (إدخال وإصلاح صيانة)</option>
                        <option value="read_only">مشرف قراءة ساي (استعراض وتقارير فقط)</option>
                      </select>
                    </div>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md">تأكيد صلاحية المشرف</button>
                  </form>
                </div>
              )}

              {/* زر تسجيل الخروج الرسمي داخل البروفايل */}
              <div className="pt-2">
                <button
                  onClick={() => { setIsProfileModalOpen(false); onLogout(); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                >
                  <LogOut size={14} />
                  <span>تسجيل الخروج الآمن من النظام</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📥 مودال تسجيل آلية جديدة */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border ${isDarkMode ? "bg-[#112240] border-slate-800 text-white" : "bg-white text-slate-800"}`}>
            <div className="bg-blue-900 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">تسجيل آلية جديدة بالأسطول</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg hover:bg-white/10"><X size={18} /></button>
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
                <button type="submit" disabled={addLoading} className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm transition-all">{addLoading ? "جاري الحفظ..." : "تأكيد وإضافة"}</button>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2.5 bg-slate-500/10 text-slate-400 rounded-xl text-sm">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📥 أورنيك دخول الورشة (معلومات الصيانة فقط بدون صور) */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border ${isDarkMode ? "bg-[#112240] border-slate-800 text-white" : "bg-white text-slate-800"}`}>
            <div className="bg-amber-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">أورنيك حركة جديد (دخول صيانة)</h3>
              <button onClick={() => setIsMaintenanceModalOpen(false)} className="p-1 rounded-lg hover:bg-white/10"><X size={18} /></button>
            </div>
            <form onSubmit={handleEnterMaintenance} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">نوع بلاغ دخول الورشة</label>
                <select
                  value={maintenanceType}
                  onChange={(e) => setMaintenanceType(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-sm border bg-transparent outline-none font-medium"
                >
                  <option value="صيانة عطل طارئ">إصلاح عطل طارئ (ميكانيكا/كهرباء)</option>
                  <option value="صيانة دورية">صيانة دورية (زيوت وفلاتر)</option>
                  <option value="خارج الخدمة">إيقاف كلي عن الخدمة (حادث جسيم)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">أعراض العطل والقطع المطلوبة</label>
                <textarea rows={4} required value={details} onChange={(e) => setDetails(e.target.value)} placeholder="اكتب تفاصيل فحص الورشة بدقة هنا..." className="w-full px-3 py-2 bg-slate-500/5 border rounded-xl text-sm outline-none leading-relaxed" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-amber-600 text-white font-semibold rounded-xl text-sm transition-all">إرسال لملف الورشة</button>
                <button type="button" onClick={() => setIsMaintenanceModalOpen(false)} className="px-4 py-2.5 bg-slate-500/10 text-slate-400 rounded-xl text-sm">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🗂️ بروفايل المعدة المنبثق الفخم (تعديل البيانات + 3 صور قابلة للاستبدال) */}
      {selectedEquipmentProfile && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className={`w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border ${
            isDarkMode ? "bg-[#112240] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
          }`}>
            
            <div className="p-5 bg-slate-500/5 border-b border-slate-500/10 flex justify-between items-center">
              <div>
                <span className="text-xs font-mono font-bold text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-md">{selectedEquipmentProfile.code}</span>
                <h3 className="font-bold text-lg mt-1">{selectedEquipmentProfile.name}</h3>
              </div>
              <button onClick={() => setSelectedEquipmentProfile(null)} className="p-1.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20"><X size={18} /></button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
              
              {/* القسم الأيمن: البيانات الفنية وتعديل البروفايل */}
              <div className="space-y-4 md:border-l md:border-slate-500/10 md:pl-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider">الملف التعريفي الفني</h4>
                  {user.role === "super_admin" && (
                    <button
                      onClick={() => setIsEditMode(!isEditMode)}
                      className="text-xs text-amber-500 underline font-semibold hover:text-amber-600 flex items-center gap-1"
                    >
                      <Edit3 size={12} /> {isEditMode ? "إلغاء التعديل" : "تعديل الملف"}
                    </button>
                  )}
                </div>

                {!isEditMode ? (
                  <div className="space-y-3 text-xs bg-slate-500/5 p-4 rounded-xl">
                    <div>
                      <span className="text-slate-400 block mb-0.5">سنة الصنع والموديل</span>
                      <p className="font-semibold text-sm">{selectedEquipmentProfile.model || "غير مسجل"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">رقم اللوحة المرورية</span>
                      <p className="font-mono font-semibold text-sm">{selectedEquipmentProfile.plateNumber || "—"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">السائق المعتمد حالياً</span>
                      <p className="font-semibold text-sm">{selectedEquipmentProfile.currentDriver}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">حالة الحركة بالنظام</span>
                      <p className="font-bold text-blue-500 text-sm">
                        {selectedEquipmentProfile.status === "available" ? "جاهزة للعمل" : selectedEquipmentProfile.status === "in_maintenance" ? "داخل الورشة" : "خارج الخدمة"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateEquipmentProfile} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 mb-1">كود الآلية</label>
                        <input type="text" required value={editCode} onChange={(e) => setEditCode(e.target.value)} className="w-full p-2 bg-slate-500/10 border rounded-lg font-mono outline-none" />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">اسم المعدة</label>
                        <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-2 bg-slate-500/10 border rounded-lg outline-none" />
                      </div>
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
                      <input type="text" required value={editDriver} onChange={(e) => setEditDriver(e.target.value)} className="w-full p-2 bg-slate-500/10 border rounded-lg outline-none" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">الحالة البرمجية</label>
                      <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)} className="w-full p-2 bg-slate-800 text-white rounded-lg outline-none">
                        <option value="available">متاحة وجاهزة للعمل</option>
                        <option value="in_maintenance">داخل الورشة للصيانة</option>
                        <option value="out_of_service">خارج الخدمة طارئ</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all">حفظ وتأيثيق البيانات</button>
                  </form>
                )}
              </div>

              {/* القسم الأيسر: إدارة الصور الثلاثة للمعدة (قابلة للاستبدال والتوثيق) */}
              <div className="space-y-4 flex flex-col justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">التوثيق الفوتوغرافي للمعدة (3 صور)</h4>
                
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((idx) => {
                    const currentImg = idx === 1 ? img1 : idx === 2 ? img2 : img3;
                    return (
                      <div key={idx} className="relative group border border-dashed border-slate-500/30 rounded-xl h-28 overflow-hidden bg-slate-500/5 flex flex-col items-center justify-center p-1 text-center">
                        {currentImg ? (
                          <img src={currentImg} alt={`وثيقة ${idx}`} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="text-slate-400 flex flex-col items-center gap-1">
                            <ImageIcon size={20} />
                            <span className="text-[9px]">صورة {idx}</span>
                          </div>
                        )}
                        {isEditMode && (
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold cursor-pointer rounded-xl transition-all">
                            <span>استبدال</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(idx, e)} />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* الأرشيف الصغير بداخل المودال */}
                <div className="mt-4 pt-4 border-t border-slate-500/10 flex-1">
                  <h5 className="text-[11px] font-bold text-slate-400 mb-2">آخر فحص فني بالورشة</h5>
                  {maintenanceLogs.filter(l => l.equipmentId === selectedEquipmentProfile.id).length === 0 ? (
                    <p className="text-[11px] text-slate-400 bg-slate-500/5 p-3 rounded-lg text-center">السجل نظيف تماماً لهذه الآلية.</p>
                  ) : (
                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs space-y-1">
                      <p className="font-bold text-amber-600">{maintenanceLogs.filter(l => l.equipmentId === selectedEquipmentProfile.id)[0].maintenanceType}</p>
                      <p className="text-slate-400 text-[11px] max-h-16 overflow-y-auto leading-relaxed">{maintenanceLogs.filter(l => l.equipmentId === selectedEquipmentProfile.id)[0].details}</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="p-4 bg-slate-500/5 border-t border-slate-500/10 flex justify-end gap-2">
              {user.role === "super_admin" && selectedEquipmentProfile.status !== "available" && (
                <button
                  onClick={() => handleExitMaintenance(selectedEquipmentProfile.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
                >
                  إصلاح فوري وإعادتها للخدمة
                </button>
              )}
              <button onClick={() => setSelectedEquipmentProfile(null)} className="px-4 py-2 bg-slate-500/10 text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-500/20">إغلاق</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
