// client/src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Fleet } from './Fleet';
import { Reports } from './Reports';
import { Profile } from './Profile';

interface DashboardProps {
  user: { id: number; name: string; username: string; role: 'super_admin' | 'sub_admin' | 'viewer' };
  onLogout: () => void;
}

type ViewType = 'hub' | 'fleet' | 'reports' | 'profile';

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  // حل مشكلة الريفرش عبر ربط واجهة المستخدم بالـ Hash الخاص بالرابط تلقائياً
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    const hash = window.location.hash.replace('#', '') as ViewType;
    return ['hub', 'fleet', 'reports', 'profile'].includes(hash) ? hash : 'hub';
  });

  // مزامنة التغييرات في الرابط عند انتقال المستخدم بين الصفحات
  useEffect(() => {
    window.location.hash = currentView;
  }, [currentView]);

  // الاستماع لتغييرات الرابط في حال استخدام أزرار التقدم والرجوع في المتصفح
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as ViewType;
      if (['hub', 'fleet', 'reports', 'profile'].includes(hash)) {
        setCurrentView(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="min-h-screen w-full bg-white text-black font-sans antialiased select-none" dir="rtl">
      
      {/* ─── الهيدر الرئيسي: يظهر فقط في شاشة التحكم الرئيسية (Hub) لتوفير مساحة رؤية كاملة ─── */}
      {currentView === 'hub' && (
        <header className="bg-white border-b-4 border-solid border-black px-6 py-8 w-full box-border">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            
            <div className="text-right space-y-2">
              <h1 className="text-3xl md:text-5xl font-black text-black m-0 tracking-tight">
                شركة وادي دفا للمقاولات
              </h1>
              <p className="text-lg md:text-2xl font-bold text-black m-0">
                نظام إدارة صيانة المعدات والمركبات
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
              <button 
                onClick={() => setCurrentView('profile')} 
                className="px-6 py-4 rounded-none bg-white border-4 border-solid border-black text-black text-lg font-black tracking-wide cursor-pointer active:bg-black active:text-white transition-colors"
              >
                حساب المستخدم: {user.name}
              </button>

              <button 
                onClick={onLogout} 
                className="bg-black text-white border-4 border-solid border-black px-6 py-4 rounded-none text-lg font-black cursor-pointer hover:bg-red-700 hover:border-red-700 transition-colors"
              >
                تسجيل الخروج من النظام
              </button>
            </div>

          </div>
        </header>
      )}

      {/* ─── الحاوية التشغيلية الرئيسية للسيستم ─── */}
      <main className="max-w-7xl mx-auto p-6 md:p-12 w-full box-border">
        
        {/* شاشة التحكم الرئيسية واختيار الأقسام (Hub View) */}
        {currentView === 'hub' && (
          <div className="py-6 space-y-8">
            
            <div className="border-4 border-solid border-black p-6 bg-white">
              <h2 className="text-2xl md:text-3xl font-black m-0 text-black">
                مرحباً بك في لوحة التحكم الرئيسية. الرجاء اختيار القسم المطلوب أدناه:
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* خيار إدارة الأسطول */}
              <button 
                onClick={() => setCurrentView('fleet')} 
                className="w-full text-right p-8 bg-white border-4 border-solid border-black rounded-none shadow-none flex flex-col justify-between cursor-pointer hover:bg-black hover:text-white group transition-colors"
              >
                <div className="space-y-4">
                  <h3 className="text-2xl md:text-4xl font-black m-0 text-black group-hover:text-white">
                    إدارة الأسطول (المعدات والمركبات)
                  </h3>
                  <p className="text-base md:text-xl font-bold m-0 leading-relaxed text-black group-hover:text-white">
                    عرض وتتبع كشوفات المعدات الثقيلة والمركبات، تحديث الحالات التشغيلية الفورية، ورصد بلاغات الأعطال.
                  </p>
                </div>
              </button>

              {/* خيار التقارير الفنية */}
              <button 
                onClick={() => setCurrentView('reports')} 
                className="w-full text-right p-8 bg-white border-4 border-solid border-black rounded-none shadow-none flex flex-col justify-between cursor-pointer hover:bg-black hover:text-white group transition-colors"
              >
                <div className="space-y-4">
                  <h3 className="text-2xl md:text-4xl font-black m-0 text-black group-hover:text-white">
                    التقارير الفنية وبيانات الحصر
                  </h3>
                  <p className="text-base md:text-xl font-bold m-0 leading-relaxed text-black group-hover:text-white">
                    استخراج ومراجعة كشوفات الصيانة الدورية، فرز وتصفية سجلات المشتريات المالية، وطباعة التقارير المعتمدة.
                  </p>
                </div>
              </button>

            </div>
          </div>
        )}

        {/* ─── عرض الصفحات الداخلية بعد إخفاء الهيدر (مع توفير زر عودة صريح وضخم للرئيسية) ─── */}
        {currentView !== 'hub' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-6 border-b-4 border-solid border-black no-print">
              <button 
                onClick={() => setCurrentView('hub')} 
                className="bg-black text-white px-8 py-4 border-4 border-solid border-black font-black text-lg cursor-pointer hover:bg-white hover:text-black transition-colors"
              >
                الرجوع إلى الشاشة الرئيسية
              </button>
              
              <div className="text-left font-black text-xl text-black">
                المستخدم الحالي: {user.name}
              </div>
            </div>

            <div className="pt-4">
              {currentView === 'fleet' && <Fleet isDarkMode={false} userRole={user.role} />}
              {currentView === 'reports' && <Reports isDarkMode={false} />}
              {currentView === 'profile' && <Profile user={user} isDarkMode={false} />}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
