import { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// تعريف نوع بيانات المستخدم الصلاحية
interface User {
  id: number;
  username: string;
  name: string;
  role: 'super_admin' | 'viewer';
}

function App() {
  // كرت الحفظ حق المستخدم الحالي (لو null معناه ما مسجل دخول)
  const [user, setUser] = useState<User | null>(null);

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {!user ? (
        // لو ما مسجل دخول، اعرض صفحة تسجيل الدخول ومرر ليها دالة الحفظ
        <Login onLogin={setUser} />
      ) : (
        // لو مسجل دخول، افتح اللوحة الرئيسية ومرر بياناته ودالة الخروج
        <Dashboard user={user} onLogout={() => setUser(null)} />
      )
    }
    </div>
  );
}

export default App;
