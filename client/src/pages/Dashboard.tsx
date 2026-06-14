// client/src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
// استدعاء المودالين من مجلد المكونات
import { AddEquipmentModal } from '../components/AddEquipmentModal';
import { EquipmentProfileModal } from '../components/EquipmentProfileModal';

interface Equipment {
  id: number;
  name: string;
  code: string;
  model: string | null;
  type: 'equipment' | 'vehicle';
  serialNumber: string | null;
  plateNumber: string | null;
  status: 'available' | 'broken';
  projectName: string | null;
}

// 1️⃣ تم إضافة هذا التعريف لتأمين استقبال بيانات المستخدم من ملف App.tsx ومنع الخطأ الأحمر
interface DashboardProps {
  user: { id: number; name: string; role: 'super_admin' | 'viewer' };
  onLogout: () => void;
}

// 2️⃣ تم تعديل السطر ليتوافق مع الـ Props الممررة
export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'equipment' | 'vehicle'>('all');
  
  // حالات التحكم بمودال إضافة آلية جديدة
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // حالات التحكم بمودال بروفايل المعدة الحالي (الأعطال والمشتريات)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // دالة جلب الآليات حياً من السيرفر
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

  // فلترة القائمة حسب التاب النشط
  const filteredList = equipmentList.filter((item) => {
    if (activeTab === 'all') return true;
    return item.type === activeTab;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* الهيدر العلوي */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">إدارة وتوجيه الآليات والمعدات</h1>
            <p className="text-sm text-slate-500 mt-1">المتابعة الفنية والتشغيلية لأسطول شركة وادي دفا</p>
          </div>
          
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 self-start md:self-auto text-sm"
          >
            ➕ تسجيل آلية جديدة
          </button>
        </div>

        {/* أزرار الفلترة (Tabs) */}
        <div className="flex bg-slate-200/60 p-1.5 rounded-xl w-fit gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-all ${
              activeTab === 'all' ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            📋 الكل ({equipmentList.length})
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-all ${
              activeTab === 'equipment' ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            ⚙️ المعدات ({equipmentList.filter(i => i.type === 'equipment').length})
          </button>
          <button
            onClick={() => setActiveTab('vehicle')}
            className={`px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-all ${
              activeTab === 'vehicle' ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            🚚 المركبات ({equipmentList.filter(i => i.type === 'vehicle').length})
          </button>
        </div>

        {/* الجدول الرئيسي */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">جاري سحب بيانات الأسطول حياً...</div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center text-slate-400">لا توجد آليات مسجلة in هذا القسم حالياً.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-100">
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
                      {/* الكود */}
                      <td className="p-4 font-bold text-blue-600 tracking-wider uppercase">{item.code}</td>
                      {/* الاسم */}
                      <td className="p-4 font-medium">{item.name}</td>
                      {/* التصنيف */}
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.type === 'equipment' ? 'bg-orange-50 text-orange-700' : 'bg-purple-50 text-purple-700'
                        }`}>
                          {item.type === 'equipment' ? '⚙️ معدة' : '🚚 مركبة'}
                        </span>
                      </td>
                      {/* المعرف الفريد */}
                      <td className="p-4 font-mono text-xs text-slate-600">
                        {item.type === 'equipment' ? item.serialNumber : item.plateNumber}
                      </td>
                      {/* المشروع */}
                      <td className="p-4">
                        <span className="text-slate-800 font-medium">
                          {item.projectName || '⚠️ غير منزلة بموقع (الورشة)'}
                        </span>
                      </td>
                      {/* الحالة */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.status === 'available' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${item.status === 'available' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {item.status === 'available' ? 'جاهز للعمل' : 'تعطلت'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* 1. مودال إضافة آلية جديدة */}
      <AddEquipmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchEquipment}
      />

      {/* 2. مودال بروفايل المعدة (الأعطال والمشتريات) المربوط كلياً هسي */}
      <EquipmentProfileModal
        equipment={selectedEquipment}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onRefresh={fetchEquipment}
      />
    </div>
  );
};
