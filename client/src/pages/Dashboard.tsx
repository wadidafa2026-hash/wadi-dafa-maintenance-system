import { useState, useEffect } from 'react';
import { LayoutDashboard, Truck, Wrench, AlertTriangle, LogOut, Plus, CheckCircle, Settings } from 'lucide-react';

interface DashboardProps {
  user: { name: string; role: string };
  onLogout: () => void;
}

interface Equipment {
  id: number;
  name: string;
  type: string;
  plateNumber: string;
  status: 'active' | 'maintenance' | 'stopped';
  currentDriver: string;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. جلب الآليات من السيرفر طوالي أول ما تفتح الصفحة
  useEffect(() => {
    fetch('/api/equipment')
      .then((res) => res.json())
      .then((data) => {
        setEquipmentList(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('فشل جلب البيانات، حنظهر بيانات تجريبية طوالي:', err);
        // بيانات تجريبية مؤقتة في حال السيرفر ما رجع حاجة عشان تشوف التصميم طوالي
        setEquipmentList([
          { id: 1, name: 'بوكلين كاتر بيلر', type: 'حفار', plateNumber: 'أ ب ج 123', status: 'active', currentDriver: 'محمد أحمد' },
          { id: 2, name: 'قلاب مرسيدس البي', type: 'قلاب', plateNumber: 'د هـ و 456', status: 'maintenance', currentDriver: 'عثمان علي' },
          { id: 3, name: 'كرين تادانو 50 طن', type: 'رافع', plateNumber: 'ز ح ط 789', status: 'stopped', currentDriver: 'خالد وليد' },
        ]);
        setLoading(false);
      });
  }, []);

  // 2. دالة سريعة لتغيير حالة المعدة (مثلاً إرسال للورشة أو إخراج)
  const updateStatus = async (id: number, newStatus: 'active' | 'maintenance' | 'stopped') => {
    try {
      // تعديل الحالة في الواجهة فوراً عشان السرعة
      setEquipmentList(prev => prev.map(eq => eq.id === id ? { ...eq, status: newStatus } : eq));
      
      // إرسال التعديل للسيرفر ليتحفظ في قاعدة البيانات Neon
      await fetch(`/api/equipment/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('فشل حفظ الحالة الجديدة في السحاب');
    }
  };

  // 3. حسابات العدادات الفوق تلقائياً
  const total = equipmentList.length;
  const active = equipmentList.filter(e => e.status === 'active').length;
  const maintenance = equipmentList.filter(e => e.status === 'maintenance').length;
  const stopped = equipmentList.filter(e => e.status === 'stopped').length;

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {/* الشريط العلوي الهيدر */}
      <header className="bg-[#1e3a8a] text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white text-[#1e3a8a] p-2 rounded-xl font-bold text-lg">دفا</div>
            <div>
              <h1 className="text-lg font-bold leading-tight">أسطول وادي دفا</h1>
              <p className="text-xs text-blue-200">نظام المتابعة والصيانة الذكي</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-blue-200">{user.role === 'super_admin' ? 'مشرف عام' : 'مراقب'}</p>
            </div>
            <button 
              onClick={onLogout}
              className="bg-red-600/20 hover:bg-red-600 p-2.5 rounded-xl transition-all text-red-200 hover:text-white flex items-center gap-1 text-sm"
              title="تسجيل الخروج"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* قسم العدادات السريعة (Cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">إجمالي الآليات</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{total}</p>
            </div>
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl"><Truck size={24} /></div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">جاهزة للعمل</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{active}</p>
            </div>
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl"><CheckCircle size={24} /></div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">في الورشة</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{maintenance}</p>
            </div>
            <div className="bg-amber-50 text-amber-600 p-3 rounded-xl"><Wrench size={24} /></div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">خارج الخدمة</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stopped}</p>
            </div>
            <div className="bg-red-50 text-red-600 p-3 rounded-xl"><AlertTriangle size={24} /></div>
          </div>
        </div>

        {/* عنوان الكشف وأزرار الإضافة */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-slate-700">
            <LayoutDashboard size={20} />
            <h2 className="font-bold text-base sm:text-lg">كشف متابعة آليات الميدان</h2>
          </div>
          {user.role === 'super_admin' && (
            <button className="bg-[#1e3a8a] hover:bg-blue-800 text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1 shadow-sm transition-all">
              <Plus size={16} />
              <span>إضافة آلية</span>
            </button>
          )}
        </div>

        {/* جدول وكروت الآليات (دعم كامل للموبايل) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">جاري سحب كشف الآليات من السحاب...</div>
          ) : (
            <>
              {/* العرض في الكمبيوتر (Table) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm font-medium">
                      <th className="p-4">المعدة / النوع</th>
                      <th className="p-4">رقم اللوحة</th>
                      <th className="p-4">السائق الحالي</th>
                      <th className="p-4">الحالة مسبقاً</th>
                      {user.role === 'super_admin' && <th className="p-4 text-center">إجراءات التحكم (الورشة)</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                    {equipmentList.map((eq) => (
                      <tr key={eq.id} className="hover:bg-slate-50/80 transition-all">
                        <td className="p-4 font-semibold text-slate-900">
                          <div>{eq.name}</div>
                          <span className="text-xs text-slate-400 font-normal">{eq.type}</span>
                        </td>
                        <td className="p-4 font-mono text-slate-600">{eq.plateNumber}</td>
                        <td className="p-4 text-slate-600">{eq.currentDriver || 'لا يوجد'}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            eq.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                            eq.status === 'maintenance' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              eq.status === 'active' ? 'bg-emerald-500' :
                              eq.status === 'maintenance' ? 'bg-amber-500' : 'bg-red-500'
                            }`}></span>
                            {eq.status === 'active' ? 'جاهزة' : eq.status === 'maintenance' ? 'في الورشة' : 'متوقفة'}
                          </span>
                        </td>
                        {user.role === 'super_admin' && (
                          <td className="p-4">
                            <div className="flex justify-center gap-2">
                              {eq.status !== 'active' && (
                                <button onClick={() => updateStatus(eq.id, 'active')} className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-medium transition-all">إصلاح وتشغيل</button>
                              )}
                              {eq.status !== 'maintenance' && (
                                <button onClick={() => updateStatus(eq.id, 'maintenance')} className="px-3 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-medium transition-all">إرسال للورشة</button>
                              )}
                              {eq.status !== 'stopped' && (
                                <button onClick={() => updateStatus(eq.id, 'stopped')} className="px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-medium transition-all">إيقاف طارئ</button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* العرض في الموبايل (Cards Layout) */}
              <div className="block md:hidden divide-y divide-slate-100">
                {equipmentList.map((eq) => (
                  <div key={eq.id} className="p-4 space-y-3 hover:bg-slate-50 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{eq.name}</h3>
                        <p className="text-xs text-slate-400">{eq.type} • <span className="font-mono">{eq.plateNumber}</span></p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        eq.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                        eq.status === 'maintenance' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {eq.status === 'active' ? 'جاهزة' : eq.status === 'maintenance' ? 'في الورشة' : 'متوقفة'}
                      </span>
                    </div>
                    
                    <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg flex justify-between">
                      <span>السائق: <strong>{eq.currentDriver || 'غير محدد'}</strong></span>
                    </div>

                    {user.role === 'super_admin' && (
                      <div className="flex gap-2 pt-1 border-t border-dashed border-slate-100">
                        {eq.status !== 'active' && (
                          <button onClick={() => updateStatus(eq.id, 'active')} className="flex-1 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium text-center">تشغيل</button>
                        )}
                        {eq.status !== 'maintenance' && (
                          <button onClick={() => updateStatus(eq.id, 'maintenance')} className="flex-1 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium text-center">للورشة</button>
                        )}
                        {eq.status !== 'stopped' && (
                          <button onClick={() => updateStatus(eq.id, 'stopped')} className="flex-1 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium text-center">إيقاف</button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
