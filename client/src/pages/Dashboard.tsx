// client/src/pages/Dashboard.tsx
import React, { useState } from 'react';
import { Fleet } from './Fleet';
import { Reports } from './Reports';
import { Profile } from './Profile';
import { AiChat } from './AiChat'; // ➕ استيراد صفحة الشات المستقلة التي أنشأتها

interface DashboardProps {
  user: { id: number; name: string; username: string; role: 'super_admin' | 'sub_admin' | 'viewer' };
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  // ⚙️ تم تحديث الحالة لتدعم التوجيه لصفحة الذكاء الاصطناعي الجديدة 'ai_chat'
  const [currentView, setCurrentView] = useState<'hub' | 'fleet' | 'reports' | 'profile' | 'ai_chat'>('hub');
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className={`min-h-screen w-full overflow-x-hidden ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-300 font-sans`} dir="rtl">
      
      {/* الهيدر المؤسسي */}
      <header className={`border-b ${isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-slate-900 border-slate-800'} text-white px-4 md:px-6 py-4 sticky top-0 z-40 shadow-md w-full box-border`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* الجانب الأيمن - الهوية الرسمية */}
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            {currentView !== 'hub' && (
              <button 
                onClick={() => setCurrentView('hub')} 
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all border border-solid border-white/20 cursor-pointer text-xs md:text-sm font-semibold shrink-0"
              >
                الرئيسية
              </button>
            )}
            <div className="text-right">
              <h1 className="text-xl md:text-2xl font-bold text-white m-0 tracking-wide">شركة وادي دفا للمقاولات</h1>
              <p className="text-xs md:text-sm text-slate-450 font-normal m-0 mt-1">نظام إدارة صيانة المعدات والمركبات</p>
            </div>
          </div>

          {/* الجانب الأيسر - التحكم والمسؤوليات */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 md:gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-solid border-white/10 text-slate-300 cursor-pointer text-xs font-medium transition-all"
            >
              {isDarkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
            </button>
            
            <button 
              onClick={() => setCurrentView('profile')} 
              className={`px-3 py-2 rounded-lg text-xs font-semibold border border-solid transition-all cursor-pointer ${currentView === 'profile' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
            >
              المستخدم: {user.name}
            </button>

            <button 
              onClick={onLogout} 
              className="bg-red-700/90 hover:bg-red-700 text-white border-0 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-sm"
            >
              تسجيل الخروج
            </button>
          </div>

        </div>
      </header>

      {/* الحاوية الرئيسية للمحتوى */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 w-full box-border overflow-x-hidden">
        
        {currentView === 'hub' && (
          <div className="min-h-[60vh] flex flex-col justify-center items-center py-6">
            <div className="w-full max-w-3xl space-y-4 md:space-y-5">
              
              {/* بطاقة إدارة الأسطول */}
              <button 
                onClick={() => setCurrentView('fleet')} 
                className={`w-full text-right p-6 md:p-8 rounded-xl border border-solid transition-all transform hover:-translate-y-0.5 flex items-center justify-between group cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white hover:border-slate-700' : 'bg-white border-slate-200 text-slate-900 shadow-sm hover:border-slate-300'}`}
              >
                <div className="space-y-2">
                  <h3 className={`text-lg md:text-xl font-bold m-0 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    إدارة الأسطول (المعدات والمركبات)
                  </h3>
                  <p className={`text-xs md:text-sm font-normal m-0 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    عرض ومتابعة المعدات الثقيلة والمركبات، تحديث الحالة التشغيلية الفورية، ومتابعة سجلات الأعطال.
                  </p>
                </div>
              </button>

              {/* بطاقة التقارير */}
              <button 
                onClick={() => setCurrentView('reports')} 
                className={`w-full text-right p-6 md:p-8 rounded-xl border border-solid transition-all transform hover:-translate-y-0.5 flex items-center justify-between group cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white hover:border-slate-700' : 'bg-white border-slate-200 text-slate-900 shadow-sm hover:border-slate-300'}`}
              >
                <div className="space-y-2">
                  <h3 className={`text-lg md:text-xl font-bold m-0 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    التقارير الفنية وبيانات الحصر
                  </h3>
                  <p className={`text-xs md:text-sm font-normal m-0 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    استخراج ومراجعة كشوفات الأعطال الفنية للمعدات، طباعة تقارير الصيانة الدورية، وفرز سجلات الأداء.
                  </p>
                </div>
              </button>

              {/* ➕ بطاقة المستشار الفني والمحلل الذكي الجديدة (تمت إضافتها هندسياً هنا) */}
              <button 
                onClick={() => setCurrentView('ai_chat')} 
                className={`w-full text-right p-6 md:p-8 rounded-xl border border-solid transition-all transform hover:-translate-y-0.5 flex items-center justify-between group cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white hover:border-slate-700' : 'bg-white border-slate-200 text-slate-900 shadow-sm hover:border-slate-300'}`}
              >
                <div className="space-y-2">
                  <h3 className={`text-lg md:text-xl font-bold m-0 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    🤖 المستشار الفني والمحلل الذكي (AI)
                  </h3>
                  <p className={`text-xs md:text-sm font-normal m-0 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    مساحة مستقلة كاملة للدردشة التفاعلية مع الذكاء الاصطناعي لحصر الأعطال المتكررة، تلخيص البيانات، وتوليد التقارير الميدانية فورياً.
                  </p>
                </div>
              </button>

            </div>
          </div>
        )}

        {/* عرض المكونات الفرعية بناءً على التوجيه المحدث */}
        {currentView === 'fleet' && <Fleet isDarkMode={isDarkMode} userRole={user.role} />}
        {currentView === 'reports' && <Reports isDarkMode={isDarkMode} />}
        {currentView === 'profile' && <Profile user={user} isDarkMode={isDarkMode} />}
        {currentView === 'ai_chat' && <AiChat isDarkMode={isDarkMode} />} {/* ➕ عرض صفحة الشات */}

      </main>
    </div>
  );
};
