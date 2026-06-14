// client/src/pages/Login.tsx
import { useState } from "react";

interface LoginProps {
  // تحديث الأنواع لتتطابق تماماً مع متطلبات ملف App.tsx وتمنع الخطأ البرمجي
  onLogin: (user: { id: number; username: string; name: string; role: 'super_admin' | 'viewer' }) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const baseUrl = import.meta.env.VITE_API_URL || "";
    try {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // تمرير البيانات كاملة كما يستقبلها السيرفر لتغذية الستيت في التطبيق الرئيسي
        onLogin({ 
          id: data.user.id,
          username: data.user.username,
          name: data.user.name, 
          role: data.user.role 
        });
      } else {
        setError(data.message || "بيانات الدخول غير صحيحة");
      }
    } catch (err) {
      setError("حدث خطأ في الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A192F] p-4 font-sans" dir="rtl">
      <div className="w-full max-w-md bg-[#112240] border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        
        {/* منطقة الشعار الرسمي للشركة */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-28 h-28 rounded-xl overflow-hidden bg-white p-1 shadow-md">
            <img 
              src="/logo.jpg" 
              alt="شعار دفا للمقاولات" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">نظام إدارة حركية الأسطول</h1>
            <p className="text-xs text-slate-400 mt-1">شركة دفا للمقاولات المحدودة</p>
          </div>
        </div>

        <hr className="border-slate-800" />

        {/* فورم تسجيل الدخول */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">اسم المستخدم</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="اكتب اسم المستخدم المعتمد"
              className="w-full px-4 py-2.5 bg-[#0A192F] border border-slate-800 rounded-lg text-sm text-white outline-none focus:border-blue-600 transition-all text-right"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">كلمة المرور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-[#0A192F] border border-slate-800 rounded-lg text-sm text-white outline-none focus:border-blue-600 transition-all text-left font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-blue-600/10"
          >
            {loading ? "جاري التحقق من الهوية..." : "تسجيل الدخول الآمن"}
          </button>
        </form>

        <div className="text-center">
          <p className="text-[10px] text-slate-500">© 2026 بوابة الإدارة الرقمية المشفرة - دفا</p>
        </div>

      </div>
    </div>
  );
}
