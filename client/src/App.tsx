// client/src/App.tsx
import { useState } from 'react';
import Login from './pages/Login';
import { Dashboard } from './pages/Dashboard';

// توحيد بنية اليوزر والصلاحيات الـ 3 لتطابق لوحة التحكم والباك إند تماماً
interface User {
  id: number;
  username: string;
  name: string;
  role: 'super_admin' | 'sub_admin' | 'viewer'; 
}

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('wadi_dafa_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('wadi_dafa_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('wadi_dafa_user');
  };

  // 1️⃣ إذا لم يسجل دخول، تظهر شاشة الدخول أولاً
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // 2️⃣ بمجرد نجاح الدخول، الـ Dashboard تتولى الهيدر والتحكم الكامل في الشاشات والتقارير حياً
  return (
    <Dashboard user={user} onLogout={handleLogout} />
  );
}

export default App;
