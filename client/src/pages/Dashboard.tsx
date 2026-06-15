// client/src/pages/Dashboard.tsx
import React, { useState } from 'react';
import { Fleet } from './Fleet';
import { Reports } from './Reports';
import { Profile } from './Profile';

interface DashboardProps {
  user: { id: number; name: string; username: string; role: 'super_admin' | 'sub_admin' | 'viewer' };
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState<'hub' | 'fleet' | 'reports' | 'profile'>('hub');
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'} transition-colors duration-300 font-sans`} dir="rtl">
      
      {/* الهيدر الرئيسي الموحد */}
      <header className={`border-b ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-blue-900 border-blue-800'} text-white px-6 py-5 sticky top-0 z-40 shadow-sm`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* الجانب الأيمن: اسم الشركة والوصف الرسمي */}
          <div className="flex items-center gap-4">
            {currentView !== 'hub' && (
              <button 
                onClick={() => setCurrentView('hub')} 
                className="bg-white text-blue-900 hover:bg-slate-100 px-4 py-2 rounded-xl transition-all border-0 cursor-pointer text-sm font-bold shadow-sm"
              >
                العودة للرئيسية
              </button>
            )}
            <div>
              <h1 className="text-xl md:text-3xl font-black text-amber-400 m-0 tracking-wide">شركة وادي دفا للمقاولات</h1>
              <p className="text-sm md:text-base text-slate-200 font-medium m-0 mt-1">نظام إدارة صيانة الآليات والمعدات</p>
            </div>
          </div>

          {/* الجانب الأيسر: التحكم والملف الشخصي والخروج */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border-0 text-white cursor-pointer text-lg transition-all"
              title="تبديل مظهر الإضاءة"
            >
              {isDarkMode ? 'وضع الإضاءة الفاتحة' : 'وضع الإضاءة الداكنة'}
            </button>
            
            <button 
              onClick={() => setCurrentView('profile')} 
              className={`px-5 py-2.5 rounded-xl text-base font-black shadow-md border-0 text-white cursor-pointer transition-all ${currentView === 'profile' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-700 hover:bg-blue-800'}`}
            >
              المستخدم: {user.name}
            </button>

            <button 
              onClick={onLogout} 
              className="bg-red-600 hover:bg-red-700 text-white border-0 px-4 py-2.5 rounded-xl text-base font-black cursor-pointer transition-all shadow-sm"
            >
              تسجيل الخروج
            </button>
          </div>

        </div>
      </header>

      {/* المحتوى الداخلي للنظام */}
      <main className="max-w-5xl mx-auto p-6 md:p-12">
        
        {/* الشاشة الرئيسية - أزرار التوجيه الكبيرة والنظيفة لمسؤول الصيانة */}
        {currentView === 'hub' && (
          <div className="min-h-[50vh] flex flex-col justify-center items-center py-6">
            <div className="w-full max-w-2xl space-y-6">
              
              {/* زر التوجيه لصفحة الأسطول */}
              <button 
                onClick={() => setCurrentView('fleet')} 
                className={`w-full text-right p-8 rounded-2xl border-2 border-solid transition-all transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-between group cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-blue-500 text-white' : 'bg-white border-blue-200 hover:border-blue-700 text-slate-900 shadow-md'}`}
              >
                <div className="space-y-2">
                  <h3 className="text-xl md:text-2xl font-black text-blue-900 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors m-0">
                    إدارة الأسطول (الآليات والمركبات)
                  </h3>
                  <p className="text-sm md:text-base text-slate-800 dark:text-slate-300 font-bold m-0 leading-relaxed">
                    عرض المعدات الثقيلة والسيارات، تحديث الحالة التشغيلية، ومتابعة الأعطال الحالية.
                  </p>
                </div>
              </button>

              {/* زر التوجيه لصفحة التقارير */}
              <button 
                onClick={() => setCurrentView('reports')} 
                className={`w-full text-right p-8 rounded-2xl border-2 border-solid transition-all transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-between group cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-blue-500 text-white' : 'bg-white border-blue-200 hover:border-blue-700 text-slate-900 shadow-md'}`}
              >
                <div className="space-y-2">
                  <h3 className="text-xl md:text-2xl font-black text-blue-900 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors m-0">
                    التقارير الفنية وبيانات الحصر
                  </h3>
                  <p className="text-sm md:text-base text-slate-800 dark:text-slate-300 font-bold m-0 leading-relaxed">
                    استخراج ومراجعة كشوفات الأعطال الفنية، طباعة تقارير الصيانة، وفرز السجلات بحسب التواريخ.
                  </p>
                </div>
              </button>

            </div>
          </div>
        )}

        {/* استدعاء صفحة إدارة الأسطول المستقلة */}
        {currentView === 'fleet' && (
          <Fleet isDarkMode={isDarkMode} userRole={user.role} />
        )}

        {/* استدعاء صفحة التقارير المستقلة */}
        {currentView === 'reports' && (
          <Reports isDarkMode={isDarkMode} />
        )}

        {/* استدعاء صفحة الحساب الشخصي */}
        {currentView === 'profile' && (
          <Profile user={user} isDarkMode={isDarkMode} />
        )}

      </main>

    </div>
  );
};
