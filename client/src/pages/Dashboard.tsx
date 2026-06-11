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
  Edit3,
  Image as ImageIcon,
  ChevronLeft,
  SlidersHorizontal,
  Info
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
  images?: string[]; // مصفوفة لـ 3 صور
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
  // 1. حالات التصميم والتبويبات
  const [activeTab, setActiveTab] = useState<"fleet" | "reports">("fleet");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("wadi_dafa_theme") === "dark";
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 2. داتا السيستم لايف
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  // 3. فلاتر التفتيش المتقدمة (الحركة والتقارير)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEquipmentFilter, setSelectedEquipmentFilter] = useState<string>("all");
  const [dateFilterType, setDateFilterType] = useState<"all" | "month" | "range">("all");
  const [filterMonth, setFilterMonth] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 4. الحالات المودال (إضافة آلية / دخول صيانة)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);

  // 5. حقول فورم الإضافة
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [model, setModel] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [currentDriver, setCurrentDriver] = useState("");
  const [maintenanceType, setMaintenanceType] = useState("صيانة عطل طارئ");
  const [details, setDetails] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // 6. بروفايل المعدة والتعديل (الدرج الجانبي Drawer)
  const [selectedEquipmentProfile, setSelectedEquipmentProfile] = useState<Equipment | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editPlateNumber, setEditPlateNumber] = useState("");
  const [editDriver, setEditDriver] = useState("");
  const [editStatus, setEditStatus] = useState<"available" | "in_maintenance" | "out_of_service">("available");

  const baseUrl = import.meta.env.VITE_API_URL || "";

  // جلب البيانات من السيرفر
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
      console.error("خطأ في الاتصال بقاعدة البيانات نيون:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [baseUrl]);

  // تبديل الثيم المظلم والمضيء
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    localStorage.setItem("wadi_dafa_theme", !isDarkMode ? "dark" : "light");
  };

  // إضافة آلية جديدة
  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !currentDriver) {
      alert("الرجاء ملء الحقول الأساسية: اسم المعدة، الكود، والسائق");
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
        setIsAddModalOpen(false);
        setName(""); setCode(""); setModel(""); setPlateNumber(""); setCurrentDriver("");
        fetchData();
      } else {
        alert(data.message || "فشل تسجيل الآلية");
      }
    } catch (err) {
      alert("خطأ في الاتصال بالسيرفر");
    } finally {
      setAddLoading(false);
    }
  };

  // فتح أورنيك حركة الصيانة الموحد (دخول صيانة)
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
      } else {
        const d = await response.json();
        alert(d.message || "فشل التحديث");
      }
    } catch (err) {
      alert("خطأ اتصال");
    }
  };

  // إنهاء الصيانة وإعادتها للخدمة جاهزة
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
      if (selectedEquipmentProfile?.id === equipmentId) {
        setSelectedEquipmentProfile(null);
      }
    } catch (err) {
      alert("خطأ أثناء إخراج المعدة");
    }
  };

  // حفظ التعديلات الكلية للمعدة من داخل البروفايل الخاص بها
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
      } else {
        alert("فشل تحديث بيانات البروفايل");
      }
    } catch (err) {
      alert("خطأ في الاتصال");
    }
  };

  // فتح بروفايل المعدة وتجهيز بيانات التعديل التلقائي
  const openProfileDrawer = (eq: Equipment) => {
    setSelectedEquipmentProfile(eq);
    setEditName(eq.name);
    setEditCode(eq.code);
    setEditModel(eq.model || "");
    setEditPlateNumber(eq.plateNumber || "");
    setEditDriver(eq.currentDriver);
    setEditStatus(eq.status);
    setIsEditMode(false);
  };

  // تصفية أسطول الآليات لايف بحسب محرك البحث السريع
  const filteredEquipment = equipmentList.filter(eq => 
    eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    eq.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    eq.currentDriver.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // تصفية السجلات والتقارير بحسب الخيارات المتقدمة والأشهر والمعدة الواحدة
  const filteredLogs = maintenanceLogs.filter(log => {
    const eq = equipmentList.find(e => e.id === log.equipmentId);
    
    // 1. فلترة حسب المعدة الواحدة
    if (selectedEquipmentFilter !== "all" && log.equipmentId.toString() !== selectedEquipmentFilter) {
      return false;
    }

    // 2. فلترة حسب البحث النصي
    if (searchQuery) {
      const matchText = (eq?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (eq?.code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                        log.driverAtFault.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchText) return false;
    }

    // 3. فلترة التواريخ والأشهر الذكية
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

  // دالة استخراج وتصدير ملف Excel متناسق تماماً بالعربية RTL
  const handleExportExcel = () => {
    let csvContent = "\uFEFF"; // إلحاق الـ BOM لضمان قراءة الإكسل للغة العربية دون رموز مشوهة
    csvContent += "رقم الأورنيك,كود الآلية,اسم المعدة,السائق المسؤول وقت العطل,نوع الحركة والصيانة,تفاصيل بلاغ الورشة,تاريخ الدخول,تاريخ الجاهزية والخروج\n";

    filteredLogs.forEach(log => {
      const eq = equipmentList.find(e => e.id === log.equipmentId);
      const eqName = eq ? eq.name.replace(/,/g, " ") : `معدة #${log.equipmentId}`;
      const eqCode = eq ? eq.code.replace(/,/g, " ") : "—";
      const driver = log.driverAtFault.replace(/,/g, " ");
      const type = log.maintenanceType.replace(/,/g, " ");
      const det = log.details ? log.details.replace(/,/g, " ").replace(/\n/g, " ") : "لا توجد تفاصيل";
      const entryStr = new Date(log.entryDate).toLocaleString("ar-EG");
      const exitStr = log.exitDate ? new Date(log.exitDate).toLocaleString("ar-EG") : "قيد الإصلاح بالورشة";

      csvContent += `${log.id},${eqCode},${eqName},${driver},${type},${det},${entryStr},${exitStr}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقارير_أسطول_وادي_دفا_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // حساب العدادات الكلية
  const total = equipmentList.length;
  const available = equipmentList.filter(e => e.status === "available").length;
  const inMaintenance = equipmentList.filter(e => e.status === "in_maintenance").length;
  const outOfService = equipmentList.filter(e => e.status === "out_of_service").length;

  return (
    <div className={`min-h-screen font-sans flex ${isDarkMode ? "bg-[#0b132b] text-slate-100" : "bg-[#f4f6f9] text-slate-800"}`} dir="rtl">
      
      {/* 🧭 شريط التنقل الجانبي الاحترافي العالمي (Sidebar) */}
      <aside className={`w-72 flex flex-col shrink-0 transition-all duration-300 border-l ${
        isDarkMode ? "bg-[#112240] border-slate-800" : "bg-white border-slate-200"
      } ${sidebarOpen ? "translate-x-0" : "translate-x-full hidden"}`}>
        
        {/* هيدر الشعار الملكي */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-500/10 bg-[#0A192F] text-white">
          <div className="bg-[#1e3a8a] text-white px-3 py-1.5 rounded-xl font-extrabold text-2xl tracking-wider shadow-md">
            دفا
          </div>
          <div>
            <h1 className="font-black text-base tracking-tight">نظام وادي دفا الذكي</h1>
            <p className="text-[10px] text-blue-300 font-medium">مراقبة الأسطول وأرانيك الحركة</p>
          </div>
        </div>

        {/* بروفايل المشرف المسؤول */}
        <div className="p-4 mx-4 my-3 rounded-2xl bg-slate-500/5 border border-slate-500/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1e3a8a] flex items-center justify-center text-white font-bold shadow-inner">
            {user.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold truncate">{user.name}</h4>
            <span className="text-[10px] text-amber-500 font-bold block mt-0.5">
              {user.role === "super_admin" ? "👑 مشرف عام النظام" : "👀 مراقب"}
            </span>
          </div>
        </div>

        {/* عناصر القائمة الجانبية */}
        <nav className="flex-1 px-4 py-3 space-y-1">
          <button
            onClick={() => setActiveTab("fleet")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "fleet" 
                ? "bg-[#1e3a8a] text-white shadow-lg shadow-blue-900/20" 
                : "text-slate-400 hover:bg-slate-500/5 hover:text-slate-200"
            }`}
          >
            <Truck size={18} />
            <span>كشف ومتابعة الآليات</span>
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "reports" 
                ? "bg-[#1e3a8a] text-white shadow-lg shadow-blue-900/20" 
                : "text-slate-400 hover:bg-slate-500/5 hover:text-slate-200"
            }`}
          >
            <FileText size={18} />
            <div className="flex justify-between items-center w-full">
              <span>أرانيك وتقارير الصيانة</span>
              <span className="text-[11px] bg-slate-500/20 px-2 py-0.5 rounded-full font-bold">{maintenanceLogs.length}</span>
            </div>
          </button>
        </nav>

        {/* القائمة السفلية: تبديل الوضع والخروج */}
        <div className="p-4 border-t border-slate-500/10 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-500/5 hover:bg-slate-500/10 transition-all"
          >
            <div className="flex items-center gap-2">
              {isDarkMode ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} className="text-indigo-600" />}
              <span>{isDarkMode ? "الوضع المضيء" : "الوضع الداكن الليلى"}</span>
            </div>
            <span className="text-[10px] bg-slate-500/20 px-1.5 py-0.5 rounded text-slate-400">تفعيل</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white transition-all shadow-sm"
          >
            <LogOut size={16} />
            <span>تسجيل الخروج الآمن</span>
          </button>
        </div>
      </aside>

      {/* 🖥️ مساحة المحتوى الكلي المتقدم */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* توب بار الموبايل والهيدر المصغر */}
        <header className={`p-4 flex justify-between items-center border-b md:px-8 ${
          isDarkMode ? "bg-[#112240]/50 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 transition-all text-sm font-bold"
            >
              📊 القائمة
            </button>
            <h2 className="text-base font-black tracking-tight">
              {activeTab === "fleet" ? "لوحة التحكم الحية في حركة الآليات" : "مركز الفلترة واستخراج أرشيف التقارير"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-mono text-slate-400 font-bold">اتصال آمن بنبض نيون لايف</span>
          </div>
        </header>

        <div className="p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* 💎 كروت الإحصائيات الفخمة ذات الأشرطة النسبية */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${
              isDarkMode ? "bg-[#112240] border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-400">إجمالي الأسطول</p>
                  <p className="text-3xl font-black mt-2 font-mono tracking-tight">{total}</p>
                </div>
                <div className="p-3 bg-blue-600/10 text-blue-500 rounded-xl"><Truck size={22} /></div>
              </div>
              <div className="w-full bg-slate-500/10 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-blue-600 h-full w-full"></div>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${
              isDarkMode ? "bg-[#112240] border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-emerald-500">متاح وجاهز ميدانياً</p>
                  <p className="text-3xl font-black mt-2 font-mono tracking-tight text-emerald-500">{available}</p>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><CheckCircle size={22} /></div>
              </div>
              <div className="w-full bg-slate-500/10 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: total ? `${(available/total)*100}%` : '0%' }}></div>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${
              isDarkMode ? "bg-[#112240] border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-amber-500">في ورشة الصيانة</p>
                  <p className="text-3xl font-black mt-2 font-mono tracking-tight text-amber-500">{inMaintenance}</p>
                </div>
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><Wrench size={22} /></div>
              </div>
              <div className="w-full bg-slate-500/10 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: total ? `${(inMaintenance/total)*100}%` : '0%' }}></div>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${
              isDarkMode ? "bg-[#112240] border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-red-500">خارج الخدمة طارئ</p>
                  <p className="text-3xl font-black mt-2 font-mono tracking-tight text-red-500">{outOfService}</p>
                </div>
                <div className="p-3 bg-red-500/10 text-red-500 rounded-xl"><AlertTriangle size={22} /></div>
              </div>
              <div className="w-full bg-slate-500/10 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-red-500 h-full" style={{ width: total ? `${(outOfService/total)*100}%` : '0%' }}></div>
              </div>
            </div>
          </div>

          {/* 🔍 شريط البحث الموحد والفلترة لتبويب الآليات */}
          {activeTab === "fleet" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                <div className="relative w-full sm:max-w-md">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="ابحث بكود الآلية الفريد، اسم السائق، أو نوع المعدة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pr-10 pl-4 py-2.5 rounded-xl text-sm font-semibold border focus:ring-2 focus:ring-blue-600 outline-none transition-all ${
                      isDarkMode ? "bg-[#112240] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                {user.role === "super_admin" && (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full sm:w-auto bg-[#1e3a8a] hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <Plus size={16} />
                    <span>تسجيل آلية جديدة بالكامل</span>
                  </button>
                )}
              </div>

              {/* 📊 جدول حركة الآليات الفخم - يدعم النقر لفتح البروفايل */}
              <div className={`rounded-2xl border shadow-sm overflow-hidden ${
                isDarkMode ? "bg-[#112240] border-slate-800" : "bg-white border-slate-200"
              }`}>
                <div className="p-4 border-b border-slate-500/10 bg-slate-500/5">
                  <p className="text-xs font-bold text-slate-400">تنبيه: اضغط على أي سطر لعرض ملف بروفايل المعدة وتعديل بياناتها وصورها الميدانية.</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className={`text-xs font-bold border-b border-slate-500/10 ${isDarkMode ? "text-slate-400 bg-slate-800/30" : "text-slate-500 bg-slate-50"}`}>
                        <th className="p-4">كود الآلية المميز</th>
                        <th className="p-4">اسم المعدة والموديل</th>
                        <th className="p-4">رقم اللوحة</th>
                        <th className="p-4">السائق الميداني</th>
                        <th className="p-4">حالة التشغيل الحالية</th>
                        {user.role === "super_admin" && <th className="p-4 text-center">حركة الورشة الموحدة</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-500/10 text-sm font-semibold">
                      {filteredEquipment.map(eq => (
                        <tr 
                          key={eq.id} 
                          onClick={() => openProfileDrawer(eq)}
                          className="hover:bg-slate-500/5 transition-all cursor-pointer group"
                        >
                          <td className="p-4 font-mono text-[#1e3a8a] font-black group-hover:underline">{eq.code}</td>
                          <td className="p-4">
                            <div className="font-bold">{eq.name}</div>
                            <span className="text-[11px] text-slate-400 font-medium">{eq.model || "لم يحدد"}</span>
                          </td>
                          <td className="p-4 font-mono text-slate-400">{eq.plateNumber || "—"}</td>
                          <td className="p-4 text-slate-400">👤 {eq.currentDriver}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              eq.status === "available" ? "bg-emerald-500/10 text-emerald-500" :
                              eq.status === "in_maintenance" ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                eq.status === "available" ? "bg-emerald-500" :
                                eq.status === "in_maintenance" ? "bg-amber-500" : "bg-red-500"
                              }`}></span>
                              {eq.status === "available" ? "جاهزة ومتاحة" : eq.status === "in_maintenance" ? "في الورشة" : "خارج الخدمة"}
                            </span>
                          </td>
                          {user.role === "super_admin" && (
                            <td className="p-4 onClick-stop" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-center gap-1.5">
                                {eq.status !== "available" ? (
                                  <button
                                    onClick={() => handleExitMaintenance(eq.id)}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                                  >
                                    إصلاح وتشغيل جاهز
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => { setSelectedEquipmentId(eq.id); setMaintenanceType("صيانة عطل طارئ"); setIsMaintenanceModalOpen(true); }}
                                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
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

          {/* 🛠️ التبويب الثاني: الفلاتر المتقدمة والتقارير الشاملة واستخراج ملف الإكسل */}
          {activeTab === "reports" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* لوحة تحكم الفلاتر المتقدمة المخصصة لمشرفي الحركة */}
              <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${
                isDarkMode ? "bg-[#112240] border-slate-800" : "bg-white border-slate-200"
              }`}>
                <div className="flex items-center gap-2 text-slate-400 pb-2 border-b border-slate-500/10">
                  <SlidersHorizontal size={16} />
                  <h3 className="text-xs font-bold uppercase tracking-wider">لوحة الفلترة والتقارير المركزة بالتواريخ</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* 1. فلتر حسب آلية محددة أو الكل */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">تقرير لمعدة واحدة محددة</label>
                    <select
                      value={selectedEquipmentFilter}
                      onChange={(e) => setSelectedEquipmentFilter(e.target.value)}
                      className={`w-full p-2 rounded-xl text-xs font-bold border outline-none ${
                        isDarkMode ? "bg-[#1a365d] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    >
                      <option value="all">📊 تقرير شامل لكافة آليات الأسطول</option>
                      {equipmentList.map(e => (
                        <option key={e.id} value={e.id.toString()}>{e.name} ({e.code})</option>
                      ))}
                    </select>
                  </div>

                  {/* 2. نوع حصر النطاق الزمني */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">نطاق التوثيق المالي والزمني</label>
                    <select
                      value={dateFilterType}
                      onChange={(e) => setDateFilterType(e.target.value as any)}
                      className={`w-full p-2 rounded-xl text-xs font-bold border outline-none ${
                        isDarkMode ? "bg-[#1a365d] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    >
                      <option value="all">🗓️ تقرير شامل منذ إطلاق النظام</option>
                      <option value="month">📅 حصر شهري محدد</option>
                      <option value="range">⏳ تخصيص تاريخ بداية ونهاية</option>
                    </select>
                  </div>

                  {/* 3. الخيارات المشروطة للتواريخ */}
                  {dateFilterType === "month" && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 font-sans">اختر الشهر المستهدف</label>
                      <input
                        type="month"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className={`w-full p-2 rounded-xl text-xs font-bold border outline-none font-mono ${
                          isDarkMode ? "bg-[#1a365d] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>
                  )}

                  {dateFilterType === "range" && (
                    <div className="grid grid-cols-2 gap-2 md:col-span-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">من تاريخ</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className={`w-full p-2 rounded-xl text-xs font-bold border outline-none font-mono ${
                            isDarkMode ? "bg-[#1a365d] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">إلى تاريخ</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className={`w-full p-2 rounded-xl text-xs font-bold border outline-none font-mono ${
                            isDarkMode ? "bg-[#1a365d] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* زر استخراج الإكسل الموثق بالعربية */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleExportExcel}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow shadow-emerald-900/30 transition-all"
                  >
                    <Download size={14} />
                    <span>تصدير ملف Excel المعتمد (RTL عربي)</span>
                  </button>
                </div>
              </div>

              {/* جدول عرض التقارير والأرانيك المصفاة */}
              <div className={`rounded-2xl border shadow-sm overflow-hidden ${
                isDarkMode ? "bg-[#112240] border-slate-800" : "bg-white border-slate-200"
              }`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className={`text-xs font-bold border-b border-slate-500/10 ${isDarkMode ? "text-slate-400 bg-slate-800/30" : "text-slate-500 bg-slate-50"}`}>
                        <th className="p-4">رقم الأورنيك</th>
                        <th className="p-4">الآلية الميدانية</th>
                        <th className="p-4">السائق الموثق وقت العطل</th>
                        <th className="p-4">نوع البلاغ</th>
                        <th className="p-4">تفاصيل البلاغ والقطع</th>
                        <th className="p-4">تاريخ الدخول</th>
                        <th className="p-4">حالة أورنيك الصيانة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-500/10 text-xs sm:text-sm font-semibold">
                      {filteredLogs.map(log => {
                        const eq = equipmentList.find(e => e.id === log.equipmentId);
                        return (
                          <tr key={log.id} className="hover:bg-slate-500/5 transition-all">
                            <td className="p-4 font-mono text-slate-400">#00{log.id}</td>
                            <td className="p-4">
                              <div className="font-bold text-slate-400">{eq?.name || `معدة #${log.equipmentId}`}</div>
                              <span className="text-[11px] font-mono text-[#1e3a8a]">{eq?.code || "—"}</span>
                            </td>
                            <td className="p-4 text-red-500">🚨 {log.driverAtFault}</td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 bg-slate-500/10 rounded text-xs">
                                {log.maintenanceType}
                              </span>
                            </td>
                            <td className="p-4 text-slate-400 max-w-xs truncate" title={log.details || ""}>{log.details || "لا توجد تفاصيل ملحقة"}</td>
                            <td className="p-4 font-mono text-[11px] text-slate-400">📅 {new Date(log.entryDate).toLocaleString('ar-EG')}</td>
                            <td className="p-4">
                              {log.exitDate ? (
                                <span className="text-emerald-500 text-[11px]">✅ خرجت: {new Date(log.exitDate).toLocaleDateString('ar-EG')}</span>
                              ) : (
                                <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse">🛠️ بالورشة</span>
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

      {/* 📥 المودال الاحترافي الأول: تسجيل آلية جديدة مع معرض صور ثلاثي معلق */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-2xl w-full max-w-lg border overflow-hidden animate-in zoom-in-95 duration-200 ${
            isDarkMode ? "bg-[#112240] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <div className="bg-[#1e3a8a] p-4 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><Plus size={18} /><span>تسجيل آلية جديدة بأسطول الميدان</span></h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddEquipment} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">كود الآلية الفريد (إجباري)*</label>
                  <input type="text" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="W.B.G 001" className="w-full px-3 py-2 bg-slate-500/5 border border-slate-500/20 rounded-xl text-left font-mono font-bold focus:ring-2 focus:ring-blue-600 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">اسم المعدة الكلي*</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="بوكلين كاتر بيلر" className="w-full px-3 py-2 bg-slate-500/5 border border-slate-500/20 rounded-xl font-semibold focus:ring-2 focus:ring-blue-600 outline-none text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">الموديل / سنة الصنع</label>
                  <input type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="2024" className="w-full px-3 py-2 bg-slate-500/5 border border-slate-500/20 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">رقم اللوحة المرورية</label>
                  <input type="text" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} placeholder="أ ب ج 1234" className="w-full px-3 py-2 bg-slate-500/5 border border-slate-500/20 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">السائق الميداني المسؤول حالياً*</label>
                <input type="text" required value={currentDriver} onChange={(e) => setCurrentDriver(e.target.value)} placeholder="اسم السائق الثلاثي كاملاً" className="w-full px-3 py-2 bg-slate-500/5 border border-slate-500/20 rounded-xl font-semibold focus:ring-2 focus:ring-blue-600 outline-none text-sm" />
              </div>

              {/* 🖼️ معرض الصور الثلاثي الميداني (Cloudinary Framework Slot) */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">إرفاق وتوثيق صور المعدة الثلاثية (جاهز للربط بكلاودنري)</label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="border border-dashed border-slate-500/30 rounded-xl p-3 flex flex-col items-center justify-center bg-slate-500/5 cursor-pointer hover:bg-slate-500/10 transition-all">
                    <ImageIcon size={18} className="text-slate-400" />
                    <span className="text-[9px] mt-1 text-slate-400 font-bold">صورة الواجهة</span>
                  </div>
                  <div className="border border-dashed border-slate-500/30 rounded-xl p-3 flex flex-col items-center justify-center bg-slate-500/5 cursor-pointer hover:bg-slate-500/10 transition-all">
                    <ImageIcon size={18} className="text-slate-400" />
                    <span className="text-[9px] mt-1 text-slate-400 font-bold">الزاوية الجانبية</span>
                  </div>
                  <div className="border border-dashed border-slate-500/30 rounded-xl p-3 flex flex-col items-center justify-center bg-slate-500/5 cursor-pointer hover:bg-slate-500/10 transition-all">
                    <ImageIcon size={18} className="text-slate-400" />
                    <span className="text-[9px] mt-1 text-slate-400 font-bold">صورة الخلفية</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button type="submit" disabled={addLoading} className="flex-1 py-3 bg-[#1e3a8a] text-white font-bold rounded-xl text-sm shadow disabled:opacity-50">{addLoading ? "جاري التوثيق..." : "تأكيد وتفعيل بالأسطول"}</button>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-3 bg-slate-500/10 text-slate-400 rounded-xl text-sm font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📥 المودال الاحترافي الثاني: دخول صيانة الموحد */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md border overflow-hidden animate-in zoom-in-95 duration-200 ${
            isDarkMode ? "bg-[#112240] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <div className="bg-amber-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><Wrench size={18} /><span>أورنيك صيانة وحركة جديد (دخول صيانة)</span></h3>
              <button onClick={() => setIsMaintenanceModalOpen(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleEnterMaintenance} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">نوع بلاغ دخول الورشة</label>
                <select
                  value={maintenanceType}
                  onChange={(e) => setMaintenanceType(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-sm font-bold border outline-none ${
                    isDarkMode ? "bg-[#1a365d] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <option value="صيانة عطل طارئ">إصلاح عطل طارئ (ميكانيكا/كهرباء)</option>
                  <option value="صيانة دورية">صيانة دورية روتينية (زيوت وفلاتر)</option>
                  <option value="خارج الخدمة">إيقاف كلي - خروج عن الخدمة (حادث/عطل جسيم)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">أعراض العطل والقطع المطلوبة</label>
                <textarea rows={4} required value={details} onChange={(e) => setDetails(e.target.value)} placeholder="اكتب تفاصيل الفحص الدقيقة والقطع المعطلة للمحافظة على الأصول..." className="w-full px-3 py-2 bg-slate-500/5 border border-slate-500/20 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none font-semibold" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-amber-600 text-white font-bold rounded-xl text-sm shadow">إرسال لملف الورشة لايف</button>
                <button type="button" onClick={() => setIsMaintenanceModalOpen(false)} className="px-4 py-2.5 bg-slate-500/10 text-slate-400 rounded-xl text-sm font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🗂️ الدرج الجانبي الفخم للغاية (Slide-over Asset Profile Drawer) لبروفايل المعدة وتعديل بياناتها */}
      {selectedEquipmentProfile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
          <div className={`w-full max-w-lg h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto border-r animate-in slide-in-from-left duration-300 ${
            isDarkMode ? "bg-[#0b132b] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
          }`}>
            
            {/* هيدر البروفايل */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-500/10 pb-4">
                <div className="flex items-center gap-2">
                  <Truck size={20} className="text-[#1e3a8a]" />
                  <div>
                    <h3 className="font-black text-base">{selectedEquipmentProfile.name}</h3>
                    <span className="text-xs font-mono font-bold bg-blue-500/10 px-2 py-0.5 rounded text-blue-500">{selectedEquipmentProfile.code}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedEquipmentProfile(null)}
                  className="p-1.5 rounded-lg bg-slate-500/10 hover:bg-slate-500/20"
                >
                  <X size={18} />
                </button>
              </div>

              {/* زر التبديل بين وضع العرض الفخم أو وضع التعديل الفوري للبيانات */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                    isEditMode ? "bg-amber-600 border-amber-600 text-white" : "bg-slate-500/5 border-slate-500/10 hover:bg-slate-500/10"
                  }`}
                >
                  <Edit3 size={14} />
                  <span>{isEditMode ? "العودة لوضع العرض" : "تعديل الملف والبيانات الحالية"}</span>
                </button>

                {selectedEquipmentProfile.status !== "available" && (
                  <button
                    onClick={() => handleExitMaintenance(selectedEquipmentProfile.id)}
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow"
                  >
                    إصلاح فوري جاهز
                  </button>
                )}
              </div>

              {/* وضع العرض الشامل الميداني (Display View) */}
              {!isEditMode ? (
                <div className="space-y-5 pt-2">
                  {/* قسم استعراض المعرض الميداني الثلاثي */}
                  <div className="bg-slate-500/5 p-3 rounded-2xl border border-slate-500/10">
                    <p className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1"><ImageIcon size={12}/><span>معرض الأصول المصور (الربط المظهري)</span></p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="aspect-video bg-slate-500/20 rounded-lg flex flex-col items-center justify-center text-slate-500"><span className="text-[9px] font-bold">صورة 1</span></div>
                      <div className="aspect-video bg-slate-500/20 rounded-lg flex flex-col items-center justify-center text-slate-500"><span className="text-[9px] font-bold">صورة 2</span></div>
                      <div className="aspect-video bg-slate-500/20 rounded-lg flex flex-col items-center justify-center text-slate-500"><span className="text-[9px] font-bold">صورة 3</span></div>
                    </div>
                  </div>

                  {/* تفاصيل كرت المعدة بطراز بطاقة الأصول العالمية */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-bold bg-slate-500/5 p-4 rounded-2xl border border-slate-500/10">
                    <div>
                      <span className="text-slate-400 block mb-0.5">سنة الصنع والموديل</span>
                      <p className="text-sm font-semibold">{selectedEquipmentProfile.model || "غير مسجل"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">رقم اللوحة المرورية</span>
                      <p className="text-sm font-mono tracking-wide">{selectedEquipmentProfile.plateNumber || "—"}</p>
                    </div>
                    <div className="col-span-2 border-t border-slate-500/10 pt-2">
                      <span className="text-slate-400 block mb-0.5">السائق الميداني المعتمد للآلية</span>
                      <p className="text-sm text-blue-500 font-bold">👤 {selectedEquipmentProfile.currentDriver}</p>
                    </div>
                  </div>

                  {/* أرشيف الصيانة والتاريخ الصغير الخاص بالمعدة المفتوحة حالياً */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1"><Info size={14}/><span>التاريخ الميداني وحسابات الورشة التابع للمعدة</span></h4>
                    <div className="max-h-56 overflow-y-auto space-y-1.5 divide-y divide-slate-500/5">
                      {maintenanceLogs.filter(l => l.equipmentId === selectedEquipmentProfile.id).length === 0 ? (
                        <p className="text-xs text-slate-400 p-4 text-center">لم تدخل الورشة مطلقاً، المعدة نظيفة وخالية من البلاغات الحرجية.</p>
                      ) : (
                        maintenanceLogs.filter(l => l.equipmentId === selectedEquipmentProfile.id).map(log => (
                          <div key={log.id} className="pt-2 text-xs">
                            <div className="flex justify-between font-bold">
                              <span className="text-red-500">🚨 سائق البلاغ: {log.driverAtFault}</span>
                              <span className="text-slate-400 font-mono text-[10px]">#{log.id}</span>
                            </div>
                            <p className="text-slate-400 font-medium my-0.5 text-[11px]">النوع: {log.maintenanceType} • {log.details}</p>
                            <span className="text-[10px] text-slate-500 font-mono">📅 دخول: {new Date(log.entryDate).toLocaleDateString('ar-EG')}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                
                /* وضع التعديل الفعلي التام (Edit View Form) بمطابقة نيون */
                <form onSubmit={handleUpdateEquipmentProfile} className="space-y-4 pt-2 text-xs font-bold">
                  <div>
                    <label className="block text-slate-400 mb-1">تحديث كود المعدة الفريد*</label>
                    <input type="text" required value={editCode} onChange={(e) => setEditCode(e.target.value)} className="w-full p-2 bg-slate-500/10 border border-slate-500/20 rounded-xl font-mono focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">اسم المعدة الإجمالي*</label>
                    <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-2 bg-slate-500/10 border border-slate-500/20 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1">الموديل</label>
                      <input type="text" value={editModel} onChange={(e) => setEditModel(e.target.value)} className="w-full p-2 bg-slate-500/10 border border-slate-500/20 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">رقم اللوحة</label>
                      <input type="text" value={editPlateNumber} onChange={(e) => setEditPlateNumber(e.target.value)} className="w-full p-2 bg-slate-500/10 border border-slate-500/20 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">السائق المسؤول الحالي بالميدان*</label>
                    <input type="text" required value={editDriver} onChange={(e) => setEditDriver(e.target.value)} className="w-full p-2 bg-slate-500/10 border border-slate-500/20 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">تعديل حالة المعدة برمجياً</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-500/10 border border-slate-500/20 rounded-xl text-xs font-bold outline-none"
                    >
                      <option value="available">available (جاهزة ومتاحة للعمل فوراً)</option>
                      <option value="in_maintenance">in_maintenance (داخل ورشة الصيانة)</option>
                      <option value="out_of_service">out_of_service (خارج الخدمة طارئ)</option>
                    </select>
                  </div>

                  {/* تعديل الصور الثلاثية */}
                  <div>
                    <label className="block text-slate-400 mb-1.5">تحديث الصور الثلاثية للأصل (Cloudinary UI)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="border border-dashed border-slate-500/30 rounded-lg p-2 text-center bg-slate-500/5 cursor-pointer text-[10px] text-slate-400">تغيير الواجهة</div>
                      <div className="border border-dashed border-slate-500/30 rounded-lg p-2 text-center bg-slate-500/5 cursor-pointer text-[10px] text-slate-400">تغيير الجانب</div>
                      <div className="border border-dashed border-slate-500/30 rounded-lg p-2 text-center bg-slate-500/5 cursor-pointer text-[10px] text-slate-400">تغيير الخلفية</div>
                    </div>
                  </div>

                  <button type="submit" className="w-full py-2.5 bg-amber-600 text-white rounded-xl font-bold text-xs shadow hover:bg-amber-700 transition-all">حفظ وإرسال التحديثات لـ نيون سحابياً</button>
                </form>
              )}
            </div>

            {/* الفوتر للدرج الجانبي */}
            <div className="border-t border-slate-500/10 pt-4 flex justify-end">
              <button 
                type="button" 
                onClick={() => setSelectedEquipmentProfile(null)}
                className="px-4 py-2 bg-slate-500/10 text-slate-400 rounded-xl text-xs font-bold"
              >
                إغلاق البروفايل
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
