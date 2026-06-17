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
    <div className={`min-h-screen w-full overflow-x-hidden ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'} transition-colors duration-300 font-sans`} dir="rtl">
      
      {/* هيدر مرن متجاوب 100% ولا يخرج عن حدود الجوال */}
      <header className={`border-b ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-blue-900 border-blue-800'} text-white px-4 md:px-6 py-4 sticky top-0 z-40 shadow-sm w-full box-border`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* الجانب الأيمن */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            {currentView !== 'hub' && (
              <button 
                onClick={() => setCurrentView('hub')} 
                className="bg-white text-blue-900 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition-all border-0 cursor-pointer text-xs md:text-sm font-bold shadow-sm shrink-0"
              >
                الرئيسية
              </button>
            )}
            <div className="text-right">
              <h1 className="text-lg md:text-2xl font-black text-amber-400 m-0 tracking-wide">شركة وادي دفا للمقاولات</h1>
              <p className="text-xs md:text-sm text-slate-200 font-medium m-0 mt-0.5">نظام إدارة صيانة الآليات والمعدات</p>
            </div>
          </div>

          {/* الجانب الأيسر - أزرار مرنة تنزل تحت بعضها في الجوالات الصغيرة لتفادي الاختلال */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 md:gap-4 w-full sm:w-auto">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border-0 text-white cursor-pointer text-xs transition-all"
            >
              {isDarkMode ? '🌞 وضع إضاءة' : '🌙 وضع داكن'}
            </button>
            
            <button 
              onClick={() => setCurrentView('profile')} 
              className={`px-3 py-2 rounded-xl text-xs font-black shadow-md border-0 text-white cursor-pointer transition-all ${currentView === 'profile' ? 'bg-amber-500' : 'bg-blue-700'}`}
            >
              المستخدم: {user.name}
            </button>

            <button 
              onClick={onLogout} 
              className="bg-red-600 hover:bg-red-700 text-white border-0 px-3 py-2 rounded-xl text-xs font-black cursor-pointer transition-all shadow-sm"
            >
              خروج
            </button>
          </div>

        </div>
      </header>

      {/* الحاوية الرئيسية مضبوطة العرض تماماً ومحمية من التمدد */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 w-full box-border overflow-x-hidden">
        
        {currentView === 'hub' && (
          <div className="min-h-[50vh] flex flex-col justify-center items-center py-4">
            <div className="w-full max-w-2xl space-y-4 md:space-y-6">
              
              <button 
                onClick={() => setCurrentView('fleet')} 
                className={`w-full text-right p-6 md:p-8 rounded-2xl border-2 border-solid transition-all transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-between group cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-blue-200 text-slate-900 shadow-md'}`}
              >
                <div className="space-y-1 md:space-y-2">
                  <h3 className="text-lg md:text-2xl font-black text-blue-900 dark:text-blue-400 m-0">
                    إدارة الأسطول (الآليات والمركبات)
                  </h3>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 font-bold m-0 leading-relaxed">
                    عرض المعدات الثقيلة والسيارات، تحديث الحالة التشغيلية، ومتابعة الأعطال الحالية.
                  </p>
                </div>
              </button>

              <button 
                onClick={() => setCurrentView('reports')} 
                className={`w-full text-right p-6 md:p-8 rounded-2xl border-2 border-solid transition-all transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-between group cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-blue-200 text-slate-900 shadow-md'}`}
              >
                <div className="space-y-1 md:space-y-2">
                  <h3 className="text-lg md:text-2xl font-black text-blue-900 dark:text-blue-400 m-0">
                    التقارير الفنية وبيانات الحصر
                  </h3>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 font-bold m-0 leading-relaxed">
                    استخراج ومراجعة كشوفات الأعطال الفنية، طباعة تقارير الصيانة، وفرز السجلات.
                  </p>
                </div>
              </button>

            </div>
          </div>
        )}

        {currentView === 'fleet' && <Fleet isDarkMode={isDarkMode} userRole={user.role} />}
        {currentView === 'reports' && <Reports isDarkMode={isDarkMode} />}
        {currentView === 'profile' && <Profile user={user} isDarkMode={isDarkMode} />}

      </main>
    </div>
  );
};
