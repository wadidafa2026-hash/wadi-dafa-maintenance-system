// client/src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
// استدعاء المودالات ومكون التقارير المالية الظاهر في مكتبة الملفات
import { AddEquipmentModal } from '../components/AddEquipmentModal';
import { EquipmentProfileModal } from '../components/EquipmentProfileModal';
import { FinancialReports } from '../components/FinancialReports'; // تم تفعيله هنا!

interface Equipment {
  id: number;
  code: string;
  name: string;
  model: string | null;
  type: 'equipment' | 'vehicle';
  serialNumber: string | null;
  plateNumber: string | null;
  status: 'available' | 'broken' | 'out_of_service'; // تحديث الحالات لتطابق الداتا بيز
  projectName: string | null;
}

// تحديث الـ Props لتشمل الـ 3 مستويات من الصلاحيات المتفق عليها
interface DashboardProps {
  user: { id: number; name: string; role: 'super_admin' | 'sub_admin' | 'viewer' };
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // تابات العرض الرئيسية (إدارة الأسطول VS التقارير المالية)
  const [viewMode, setViewMode] = useState<'fleet' | 'finance'>('fleet');
  const [activeTab, setActiveTab] = useState<'all' | 'equipment' | 'vehicle'>('all');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // جلب البيانات من السيرفر
  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/equipment');
      if (response.ok) {
        const data = await response.json();
        setEquipmentList(data);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const filteredList = equipmentList.filter((item) => {
    if (activeTab === 'all') return true;
    return item.type === activeTab;
  });

  // تابع لعرض شارة الصلاحية بشكل جمالي
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'sub_admin': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getRoleName = (role: string) => {
    if (role === 'super_admin') return 'مدير الصيانة';
    if (role === 'sub_admin') return 'مشرف فرعي';
    return 'مشاهد فقط';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* شريط معلومات المستخدم العلوي وزر تسجيل الخروج */}
        <div className="flex justify-between items-center bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
              {user.name.charAt(0)}
            </div>
            <div>
              <span className="text-sm font-medium ml-2">{user.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-md border font-bold ${getRoleBadge(user.role)}`}>
                {getRoleName(user.role)}
              </span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="text-xs bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white px-3 py-1.5 rounded-xl transition-all"
          >
            ↩️ خروج
          </button>
        </div>

        {/* الهيدر وعناوين القسم */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">أسطول ومعدات وادي دفا</h1>
            <p className="text-sm text-slate-500 mt-1">النظام الموحد للمتابعة الفنية، البلاغات، والمشتريات</p>
          </div>
          
          {/* حماية الأزرار: المشاهد (viewer) لا يمكنه إضافة آليات جديدة */}
          {user.role !== 'viewer' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 text-sm self-start md:self-auto"
            >
              ➕ تسجيل آلية جديدة
            </button>
          )}
        </div>

        {/* التوجيه الأساسي بين الأقسام (الأسطول الفني VS التقارير المالية) */}
        <div className="border-b border-slate-200 flex gap-6 text-sm font-medium">
          <button 
            onClick={() => setViewMode('fleet')}
            className={`pb-3 transition-all ${viewMode === 'fleet' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            🚚 إدارة وحركة الأسطول
          </button>
          <button 
            onClick={() => setViewMode('finance')}
            className={`pb-3 transition-all ${viewMode === 'finance' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            📊 التقارير المالية والمشتريات
          </button>
        </div>

        {/* العرض بناءً على القسم المختار */}
        {viewMode === 'finance' ? (
          <FinancialReports />
        ) : (
          <>
            {/* أزرار الفلترة الفرعية للآليات */}
            <div className="flex bg-slate-200/60 p-1.5 rounded-xl w-fit gap-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-all ${activeTab === 'all' ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:text-slate-800'}`}
              >
                📋 الكل ({equipmentList.length})
              </button>
              <button
                onClick={() => setActiveTab('equipment')}
                className={`px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-all ${activeTab === 'equipment' ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:text-slate-800'}`}
              >
                ⚙️ المعدات ({equipmentList.filter(i => i.type === 'equipment').length})
              </button>
              <button
                onClick={() => setActiveTab('vehicle')}
                className={`px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-all ${activeTab === 'vehicle' ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:text-slate-800'}`}
              >
                🚚 المركبات ({equipmentList.filter(i => i.type === 'vehicle').length})
              </button>
            </div>

            {/* الجدول الرئيسي للآليات */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-slate-500 animate-pulse">جاري سحب بيانات الأسطول حياً...</div>
              ) : filteredList.length === 0 ? (
                <div className="p-12 text-center text-slate-400">لا توجد آليات مسجلة في هذا القسم حالياً.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 text-slate-600 text-sm border-b border-slate-100">
                        <th className="p-4 font-semibold">كود الآلية</th>
                        <th className="p-4 font-semibold">الاسم الفني الإجمالي</th>
                        <th className="p-4 font-semibold">التصنيف</th>
                        <th className="p-4 font-semibold">المحدد الفريد (سيريال/لوحة)</th>
                        <th className="p-4 font-semibold">الموقع / المشروع الحالي</th>
                        <th className="p-4 font-semibold">الحالة التشغيلية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {filteredList.map((item) => (
                        <tr 
                          key={item.id} 
                          onClick={() => {
                            setSelectedEquipment(item);
                            setIsProfileModalOpen(true);
                          }}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        >
                          <td className="p-4 font-bold text-blue-600 tracking-wider uppercase">{item.code}</td>
                          <td className="p-4 font-medium">{item.name}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${item.type === 'equipment' ? 'bg-orange-50 text-orange-700' : 'bg-purple-50 text-purple-700'}`}>
                              {item.type === 'equipment' ? '⚙️ معدة' : '🚚 مركبة'}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-xs text-slate-600">
                            {item.type === 'equipment' ? item.serialNumber : item.plateNumber}
                          </td>
                          <td className="p-4">
                            <span className={`text-sm font-medium ${item.projectName ? 'text-slate-800' : 'text-amber-600 font-semibold'}`}>
                              {item.projectName || '⚙️ في الورشة / غير منزلة بموقع'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                              item.status === 'available' ? 'bg-emerald-50 text-emerald-700' : 
                              item.status === 'broken' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${
                                item.status === 'available' ? 'bg-emerald-500' : 
                                item.status === 'broken' ? 'bg-red-500' : 'bg-slate-400'
                              }`} />
                              {item.status === 'available' ? 'جاهز للعمل' : 
                               item.status === 'broken' ? 'تعطلت' : 'خارج الخدمة'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* المودالات الملحقة */}
      <AddEquipmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchEquipment}
      />

      <EquipmentProfileModal
        equipment={selectedEquipment}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onRefresh={fetchEquipment}
      />
    </div>
  );
};
