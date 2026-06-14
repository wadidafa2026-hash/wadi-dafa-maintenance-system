// client/src/App.tsx
import { useState } from 'react';
import Login from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { FinancialReports } from './components/FinancialReports'; // ✅ تم تعديل المسار هنا ليقرأ من الـ components طوالي بدون نقل الملف

interface User {
  id: number;
  username: string;
  name: string;
  role: 'super_admin' | 'viewer';
}

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('wadi_dafa_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // التحكم في الصفحة المعروضة حالياً
  const [currentView, setCurrentView] = useState<'dashboard' | 'reports'>('dashboard');

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('wadi_dafa_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('dashboard');
    localStorage.removeItem('wadi_dafa_user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* شريط التنقل العلوي المشترك (Navbar) - يختفي عند الطباعة */}
      <nav className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md print:hidden">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg text-blue-400">وادي دفا للمقاولات</span>
          <div className="flex gap-4 text-sm font-medium">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`pb-1 transition-colors ${currentView === 'dashboard' ? 'border-b-2 border-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              📊 لوحة التحكم
            </button>
            <button 
              onClick={() => setCurrentView('reports')}
              className={`pb-1 transition-colors ${currentView === 'reports' ? 'border-b-2 border-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              💰 التقارير المالية
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-300">مرحباً: {user.name}</span>
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg font-medium transition-all">🚪 خروج</button>
        </div>
      </nav>

      {/* عرض الصفحة بناءً على الاختيار */}
      <main>
        {currentView === 'dashboard' ? (
          <Dashboard user={user} onLogout={handleLogout} />
        ) : (
          <FinancialReports />
        )}
      </main>
    </div>
  );
}

export default App;
