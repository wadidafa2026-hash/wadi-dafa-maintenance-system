// client/src/components/Header.tsx
import React from 'react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  user: { name: string; username: string; role: 'super_admin' | 'sub_admin' | 'viewer' };
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ user, isDarkMode, setIsDarkMode }) => {
  return (
    <header className={`border-b ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-900 border-slate-700'} text-white px-4 md:px-8 py-4 sticky top-0 z-40 shadow-md`} dir="rtl">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        {/* القسم الأيمن: شعار الشركة وزر العودة السريعة */}
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all text-xs font-bold text-white no-underline decoration-transparent">
            ↩️ الرئيسية
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-amber-400 m-0">شركة وادي دفا للمقاولات</h1>
            <p className="text-xs text-slate-300 font-medium opacity-95 m-0 mt-0.5">نظام إدارة وصيانة الآليات والمعدات الفني</p>
          </div>
        </div>

        {/* القسم الأيسر: وضع الليل والنهار + زر صفحة البروفايل الجديدة */}
        <div className="flex items-center gap-4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-lg transition-all border-0 cursor-pointer">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          
          {/* هنا حولنا زر البروفايل لرابط حقيقي ينقلك لصفحة البروفايل */}
          <Link to="/profile" className="flex items-center gap-2 bg-gradient-to-l from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md no-underline decoration-transparent">
            👤 {user.name}
          </Link>
        </div>

      </div>
    </header>
  );
};
