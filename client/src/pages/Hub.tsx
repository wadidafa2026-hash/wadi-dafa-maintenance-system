// client/src/pages/Hub.tsx
import React from 'react';
import { Link } from 'react-router-dom';

interface HubProps {
  isDarkMode: boolean;
}

export const Hub: React.FC<HubProps> = ({ isDarkMode }) => {
  return (
    <div className="min-h-[55vh] flex flex-col justify-center items-center py-12" dir="rtl">
      <div className="w-full max-w-xl space-y-5">
        
        {/* كرت رابط صفحة الآليات والمركبات */}
        <Link to="/fleet" className={`w-full text-right p-7 rounded-2xl border transition-all transform hover:-translate-y-1 hover:shadow-lg flex items-center justify-between group no-underline decoration-transparent ${isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-blue-500 text-slate-100' : 'bg-white border-slate-100 hover:border-blue-500 shadow-sm text-slate-800'}`}>
          <div className="space-y-1">
            <h3 className="text-lg font-black group-hover:text-blue-500 transition-colors m-0">🚚 الآليات والمركبات</h3>
            <p className="text-xs text-slate-400 m-0 mt-1">إدارة الأسطول، فصل التابات، رصد وتحديث الحالات التشغيلية والمواقع الفورية.</p>
          </div>
          <span className="text-2xl bg-blue-500/10 p-3.5 rounded-xl group-hover:scale-110 transition-transform">⚙️</span>
        </Link>

        {/* كرت رابط صفحة التقارير الذكية */}
        <Link to="/reports" className={`w-full text-right p-7 rounded-2xl border transition-all transform hover:-translate-y-1 hover:shadow-lg flex items-center justify-between group no-underline decoration-transparent ${isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-amber-500 text-slate-100' : 'bg-white border-slate-100 hover:border-amber-500 shadow-sm text-slate-800'}`}>
          <div className="space-y-1">
            <h3 className="text-lg font-black group-hover:text-amber-500 transition-colors m-0">📊 التقارير</h3>
            <p className="text-xs text-slate-400 m-0 mt-1">مراجعة كشوفات الأعطال الفنية الشاملة وسجل المشتريات والقطع المالي المربوط.</p>
          </div>
          <span className="text-2xl bg-amber-500/10 p-3.5 rounded-xl group-hover:scale-110 transition-transform">📉</span>
        </Link>

      </div>
    </div>
  );
};
