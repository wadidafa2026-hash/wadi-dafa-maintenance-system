import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // إرسال الطلب للسيرفر عبر الـ Proxy الـعملناهو قبيل
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'خطأ في اسم المستخدم أو كلمة المرور');
      }

      // لو الحساب صح، مرر بيانات المشرف لملف App الشغالين فيهو
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message || 'فشل الاتصال بالسيرفر، تأكد من تشغيله');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden px-4">
      {/* لمسة الخلفية الهندسة: خطوط شبكية خفيفة */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#2563eb_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <div className="w-full max-w-md z-10">
        {/* قسم اللوقو المؤقت المصمم بالـ CSS الدائري المتناسق */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 bg-[#1e3a8a] rounded-full flex flex-col items-center justify-center shadow-lg border-4 border-white mb-4 relative">
            <span className="text-white text-3xl font-bold tracking-wider">دفا</span>
            <div className="absolute bottom-2 text-white/6xl text-[10px] tracking-widest opacity-80">WADI DAFA</div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 text-center">بوابة إدارة أسطول وادي دفا</h1>
          <p className="text-sm text-slate-500 mt-1">تسجيل الدخول للوصول إلى لوحة التحكم</p>
        </div>

        {/* كرت الفورم الرئيسي */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* خانة اسم المستخدم */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">اسم المستخدم</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-right"
                  placeholder="ادخل اسم المستخدم (مثال: admin)"
                />
              </div>
            </div>

            {/* خانة كلمة المرور */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-left"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* زرار الدخول الذكي */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1e3a8a] hover:bg-blue-800 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'جاري التحقق من الأمان...' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <a href="#" className="text-xs text-blue-600 hover:underline block">نسيت كلمة المرور؟</a>
            <p className="text-xs text-slate-400">ليس لديك حساب؟ اتصل بالمسؤول لتسجيلك</p>
          </div>
        </div>
      </div>

      {/* شريط الآليات التجميلي التحت */}
      <div className="absolute bottom-4 flex gap-6 text-slate-300 opacity-40 text-sm">
        <span>🚜 قلاب</span>
        <span>🏗️ كرين</span>
        <span>🔧 ورشة</span>
        <span>⚡ وادي دفا</span>
      </div>
    </div>
  );
}
