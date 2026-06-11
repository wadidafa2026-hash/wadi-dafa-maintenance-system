import { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// تعريف نوع بيانات المستخدم والصلاحية
interface User {
  id: number;
  username: string;
  name: string;
  role: 'super_admin' | 'viewer';
}

function App() {
  // قراءة المستخدم المخزن في المتصفح تلقائياً عند تحميل الصفحة
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('wadi_dafa_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // دالة تسجيل الدخول: تحفظ البيانات في الـ State وفي كاش المتصفح لضمان عدم الخروج
  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('wadi_dafa_user', JSON.stringify(userData));
  };

  // دالة تسجيل الخروج: تنظف الـ State وتمسح الكاش تماماً
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('wadi_dafa_user');
  };

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {!user ? (
        // تمرير دالة الحفظ الذكية لصفحة اللوجين
        <Login onLogin={handleLogin} />
      ) : (
        // تمرير بيانات المستخدم ودالة الخروج الآمنة للوحة التحكم
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
