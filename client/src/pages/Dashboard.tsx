// client/src/pages/Dashboard.tsx
import React, { useState } from 'react';
// استيراد الصفحات المستقلة التي قمنا بإنشائها وعزلها سابقاً
import { Fleet } from './Fleet';
import { Reports } from './Reports';
import { Profile } from './Profile';

interface DashboardProps {
  user: { id: number; name: string; username: string; role: 'super_admin' | 'sub_admin' | 'viewer' };
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  // ─── حالات التحكم في واجهة العرض والوضع الداكن ───────────────────────
  const [currentView, setCurrentView] = useState<'hub' | 'fleet' | 'reports' | 'profile'>('hub');
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} transition-colors duration-300 font-sans`} dir="rtl">
      
      {/* 👑 الهيدر الملكي الموحد لشركة وادي دفا */}
      <header className={`border-b ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-900 border-slate-700'} text-white px-4 md:px-8 py-4 sticky top-0 z-40 shadow-md`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* الجانب الأيمن: شعار الشركة وزر العودة للرئيسية */}
          <div className="flex items-center gap-3">
            {currentView !== 'hub' && (
              <button onClick={() => setCurrentView('hub')} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all border-0 text-white cursor-pointer text-xs font-bold">
                ↩️ الشاشة الرئيسية
              </button>
            )}
            <div>
              <h1 className="text-xl md:text-2xl font-black text-amber-400 m-0">شركة وادي دفا للمقاولات</h1>
              <p className="text-xs text-slate-300 font-medium opacity-95 m-0 mt-0.5">نظام إدارة وصيانة الآليات والمعدات الفني</p>
            </div>
          </div>

          {/* الجانب الأيسر: تبديل الثيم، الملف الشخصي، وتسجيل الخروج السريع */}
          <div className="flex items-center gap-3">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border-0 text-white cursor-pointer text-lg transition-all">
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            
            <button onClick={() => setCurrentView('profile')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-md border-0 text-white cursor-pointer transition-all ${currentView === 'profile' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gradient-to-l from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'}`}>
              👤 {user.name}
            </button>

            <button onClick={onLogout} className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-solid border-red-500/30 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all">
              🚪 خروج
            </button>
          </div>

        </div>
      </header>

      {/* 📋 جسم الواجهة الحاضن للمكونات المعزولة */}
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* 1️⃣ الشاشة الرئيسية (Hub Mode) */}
        {currentView === 'hub' && (
          <div className="min-h-[55vh] flex flex-col justify-center items-center py-12">
            <div className="w-full max-w-xl space-y-5">
              
              {/* كرت التوجيه لصفحة الأسطول */}
              <button onClick={() => setCurrentView('fleet')} className={`w-full text-right p-7 rounded-2xl border border-solid transition-all transform hover:-translate-y-1 hover:shadow-lg flex items-center justify-between group cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-blue-500 text-white' : 'bg-white border-slate-100 hover:border-blue-500 text-slate-800 shadow-sm'}`}>
                <div className="space-y-1">
                  <h3 className="text-lg font-black group-hover:text-blue-500 transition-colors m-0">🚚 الآليات والمركبات (الأسطول)</h3>
                  <p className="text-xs text-slate-400 m-0 mt-1">إدارة المعدات الثقيلة والسيارات، تحديث الحالات التشغيلية، وفتح بلاغات الأعطال فوراَ.</p>
                </div>
                <span className="text-2xl bg-blue-500/10 p-3.5 rounded-xl group-hover:scale-110 transition-transform">⚙️</span>
              </button>

              {/* كرت التوجيه لصفحة التقارير والمالية */}
              <button onClick={() => setCurrentView('reports')} className={`w-full text-right p-7 rounded-2xl border border-solid transition-all transform hover:-translate-y-1 hover:shadow-lg flex items-center justify-between group cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-amber-500 text-white' : 'bg-white border-slate-100 hover:border-amber-500 text-slate-800 shadow-sm'}`}>
                <div className="space-y-1">
                  <h3 className="text-lg font-black group-hover:text-amber-500 transition-colors m-0">📊 التقارير والحصر المالي</h3>
                  <p className="text-xs text-slate-400 m-0 mt-1">مراجعة كشوفات الأعطال الفنية الشاملة، فلاتر النطاق الزمني، وحصر فواتير المشتريات.</p>
                </div>
                <span className="text-2xl bg-amber-500/10 p-3.5 rounded-xl group-hover:scale-110 transition-transform">📉</span>
              </button>

            </div>
          </div>
        )}

        {/* 2️⃣ استدعاء صفحة إدارة الأسطول المستقلة */}
        {currentView === 'fleet' && (
          <Fleet isDarkMode={isDarkMode} userRole={user.role} />
        )}

        {/* 3️⃣ استدعاء صفحة التقارير الذكية المستقلة */}
        {currentView === 'reports' && (
          <Reports isDarkMode={isDarkMode} />
        )}

        {/* 4️⃣ استدعاء صفحة الحساب وإصدار الصلاحيات المستقلة */}
        {currentView === 'profile' && (
          <Profile user={user} isDarkMode={isDarkMode} />
        )}

      </main>

    </div>
  );
};
