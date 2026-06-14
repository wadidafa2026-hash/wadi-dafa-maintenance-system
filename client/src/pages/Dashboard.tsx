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
  DollarSign,
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
  type: "equipment" | "vehicle";
  serialNumber: string | null;
  plateNumber: string | null;
  status: "available" | "broken";
  currentProjectId: number | null;
  projectName: string | null;
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
  codeImageUrl?: string | null;
}

interface Project {
  id: number;
  name: string;
}

interface FinancialReport {
  logId: number;
  projectName: string;
  breakdownDate: string;
  repairDate: string | null;
  equipmentName: string;
  equipmentCode: string;
  equipmentType: "equipment" | "vehicle";
  serialNumber: string | null;
  plateNumber: string | null;
  items: { id: number; name: string; price: number }[];
  totalCost: number;
}

interface MaintenanceHistory {
  id: number;
  equipmentId: number;
  projectNameSnapshot: string;
  breakdownDate: string;
  repairDate: string | null;
  details: string | null;
  status: "broken" | "repaired";
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [currentView, setCurrentView] = useState<"home" | "fleet" | "reports">("home");
  const [reportTab, setReportTab] = useState<"operational" | "financial">("operational");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("wadi_dafa_theme") === "dark";
  });

  // التحكم في المودالات
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
  const [selectedLogIdForRepair, setSelectedLogIdForRepair] = useState<number | null>(null);

  // داتا الأسطول والمشاريع والتقارير المالية
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [financialReports, setFinancialReports] = useState<FinancialReport[]>([]);
  const [selectedEquipmentHistory, setSelectedEquipmentHistory] = useState<MaintenanceHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // الفلاتر والبحث
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEquipmentFilter, setSelectedEquipmentFilter] = useState<string>("all");
  const [dateFilterType, setDateFilterType] = useState<"all" | "month" | "range">("all");
  const [filterMonth, setFilterMonth] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showReportResult, setShowReportResult] = useState(false);

  // فورم إضافة آلية جديدة
  const [eqName, setEqName] = useState("");
  const [eqCode, setEqCode] = useState("");
  const [eqModel, setEqModel] = useState("");
  const [eqType, setEqType] = useState<"equipment" | "vehicle">("equipment");
  const [eqSerialNumber, setEqSerialNumber] = useState("");
  const [eqPlateNumber, setEqPlateNumber] = useState("");
  const [eqProjectId, setEqProjectId] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // أورنيك بلاغ عطل (تعطلت)
  const [breakdownDate, setBreakdownDate] = useState("");
  const [breakdownDetails, setBreakdownDetails] = useState("");

  // فورم الإصلاح والمشتريات الديناميكية (السطور)
  const [repairDate, setRepairDate] = useState("");
  const [purchaseItems, setPurchaseItems] = useState<{ itemName: string; price: number }[]>([
    { itemName: "", price: 0 }
  ]);

  // فورم بروفايل المعدة المنبثق والتحديث
  const [selectedEquipmentProfile, setSelectedEquipmentProfile] = useState<Equipment | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editSerialNumber, setEditSerialNumber] = useState("");
  const [editPlateNumber, setEditPlateNumber] = useState("");
  const [editProjectId, setEditProjectId] = useState("");
  const [editStatus, setEditStatus] = useState<"available" | "broken">("available");
  
  // لقطات الـ 3 صور
  const [imgFront, setImgFront] = useState<string | null>(null);
  const [imgBack, setImgBack] = useState<string | null>(null);
  const [imgCode, setImgCode] = useState<string | null>(null);

  // فورم الأمان والحسابات
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [supName, setSupName] = useState("");
  const [supUsername, setSupUsername] = useState("");
  const [supRole, setSupRole] = useState("main_supervisor");

  const baseUrl = import.meta.env.VITE_API_URL || "";

  const fetchData = async () => {
    setLoading(true);
    try {
      const eqRes = await fetch(`${baseUrl}/api/equipment`);
      setEquipmentList(await eqRes.json());

      const projRes = await fetch(`${baseUrl}/api/projects`);
      setProjectsList(await projRes.json());

      const finRes = await fetch(`${baseUrl}/api/purchases`);
      setFinancialReports(await finRes.json());
    } catch (err) {
      console.error("Error fetching application data:", err);
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

  // إدخال آلية جديدة بالكامل للباك إند
  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eqName || !eqCode || !eqType) return;
    setAddLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/equipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: eqName,
          code: eqCode,
          model: eqModel || null,
          type: eqType,
          serialNumber: eqType === "equipment" ? eqSerialNumber : null,
          plateNumber: eqType === "vehicle" ? eqPlateNumber : null,
          currentProjectId: eqProjectId ? Number(eqProjectId) : null,
          frontImageUrl: imgFront,
          backImageUrl: imgBack,
          codeImageUrl: imgCode
        }),
      });
      if (response.ok) {
        setIsAddModalOpen(false);
        setEqName(""); setEqCode(""); setEqModel(""); setEqSerialNumber(""); setEqPlateNumber(""); setEqProjectId("");
        setImgFront(null); setImgBack(null); setImgCode(null);
        fetchData();
      } else {
        const errData = await response.json();
        alert(errData.error || "فشل تسجيل الآلية");
      }
    } catch (err) {
      alert("خطأ في الاتصال بالسيرفر");
    } finally {
      setAddLoading(false);
    }
  };

  // تسجيل بلاغ العطل (زر تعطلت)
  const handleEnterMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipmentId || !breakdownDate) return;
    try {
      const response = await fetch(`${baseUrl}/api/maintenance/breakdown`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId: selectedEquipmentId,
          breakdownDate,
          details: breakdownDetails
        }),
      });
      if (response.ok) {
        setIsBreakdownModalOpen(false);
        setBreakdownDate("");
        setBreakdownDetails("");
        fetchData();
      }
    } catch (err) {
      alert("خطأ أثناء الاتصال بالورشة");
    }
  };

  // فتح مودال إغلاق البلاغ وتسجيل الفواتير
  const openRepairModal = (equipmentId: number) => {
    // العثور على العطل المفتوح المرتبط بهذه الآلية من التقارير المالية المتاحة
    const activeLog = financialReports.find(report => report.equipmentCode === equipmentList.find(e => e.id === equipmentId)?.code && !report.repairDate);
    if (activeLog) {
      setSelectedLogIdForRepair(activeLog.logId);
      setRepairDate(new Date().toISOString().split('T')[0]);
      setPurchaseItems([{ itemName: "", price: 0 }]);
      setIsRepairModalOpen(true);
    } else {
      alert("لم يتم العثور على بلاغ عطل نشط ومفتوح لهذه الآلية في النظام!");
    }
  };

  // إرسال تاريخ الإصلاح مع قائمة المشتريات والقطع المفتوحة
  const handleCloseMaintenanceWithPurchases = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLogIdForRepair || !repairDate) return;

    try {
      // 1. تحديث تاريخ الجاهزية وإغلاق البلاغ
      const repairRes = await fetch(`${baseUrl}/api/maintenance/repair/${selectedLogIdForRepair}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repairDate }),
      });

      if (!repairRes.ok) throw new Error("فشل إغلاق بلاغ العطل الفني");

      // 2. إذا وجد سطور فواتير حقيقية، أرسلها فوراً لجدول المشتريات الجماعي
      const validItems = purchaseItems.filter(item => item.itemName.trim() !== "" && item.price > 0);
      if (validItems.length > 0) {
        await fetch(`${baseUrl}/api/purchases`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            maintenanceLogId: selectedLogIdForRepair,
            items: validItems
          }),
        });
      }

      setIsRepairModalOpen(false);
      setSelectedEquipmentProfile(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء حفظ فواتير المشتريات والإصلاح");
    }
  };

  // إضافة سطر شراء جديد ديناميكياً
  const addPurchaseRow = () => {
    setPurchaseItems([...purchaseItems, { itemName: "", price: 0 }]);
  };

  // حذف سطر شراء معين
  const removePurchaseRow = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  // تحديث محتوى خلايا الفواتير المشتراة
  const updatePurchaseItem = (index: number, field: "itemName" | "price", value: string) => {
    const updated = [...purchaseItems];
    if (field === "price") {
      updated[index].price = Number(value);
    } else {
      updated[index].itemName = value;
    }
    setPurchaseItems(updated);
  };

  // تحديث البروفايل الفني الشامل للآلية
  const handleUpdateEquipmentProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipmentProfile) return;
    try {
      const response = await fetch(`${baseUrl}/api/equipment/${selectedEquipmentProfile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          code: editCode,
          model: editModel || null,
          serialNumber: selectedEquipmentProfile.type === "equipment" ? editSerialNumber : null,
          plateNumber: selectedEquipmentProfile.type === "vehicle" ? editPlateNumber : null,
          currentProjectId: editProjectId ? Number(editProjectId) : null,
          status: editStatus,
          frontImageUrl: imgFront,
          backImageUrl: imgBack,
          codeImageUrl: imgCode
        }),
      });
      if (response.ok) {
        setIsEditMode(false);
        setSelectedEquipmentProfile(null);
        fetchData();
      }
    } catch (err) {
      alert("خطأ أثناء تحديث البروفايل");
    }
  };

  // فتح ملف بروفايل الآلية المنبثق وجلب تاريخ الصيانة الخاص بها
  const openProfileDrawer = async (eq: Equipment) => {
    setSelectedEquipmentProfile(eq);
    setEditName(eq.name);
    setEditCode(eq.code);
    setEditModel(eq.model || "");
    setEditSerialNumber(eq.serialNumber || "");
    setEditPlateNumber(eq.plateNumber || "");
    setEditProjectId(eq.currentProjectId ? eq.currentProjectId.toString() : "");
    setEditStatus(eq.status);
    setImgFront(eq.frontImageUrl || null);
    setImgBack(eq.backImageUrl || null);
    setImgCode(eq.codeImageUrl || null);
    setIsEditMode(false);

    try {
      const res = await fetch(`${baseUrl}/api/maintenance/history/${eq.id}`);
      setSelectedEquipmentHistory(await res.json());
    } catch (err) {
      setSelectedEquipmentHistory([]);
    }
  };

  // تحويل الصور محلياً لـ DataURL للتخزين المؤقت والرفع
  const handleImageChange = (type: "front" | "back" | "code", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "front") setImgFront(reader.result as string);
        if (type === "back") setImgBack(reader.result as string);
        if (type === "code") setImgCode(reader.result as string);
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
    setNewPassword(""); setConfirmPassword("");
  };

  const handleAddSupervisor = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`تم تسجيل المشرف ${supName} بنجاح كـ ${supRole === "main_supervisor" ? "مشرف تشغيلي" : "مشرف قراءة"}`);
    setSupName(""); setSupUsername("");
  };

  const getReportTitle = () => {
    const typeLabel = reportTab === "operational" ? "التقرير التشغيلي وميدان الأعطال" : "التقرير المالي الكلي لفواتير المشتريات";
    if (selectedEquipmentFilter !== "all") {
      const eq = equipmentList.find(e => e.id.toString() === selectedEquipmentFilter);
      return `${typeLabel} للآلية برقم كود (${eq ? eq.code : ""})`;
    }
    if (dateFilterType === "month" && filterMonth) {
      const [year, month] = filterMonth.split("-");
      return `${typeLabel} لشهر مالي (${month} / ${year})`;
    }
    if (dateFilterType === "range" && startDate && endDate) {
      return `${typeLabel} للمدة من ${startDate} إلى ${endDate}`;
    }
    return `${typeLabel} الشامل - شركة وادي دفا`;
  };

  // تصفية أسطول الآليات بالبحث المعتمد على رقم الكود والنوع
  const filteredEquipment = equipmentList.filter(eq => 
    eq.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // تصفية السجلات للتقارير (عملياتية ومالية بالاعتماد على الباك إند الموحد)
  const filteredFinancialLogs = financialReports.filter(log => {
    if (selectedEquipmentFilter !== "all") {
      const targetCode = equipmentList.find(e => e.id.toString() === selectedEquipmentFilter)?.code;
      if (log.equipmentCode !== targetCode) return false;
    }
    
    const bDate = new Date(log.breakdownDate);
    if (dateFilterType === "month" && filterMonth) {
      const [year, month] = filterMonth.split("-");
      return bDate.getFullYear() === parseInt(year) && (bDate.getMonth() + 1) === parseInt(month);
    }
    if (dateFilterType === "range" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return bDate >= start && bDate <= end;
    }
    return true;
  });

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${isDarkMode ? "bg-[#0A192F] text-slate-100" : "bg-[#f8fafc] text-slate-800"}`} dir="rtl">
      
      {/* الهيدر الملكي */}
      <header className="print:hidden w-full sticky top-0 z-40 px-6 py-4 flex justify-between items-center bg-[#112240] text-white shadow-xl border-b border-blue-900/40">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-xl p-0.5 overflow-hidden shadow-md flex items-center justify-center">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">وادي دفا للمقاولات</h1>
            <p className="text-xs text-blue-400 font-medium">نظام متابعة حركة وصيانة الأسطول الفني</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-amber-400 transition-all"
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

      <main className={`flex-1 w-full max-w-7xl mx-auto p-6 md:p-8 relative ${!isDarkMode ? "bg-white" : ""}`}>
        
        {/* 1️⃣ الشاشة الرئيسية (Home View) */}
        {currentView === "home" && (
          <div className="h-full flex flex-col justify-center items-center py-20 space-y-12">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">بوابة الإدارة والمتابعة المركزية</h2>
              <p className="text-sm text-slate-400">اختر القسم لمباشرة فحص وجاهزية آليات المشاريع الحية</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl px-4">
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
                  <h3 className="text-lg font-bold mb-1">الأسطول والآليات الحية</h3>
                  <p className="text-xs text-slate-400">جرد المعدات والمركبات، فرز كود المشروع، تسجيل الأعطال وتحديث الملفات الفوتوغرافية.</p>
                </div>
              </button>

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
                  <h3 className="text-lg font-bold mb-1">التقارير وسجلات الفواتير المالية</h3>
                  <p className="text-xs text-slate-400">توليد تقارير الأداء الميداني ومشتريات قطع الغيار التفصيلية مع احتساب تلقائي للمصاريف.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 2️⃣ شاشة إدارة الآليات (Fleet View) */}
        {currentView === "fleet" && (
          <div className="space-y-6 print:hidden">
            <div className="flex justify-between items-center border-b pb-4 border-slate-500/10">
              <button onClick={() => setCurrentView("home")} className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:underline">
                <ArrowRight size={14} /> الرئيسية
              </button>
              <h2 className="text-lg font-bold">كشف وجرد حركة الأسطول الميداني</h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute right-3 top-2.5 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="ابحث بكود الآلية المعتمد (مثال: W.B.G 01)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pr-10 pl-4 py-2 rounded-xl text-sm border outline-none focus:border-blue-600 ${
                    isDarkMode ? "bg-[#112240] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
              {user.role === "super_admin" && (
                <button
                  onClick={() => {
                    setImgFront(null); setImgBack(null); setImgCode(null);
                    setIsAddModalOpen(true);
                  }}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <Plus size={16} /> تسجيل آلية جديدة
                </button>
              )}
            </div>

            {/* جدول عرض الآليات */}
            <div className={`rounded-xl border overflow-hidden shadow-sm ${isDarkMode ? "bg-[#112240] border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className={`text-xs border-b ${isDarkMode ? "text-slate-400 bg-slate-800/40 border-slate-800" : "text-slate-500 bg-slate-50 border-slate-200"}`}>
                      <th className="p-4">كود الآلية</th>
                      <th className="p-4">نوع وتسمية الآلية</th>
                      <th className="p-4">الموديل / سنة الصنع</th>
                      <th className="p-4">رقم اللوحة / التسلسلي</th>
                      <th className="p-4">المشروع الحالي</th>
                      <th className="p-4">الحالة التشغيلية</th>
                      {user.role === "super_admin" && <th className="p-4 text-center">إجراءات الصيانة</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm divide-slate-500/10">
                    {filteredEquipment.map(eq => (
                      <tr key={eq.id} onClick={() => openProfileDrawer(eq)} className="hover:bg-blue-600/5 cursor-pointer transition-all">
                        <td className="p-4 font-mono font-bold text-blue-500">{eq.code}</td>
                        <td className="p-4 font-semibold">
                          <div>{eq.name}</div>
                          <span className="text-[11px] font-medium text-slate-400">
                            {eq.type === "equipment" ? "🔧 معدة ثقيلة" : "🚚 مركبة / شاحنة"}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">{eq.model || "—"}</td>
                        <td className="p-4 font-mono text-slate-400">
                          {eq.type === "vehicle" ? `لوحة: ${eq.plateNumber || "—"}` : `تسلسلي: ${eq.serialNumber || "—"}`}
                        </td>
                        <td className="p-4 font-medium text-slate-500">{eq.projectName || "خارج المشاريع / الورشة"}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            eq.status === "available" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                          }`}>
                            {eq.status === "available" ? "جاهزة للعمل" : "🔴 عاطلة بالورشة"}
                          </span>
                        </td>
                        {user.role === "super_admin" && (
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-center">
                              {eq.status === "broken" ? (
                                <button
                                  onClick={() => openRepairModal(eq.id)}
                                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700"
                                >
                                  إصلاح وتوريد فواتير
                                </button>
                              ) : (
                                <button
                                  onClick={() => { setSelectedEquipmentId(eq.id); setBreakdownDate(new Date().toISOString().split('T')[0]); setIsBreakdownModalOpen(true); }}
                                  className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700"
                                >
                                  🚨 تعطلت
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

        {/* 3️⃣ شاشة التقارير والطباعة الرسمية */}
        {currentView === "reports" && (
          <div className="space-y-6">
            <div className="print:hidden space-y-6">
              <div className="flex justify-between items-center border-b pb-4 border-slate-500/10">
                <button onClick={() => { setCurrentView("home"); setShowReportResult(false); }} className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:underline">
                  <ArrowRight size={14} /> الرئيسية
                </button>
                <h2 className="text-lg font-bold">مركز الفرز والتقارير المعتمدة</h2>
              </div>

              {/* تبويبات التقارير */}
              <div className="flex gap-2 border-b border-slate-500/10 pb-2">
                <button
                  onClick={() => { setReportTab("operational"); setShowReportResult(false); }}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${reportTab === "operational" ? "bg-blue-600 text-white" : "bg-slate-500/10 text-slate-400"}`}
                >
                  ⚙️ سجلات الأعطال والميدان
                </button>
                <button
                  onClick={() => { setReportTab("financial"); setShowReportResult(false); }}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${reportTab === "financial" ? "bg-emerald-600 text-white" : "bg-slate-500/10 text-slate-400"}`}
                >
                  💰 التقارير المالية والفواتير
                </button>
              </div>

              {/* أدوات التصفية والفرز */}
              <div className={`p-6 rounded-2xl border space-y-4 ${isDarkMode ? "bg-[#112240] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">تحديد آلية معينة</label>
                    <select
                      value={selectedEquipmentFilter}
                      onChange={(e) => { setSelectedEquipmentFilter(e.target.value); setShowReportResult(false); }}
                      className={`w-full p-2.5 rounded-xl text-xs font-medium border outline-none ${isDarkMode ? "bg-[#1a365d] border-slate-700 text-white" : "bg-white border-slate-200"}`}
                    >
                      <option value="all">كل الأسطول بلا استثناء</option>
                      {equipmentList.map(e => <option key={e.id} value={e.id.toString()}>{e.name} ({e.code})</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">النطاق الزمني</label>
                    <select
                      value={dateFilterType}
                      onChange={(e) => { setDateFilterType(e.target.value as any); setShowReportResult(false); }}
                      className={`w-full p-2.5 rounded-xl text-xs font-medium border outline-none ${isDarkMode ? "bg-[#1a365d] border-slate-700 text-white" : "bg-white border-slate-200"}`}
                    >
                      <option value="all">منذ بداية التسجيل</option>
                      <option value="month">حصر بشهر محدد</option>
                      <option value="range">تاريخ مخصص ممتد</option>
                    </select>
                  </div>

                  {dateFilterType === "month" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">اختر الشهر</label>
                      <input type="month" value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value); setShowReportResult(false); }} className="w-full p-2.5 rounded-xl text-xs text-black border outline-none" />
                    </div>
                  )}

                  {dateFilterType === "range" && (
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setShowReportResult(false); }} className="w-full p-2.5 text-black rounded-xl text-xs border" />
                      <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setShowReportResult(false); }} className="w-full p-2.5 text-black rounded-xl text-xs border" />
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button onClick={() => setShowReportResult(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-md transition-all">
                    توليد وحصر الكشف الرسمي
                  </button>
                </div>
              </div>
            </div>

            {/* 🖨️ المستند الجاهز للطباعة والشرعي */}
            {showReportResult && (
              <div className="space-y-4 p-4 md:p-8 bg-white text-black border border-slate-300 rounded-2xl shadow-xl print:shadow-none print:border-none print:p-0 animate-fadeIn">
                <div className="print:hidden flex justify-between items-center border-b pb-4 border-slate-200 mb-4">
                  <span className="text-xs text-amber-600 font-bold bg-amber-50 p-2 rounded-lg border border-amber-200">📋 المستند معزول وجاهز تماماً للمطابقة الورقية والطباعة الفورية.</span>
                  <button onClick={() => window.print()} className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <Printer size={14} /> أمر طباعة المستند
                  </button>
                </div>

                {/* ترويسة وادي دفا الرسمية */}
                <div className="w-full flex justify-between items-center border-b-2 border-black pb-4 mb-6">
                  <div className="text-right">
                    <h2 className="text-xl font-bold">شركة وادي دفا للمقاولات</h2>
                    <p className="text-sm font-bold text-slate-600 mt-0.5">إشراف صيانة الأسطول والآليات</p>
                  </div>
                  <div className="w-16 h-16 border border-slate-300 p-0.5 rounded-lg overflow-hidden">
                    <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                </div>

                <div className="text-center my-4">
                  <h3 className="text-base font-bold underline bg-slate-100 py-2 rounded-lg tracking-wide">{getReportTitle()}</h3>
                  <p className="text-[10px] text-slate-500 mt-2">تاريخ الاستخراج والتوثيق: {new Date().toLocaleDateString('ar-EG')} م</p>
                </div>

                {/* 📄 التبويب الأول: تقرير الأعطال العملياتي */}
                {reportTab === "operational" && (
                  <div className="border border-black rounded-lg overflow-hidden">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="text-xs bg-slate-900 text-white font-bold border-b border-black">
                          <th className="p-3 border-l border-black">رقم البلاغ</th>
                          <th className="p-3 border-l border-black">كود واسم الآلية</th>
                          <th className="p-3 border-l border-black">موقع العطل (المشروع)</th>
                          <th className="p-3 border-l border-black w-1/3">تفاصيل وأعراض فحص الورشة</th>
                          <th className="p-3 border-l border-black">تاريخ العطل</th>
                          <th className="p-3">حالة الإجراء والجاهزية</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black text-xs font-medium">
                        {filteredFinancialLogs.length === 0 ? (
                          <tr><td colSpan={6} className="p-8 text-center font-bold text-slate-400">لا توجد سجلات أعطال مطابقة للبحث.</td></tr>
                        ) : (
                          filteredFinancialLogs.map(log => (
                            <tr key={log.logId} className="align-top">
                              <td className="p-3 border-l border-black font-mono">#00{log.logId}</td>
                              <td className="p-3 border-l border-black">
                                <span className="font-bold block">{log.equipmentName}</span>
                                <span className="font-mono text-blue-700 font-bold">{log.equipmentCode}</span>
                              </td>
                              <td className="p-3 border-l border-black font-semibold text-slate-700">{log.projectName}</td>
                              <td className="p-3 border-l border-black text-slate-800 whitespace-normal break-words leading-relaxed"></td>
                              <td className="p-3 border-l border-black font-mono">{new Date(log.breakdownDate).toLocaleDateString('ar-EG')}</td>
                              <td className="p-3 font-bold">
                                {log.repairDate ? (
                                  <span className="text-emerald-700">✅ جاهزة ({new Date(log.repairDate).toLocaleDateString('ar-EG')})</span>
                                ) : (
                                  <span className="text-amber-600 animate-pulse">🛠️ تحت الإصلاح حالياً</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 💵 التبويب الثاني: تقرير المشتريات والمالية المفصل الحسابات */}
                {reportTab === "financial" && (
                  <div className="space-y-6">
                    <div className="border border-black rounded-lg overflow-hidden">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="text-xs bg-slate-900 text-white font-bold border-b border-black">
                            <th className="p-3 border-l border-black">رقم الأورنيك</th>
                            <th className="p-3 border-l border-black">الآلية المشتري لها</th>
                            <th className="p-3 border-l border-black">المشروع المستضيف</th>
                            <th className="p-3 border-l border-black w-2/5">بيان الفواتير المشتراة وتفصيل القطع</th>
                            <th className="p-3 text-center">التكلفة الكلية (ريال)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black text-xs font-medium">
                          {filteredFinancialLogs.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center font-bold text-slate-400">لا توجد سجلات مالية أو قطع غيار مشتراة في الفترة المحددة.</td></tr>
                          ) : (
                            filteredFinancialLogs.map(log => (
                              <tr key={log.logId} className="align-top">
                                <td className="p-3 border-l border-black font-mono">#FN{log.logId}</td>
                                <td className="p-3 border-l border-black">
                                  <span className="font-bold block">{log.equipmentName}</span>
                                  <span className="font-mono text-xs text-blue-700 font-bold">{log.equipmentCode}</span>
                                </td>
                                <td className="p-3 border-l border-black font-semibold text-slate-700">{log.projectName}</td>
                                <td className="p-3 border-l border-black p-0">
                                  <div className="divide-y divide-slate-200">
                                    {log.items.map((item, index) => (
                                      <div key={item.id} className="p-2 flex justify-between items-center text-[11px]">
                                        <span>{index + 1}. {item.name}</span>
                                        <span className="font-mono text-slate-600">{item.price} ريال</span>
                                      </div>
                                    ))}
                                    {log.items.length === 0 && <div className="p-3 text-slate-400 text-center italic">إصلاح بدون قطع مشتراة مصنعية فقط</div>}
                                  </div>
                                </td>
                                <td className="p-3 text-center font-mono font-bold text-sm bg-slate-50 text-emerald-700">
                                  {log.totalCost}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* الإجمالي المالي الموحد أسفل المستند الورقي */}
                    <div className="p-4 bg-slate-900 text-white rounded-lg flex justify-between items-center font-bold text-sm">
                      <span>إجمالي المنصرفات المالية لكافة البنود المذكورة أعلاه:</span>
                      <span className="font-mono text-base text-amber-400">
                        {filteredFinancialLogs.reduce((acc, curr) => acc + curr.totalCost, 0)} ريال سعودي
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-12 pt-8 border-t border-dotted border-slate-400 grid grid-cols-2 text-xs font-bold text-slate-700">
                  <p>توقيع الإشراف الهندسي والمطابقة: ............................</p>
                  <p className="text-left">توقيع واعتماد الإدارة المالية: ............................</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 👤 مودال الملف الشخصي والأمان الشامل */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border ${isDarkMode ? "bg-[#112240] border-slate-800 text-white" : "bg-white text-slate-800"}`}>
            <div className="bg-blue-900 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">بوابة تأمين الحساب والمشرفين</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="p-1 rounded-lg hover:bg-white/10"><X size={18} /></button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="space-y-2 border-b pb-4 border-slate-500/10">
                <h4 className="text-xs font-bold text-blue-500 uppercase">المعلومات الإدارية الموثقة</h4>
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-500/5 p-3 rounded-xl">
                  <div>
                    <span className="text-slate-400 block mb-0.5">الاسم المسؤول</span>
                    <p className="font-bold">{user.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">مرتبة الصلاحية</span>
                    <p className="font-mono text-blue-400 font-bold">{user.role === "super_admin" ? "مدير نظام مطلق (Super Admin)" : "مشرف ميداني"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-b pb-4 border-slate-500/10">
                <h4 className="text-xs font-bold text-blue-500 uppercase">تعديل وتأمين كلمة السر</h4>
                <form onSubmit={handlePasswordChange} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="كلمة المرور الجديدة" className="w-full p-2.5 bg-slate-500/5 text-black border rounded-lg text-xs" />
                    <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="تأكيد كلمة المرور" className="w-full p-2.5 bg-slate-500/5 text-black border rounded-lg text-xs" />
                  </div>
                  <button type="submit" className="bg-slate-800 text-white hover:bg-slate-900 px-4 py-2 rounded-lg text-xs font-bold">تحديث الأمان</button>
                </form>
              </div>

              {user.role === "super_admin" && (
                <div className="space-y-3 bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
                  <h4 className="text-xs font-bold text-blue-500 uppercase">إضافة مشرف تشغيلي جديد للمشاريع</h4>
                  <form onSubmit={handleAddSupervisor} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input type="text" required value={supName} onChange={(e) => setSupName(e.target.value)} placeholder="اسم المشرف الثلاثي" className="w-full p-2.5 text-black border rounded-lg text-xs" />
                      <input type="text" required value={supUsername} onChange={(e) => setSupUsername(e.target.value)} placeholder="اسم المستخدم للدخول" className="w-full p-2.5 text-black border rounded-lg text-xs" />
                    </div>
                    <select value={supRole} onChange={(e) => setSupRole(e.target.value)} className="w-full p-2 bg-slate-800 text-white rounded-lg text-xs">
                      <option value="main_supervisor">مشرف رئيسي كامل (إدخال وتحديث حركة وصيانة)</option>
                      <option value="read_only">مشرف قراءة (استعراض كشوف وطباعة تقارير فقط)</option>
                    </select>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md">تأكيد ومنح الصلاحية</button>
                  </form>
                </div>
              )}

              <button onClick={() => { setIsProfileModalOpen(false); onLogout(); }} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all">
                <LogOut size={14} /> تسجيل الخروج الآمن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📥 مودال تسجيل آلية جديدة (مطابق للباك إند تماماً) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border ${isDarkMode ? "bg-[#112240] border-slate-800 text-white" : "bg-white text-slate-800"}`}>
            <div className="bg-blue-900 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">تسجيل آلية جديدة بالأسطول الفني</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg hover:bg-white/10"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddEquipment} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">كود الآلية الفريد*</label>
                  <input type="text" required value={eqCode} onChange={(e) => setEqCode(e.target.value)} placeholder="W.B.G 01" className="w-full px-3 py-2 text-black bg-slate-500/5 border rounded-lg text-left font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">اسم وتسمية المعدة*</label>
                  <input type="text" required value={eqName} onChange={(e) => setEqName(e.target.value)} placeholder="بلدوزر كوماتسو D85" className="w-full px-3 py-2 text-black bg-slate-500/5 border rounded-lg text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">تصنيف ونوع الآلية*</label>
                  <select value={eqType} onChange={(e) => setEqType(e.target.value as any)} className="w-full px-3 py-2 text-black bg-slate-500/5 border rounded-lg text-sm">
                    <option value="equipment">🔧 معدة (رقم تسلسلي/شاسي)</option>
                    <option value="vehicle">🚚 مركبة (لوحة مرورية رسمية)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">الموديل / سنة الصنع</label>
                  <input type="text" value={eqModel} onChange={(e) => setEqModel(e.target.value)} placeholder="2025" className="w-full px-3 py-2 text-black bg-slate-500/5 border rounded-lg text-sm" />
                </div>
              </div>

              {/* حقول متغيرة ديناميكياً بحسب النوع */}
              {eqType === "equipment" ? (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">الرقم التسلسلي (Serial Number)*</label>
                  <input type="text" required value={eqSerialNumber} onChange={(e) => setEqSerialNumber(e.target.value)} placeholder="رقم الشاسي أو الرقم التسلسلي للمصنع" className="w-full px-3 py-2 text-black bg-slate-500/5 border rounded-lg text-sm font-mono text-left" />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">رقم اللوحة المرورية الرسمية*</label>
                  <input type="text" required value={eqPlateNumber} onChange={(e) => setEqPlateNumber(e.target.value)} placeholder="مثال: 4567 ر ع د" className="w-full px-3 py-2 text-black bg-slate-500/5 border rounded-lg text-sm" />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">تنسيب الآلية لمشروع ابتدائي</label>
                <select value={eqProjectId} onChange={(e) => setEqProjectId(e.target.value)} className="w-full px-3 py-2 text-black bg-slate-500/5 border rounded-lg text-sm">
                  <option value="">خارج المشاريع (الورشة المركزية)</option>
                  {projectsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* رفع الـ 3 صور من كلاودنري محلياً */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">التوثيق الفوتوغرافي الإجباري للسلامة (3 لقطات)</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["front", "back", "code"] as const).map((t, idx) => {
                    const imgVal = t === "front" ? imgFront : t === "back" ? imgBack : imgCode;
                    return (
                      <label key={t} className="border border-dashed border-slate-400/40 rounded-lg p-2 h-20 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-500/5 transition-all overflow-hidden">
                        {imgVal ? (
                          <img src={imgVal} alt="uploaded" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <ImageIcon size={18} className="text-slate-400" />
                            <span className="text-[9px] mt-1 text-slate-400">
                              {t === "front" ? "واجهة الآلية" : t === "back" ? "خلفية الآلية" : "كود الملصق"}
                            </span>
                          </>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(t, e)} />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={addLoading} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm shadow-md">{addLoading ? "جاري الإدخال الموزون..." : "تأكيد وتسجيل بالأسطول"}</button>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2.5 bg-slate-500/10 text-slate-400 rounded-xl text-sm">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🚨 أورنيك بلاغ عطل (تعطلت) */}
      {isBreakdownModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border ${isDarkMode ? "bg-[#112240] border-slate-800 text-white" : "bg-white text-slate-800"}`}>
            <div className="bg-red-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">🚨 فتح بلاغ عطل ميداني جديد (تعطلت)</h3>
              <button onClick={() => setIsBreakdownModalOpen(false)} className="p-1 rounded-lg hover:bg-white/10"><X size={18} /></button>
            </div>
            <form onSubmit={handleEnterMaintenance} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">تاريخ وقوع وتوثيق العطل*</label>
                <input type="date" required value={breakdownDate} onChange={(e) => setBreakdownDate(e.target.value)} className="w-full p-2.5 text-black rounded-xl text-sm border" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">تفاصيل فحص الورشة المبدئي والأعراض الفنية</label>
                <textarea rows={4} required value={breakdownDetails} onChange={(e) => setBreakdownDetails(e.target.value)} placeholder="اكتب بالتفصيل أعراض العطل الميكانيكي أو الكهربائي..." className="w-full px-3 py-2 text-black bg-slate-500/5 border rounded-xl text-sm outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl text-sm">سحب وإيقاف الآلية للورشة</button>
                <button type="button" onClick={() => setIsBreakdownModalOpen(false)} className="px-4 py-2.5 bg-slate-500/10 text-slate-400 rounded-xl text-sm">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⚙️ مودال تم الإصلاح وتوريد فواتير المشتريات والقطع الديناميكي الجديد */}
      {isRepairModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border flex flex-col max-h-[90vh] ${isDarkMode ? "bg-[#112240] border-slate-800 text-white" : "bg-white text-slate-800"}`}>
            <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">✅ إغلاق بلاغ العطل وجاهزية العمل وتوريد الفواتير</h3>
              <button onClick={() => setIsRepairModalOpen(false)} className="p-1 rounded-lg hover:bg-white/10"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleCloseMaintenanceWithPurchases} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">تاريخ الجاهزية والخروج من الورشة*</label>
                <input type="date" required value={repairDate} onChange={(e) => setRepairDate(e.target.value)} className="w-full p-2.5 text-black rounded-xl text-sm border" />
              </div>

              {/* جدول السطور المفتوح والديناميكي للفواتير المشتراة قطعة قطعة */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-blue-500">بيان تفصيلي بقطع الغيار والمشتريات (إن وجد)</label>
                  <button type="button" onClick={addPurchaseRow} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 flex items-center gap-1">
                    <Plus size={12} /> إضافة سطر قطعة
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto p-1 border border-slate-500/10 rounded-xl bg-slate-500/5">
                  {purchaseItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="اسم قطعة الغيار (مثال: فلتر ديزل)"
                        value={item.itemName}
                        onChange={(e) => updatePurchaseItem(index, "itemName", e.target.value)}
                        className="flex-1 p-2 text-xs text-black border rounded-lg"
                      />
                      <input
                        type="number"
                        placeholder="السعر (ريال)"
                        value={item.price || ""}
                        onChange={(e) => updatePurchaseItem(index, "price", e.target.value)}
                        className="w-24 p-2 text-xs text-black border rounded-lg font-mono text-center"
                      />
                      {purchaseItems.length > 1 && (
                        <button type="button" onClick={() => removePurchaseRow(index)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* الحساب التلقائي المجموع في الفرونت إند للمراجعة قبل التأكيد */}
                <div className="p-2.5 bg-emerald-500/10 rounded-xl text-xs font-bold text-emerald-600 flex justify-between items-center">
                  <span>إجمالي تكلفة المشتريات في هذا الأورنيك:</span>
                  <span className="font-mono text-sm">{purchaseItems.reduce((sum, item) => sum + (item.price || 0), 0)} ريال سعودي</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm shadow-md">إصلاح فوري وإعادتها للخدمة</button>
                <button type="button" onClick={() => setIsRepairModalOpen(false)} className="px-4 py-2.5 bg-slate-500/10 text-slate-400 rounded-xl text-sm">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🗂️ بروفايل المعدة المنبثق الفخم (تعديل الأسطول والمشاريع + الـ 3 صور) */}
      {selectedEquipmentProfile && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border ${isDarkMode ? "bg-[#112240] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}`}>
            
            <div className="p-5 bg-slate-500/5 border-b border-slate-500/10 flex justify-between items-center">
              <div>
                <span className="text-xs font-mono font-bold text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-md">{selectedEquipmentProfile.code}</span>
                <h3 className="font-bold text-lg mt-1">{selectedEquipmentProfile.name}</h3>
              </div>
              <button onClick={() => setSelectedEquipmentProfile(null)} className="p-1.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20"><X size={18} /></button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
              
              {/* القسم الأيمن: التعديل والبيانات الفنية الفخمة */}
              <div className="space-y-4 md:border-l md:border-slate-500/10 md:pl-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider">الملف التعريفي الفني للآلية</h4>
                  {user.role === "super_admin" && (
                    <button onClick={() => setIsEditMode(!isEditMode)} className="text-xs text-amber-500 underline font-semibold flex items-center gap-1">
                      <Edit3 size={12} /> {isEditMode ? "إلغاء وضع التعديل" : "تعديل بيانات الملف"}
                    </button>
                  )}
                </div>

                {!isEditMode ? (
                  <div className="space-y-3 text-xs bg-slate-500/5 p-4 rounded-xl">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400 block mb-0.5">تصنيف وصنف الآلية</span>
                        <p className="font-bold">{selectedEquipmentProfile.type === "equipment" ? "🔧 معدة ثقيلة" : "🚚 مركبة شاحنة"}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">الموديل / سنة الصنع</span>
                        <p className="font-semibold">{selectedEquipmentProfile.model || "غير مسجل"}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">{selectedEquipmentProfile.type === "equipment" ? "الرقم التسلسلي المميز (Serial)" : "رقم اللوحة المرورية"}</span>
                      <p className="font-mono font-bold text-sm text-blue-500">
                        {selectedEquipmentProfile.type === "equipment" ? selectedEquipmentProfile.serialNumber : selectedEquipmentProfile.plateNumber || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">المشروع الحالي الفعلي</span>
                      <p className="font-bold text-sm text-slate-700">{selectedEquipmentProfile.projectName || "خارج المشاريع / الورشة المركزية"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">الحالة الميدانية بالنظام</span>
                      <p className="font-bold text-sm">
                        {selectedEquipmentProfile.status === "available" ? "🟢 جاهزة ومتاحة للعمل" : "🔴 عاطلة داخل الورشة لإصلاحات"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateEquipmentProfile} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 mb-1">كود الآلية</label>
                        <input type="text" required value={editCode} onChange={(e) => setEditCode(e.target.value)} className="w-full p-2 text-black bg-slate-500/10 border rounded-lg font-mono" />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">اسم الآلية</label>
                        <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-2 text-black bg-slate-500/10 border rounded-lg" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 mb-1">الموديل</label>
                        <input type="text" value={editModel} onChange={(e) => setEditModel(e.target.value)} className="w-full p-2 text-black bg-slate-500/10 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">{selectedEquipmentProfile.type === "equipment" ? "رقم الشاسي/التسلسلي" : "رقم اللوحة"}</label>
                        {selectedEquipmentProfile.type === "equipment" ? (
                          <input type="text" required value={editSerialNumber} onChange={(e) => setEditSerialNumber(e.target.value)} className="w-full p-2 text-black bg-slate-500/10 border rounded-lg font-mono" />
                        ) : (
                          <input type="text" required value={editPlateNumber} onChange={(e) => setEditPlateNumber(e.target.value)} className="w-full p-2 text-black bg-slate-500/10 border rounded-lg" />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">نقل أو تنسيب لمشروع آخر</label>
                      <select value={editProjectId} onChange={(e) => setEditProjectId(e.target.value)} className="w-full p-2 text-black bg-slate-500/10 border rounded-lg">
                        <option value="">خارج المشاريع (الورشة المركزية)</option>
                        {projectsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">تحديث الحالة يدوياً</label>
                      <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)} className="w-full p-2 bg-slate-800 text-white rounded-lg">
                        <option value="available">متاحة وجاهزة للعمل فورا</option>
                        <option value="broken">تعطلت / سحب للورشة</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">حفظ وتوثيق التغييرات بالسيستم</button>
                  </form>
                )}
              </div>

              {/* القسم الأيسر: الصور الفوتوغرافية الثلاث وتاريخ الصيانة الفعلي اللحظي */}
              <div className="space-y-4 flex flex-col justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">التوثيق الفوتوغرافي لسلامة الآلية (3 صور)</h4>
                
                <div className="grid grid-cols-3 gap-3">
                  {(["front", "back", "code"] as const).map((t) => {
                    const currentImg = t === "front" ? imgFront : t === "back" ? imgBack : imgCode;
                    return (
                      <div key={t} className="relative group border border-dashed border-slate-400/30 rounded-xl h-24 overflow-hidden bg-slate-500/5 flex flex-col items-center justify-center p-1 text-center">
                        {currentImg ? (
                          <img src={currentImg} alt="وثيقة فوتوغرافية" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="text-slate-400 flex flex-col items-center gap-1">
                            <ImageIcon size={18} />
                            <span className="text-[9px]">
                              {t === "front" ? "واجهة الآلية" : t === "back" ? "خلفية الآلية" : "ملصق الكود"}
                            </span>
                          </div>
                        )}
                        {isEditMode && (
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold cursor-pointer rounded-xl transition-all">
                            <span>استبدال</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(t, e)} />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* أرشيف الصيانة الصغير بداخل بروفايل الآلية لتتبع الهستوري */}
                <div className="mt-2 pt-3 border-t border-slate-500/10 flex-1">
                  <h5 className="text-[11px] font-bold text-slate-400 mb-2">آخر فحص فني وبلاغات ورشة الآلية</h5>
                  <div className="max-h-28 overflow-y-auto space-y-2">
                    {selectedEquipmentHistory.length === 0 ? (
                      <p className="text-[10px] text-slate-400 bg-slate-500/5 p-3 rounded-lg text-center">السجل التاريخي لهذه الآلية نظيف وخالٍ من البلاغات.</p>
                    ) : (
                      selectedEquipmentHistory.map(log => (
                        <div key={log.id} className="p-2.5 bg-slate-500/5 border rounded-lg text-[11px] space-y-1">
                          <div className="flex justify-between font-bold">
                            <span className="text-blue-500">مشروع: {log.projectNameSnapshot}</span>
                            <span className="text-slate-400 font-mono">{new Date(log.breakdownDate).toLocaleDateString('ar-EG')}</span>
                          </div>
                          <p className="text-slate-600 font-medium leading-relaxed">{log.details || "—"}</p>
                          <div className="text-[10px] font-bold">
                            {log.repairDate ? (
                              <span className="text-emerald-600">خرجت للخدمة بتاريخ: {new Date(log.repairDate).toLocaleDateString('ar-EG')}</span>
                            ) : (
                              <span className="text-amber-500 animate-pulse">لا تزال بالورشة حتى اللحظة</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>

            <div className="p-4 bg-slate-500/5 border-t border-slate-500/10 flex justify-end gap-2">
              {user.role === "super_admin" && selectedEquipmentProfile.status === "broken" && (
                <button onClick={() => openRepairModal(selectedEquipmentProfile.id)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm">
                  إصلاح وتوريد فواتير فورية
                </button>
              )}
              <button onClick={() => setSelectedEquipmentProfile(null)} className="px-4 py-2 bg-slate-500/10 text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-500/20">إغلاق البروفايل</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
