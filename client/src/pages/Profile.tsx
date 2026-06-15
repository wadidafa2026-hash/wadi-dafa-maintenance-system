// client/src/pages/Profile.tsx
import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  username: string;
  role: 'super_admin' | 'sub_admin' | 'viewer';
}

interface ProfileProps {
  user: { name: string; username: string; role: 'super_admin' | 'sub_admin' | 'viewer' };
  isDarkMode: boolean;
}

export const Profile: React.FC<ProfileProps> = ({ user, isDarkMode }) => {
  // ─── حالات تغيير كلمة المرور ───────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ text: '', isError: false });

  // ─── حالات إدارة المستخدمين والصلاحيات (للمدير العام فقط) ───────
  const [usersList, setUsersList] = useState<User[]>([]);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'sub_admin' | 'viewer'>('sub_admin');
  const [adminMsg, setAdminMsg] = useState('');

  // جلب قائمة المستخدمين إذا كان الحساب super_admin
  const fetchUsers = async () => {
    if (user.role !== 'super_admin') return;
    try {
      const res = await fetch('/api/users'); // نقطة الاتصال بالباك إند لجلب النظام
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user.role]);

  // 🔐 دالة تحديث كلمة المرور الشخصية
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg({ text: '', isError: false });

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg({ text: '✅ تم تحديث كلمة المرور بنجاح!', isError: false });
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setPasswordMsg({ text: `❌ ${data.message || 'فشل التحديث'}`, isError: true });
      }
    } catch (err) {
      setPasswordMsg({ text: '❌ خطأ في الاتصال بالسيرفر', isError: true });
    }
  };

  // ➕ دالة إضافة مشرف جديد أو قارئ (حصرية للـ super_admin)
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMsg('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAdminName,
          username: newAdminUsername,
          password: newAdminPassword,
          role: newAdminRole
        })
      });
      if (res.ok) {
        setAdminMsg('✅ تم إصدار الصلاحية وإضافة الحساب بنجاح!');
        setNewAdminName(''); setNewAdminUsername(''); setNewAdminPassword('');
        fetchUsers(); // تحديث القائمة فوراً
      } else {
        const data = await res.json();
        setAdminMsg(`❌ ${data.message || 'فشل إنشاء الحساب'}`);
      }
    } catch (err) {
      setAdminMsg('❌ خطأ في السيرفر');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" dir="rtl">
      
      {/* 👤 العمود الأيمن: بطاقة بيانات الحساب الحالي + تغيير الباسورد */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* كرت تفاصيل الحساب */}
        <div className={`p-6 rounded-2xl border border-solid ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="text-center space-y-3">
            <div className="w-20 h-20 bg-blue-500/10 text-blue-500 text-3xl flex items-center justify-center rounded-full mx-auto font-black">
              👤
            </div>
            <div>
              <h3 className="text-md font-black m-0">{user.name}</h3>
              <p className="text-xs text-slate-400 m-0 mt-1" dir="ltr">@{user.username}</p>
            </div>
            <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${user.role === 'super_admin' ? 'bg-red-500/10 text-red-500' : user.role === 'sub_admin' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-500/10 text-slate-500'}`}>
              {user.role === 'super_admin' ? '👑 مدير النظام العام' : user.role === 'sub_admin' ? '🔧 مشرف صيانة فرعي' : '👁️ صلاحية عرض فقط'}
            </span>
          </div>
        </div>

        {/* كرت تغيير كلمة المرور */}
        <div className={`p-6 rounded-2xl border border-solid ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <h4 className="text-xs font-black text-blue-500 m-0 mb-4">🔐 تحديث أمان الحساب (كلمة المرور):</h4>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 block font-bold">كلمة المرور الحالية:</label>
              <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 block font-bold">كلمة المرور الجديدة:</label>
              <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
            </div>
            {passwordMsg.text && (
              <p className={`text-[11px] font-bold ${passwordMsg.isError ? 'text-red-500' : 'text-emerald-500'}`}>{passwordMsg.text}</p>
            )}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-xl transition-all border-0 cursor-pointer shadow-sm">
              🔄 حفظ وتحديث الباسورد
            </button>
          </form>
        </div>

      </div>

      {/* 👑 العمود الأيسر: لوحة التحكم في الصلاحيات والمشرفين (حصرية للـ super_admin) */}
      <div className="lg:col-span-2">
        {user.role === 'super_admin' ? (
          <div className={`p-6 rounded-2xl border border-solid space-y-6 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div>
              <h3 className="text-sm font-black text-amber-500 m-0">🛠️ لوحة تحكم وإصدار صلاحيات المشرفين</h3>
              <p className="text-xs text-slate-400 m-0 mt-0.5">بصفتك مديراً عاماً للنظام، يمكنك منح أو سحب صلاحيات المراقبة والصيانة لشركة وادي دفا.</p>
            </div>

            {/* نموذج إضافة حساب مشرف جديد */}
            <form onSubmit={handleCreateAdmin} className="p-4 rounded-xl bg-slate-500/5 border border-solid border-slate-500/10 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 block font-bold">اسم المشرف الكامل:</label>
                <input type="text" required placeholder="مثال: المهندس أحمد محمد" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 block font-bold">اسم المستخدم (بالإنجليزي للدخول):</label>
                <input type="text" required placeholder="مثال: ahmed_eng" value={newAdminUsername} onChange={(e) => setNewAdminUsername(e.target.value)} className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 block font-bold">كلمة المرور الأولية للحساب:</label>
                <input type="password" required value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 block font-bold">نوع ومستوى الصلاحية الممنوحة:</label>
                <select value={newAdminRole} onChange={(e) => setNewAdminRole(e.target.value as any)} className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                  <option value="sub_admin">🔧 مشرف صيانة فرعي (إضافة وتسجيل أعطال ومشتريات)</option>
                  <option value="viewer">👁️ مراقب فقط / Viewer (عرض وتقارير وطباعة فقط)</option>
                </select>
              </div>
              {adminMsg && (
                <p className="text-[11px] font-bold text-amber-500 md:col-span-2 m-0">{adminMsg}</p>
              )}
              <div className="md:col-span-2 flex justify-end">
                <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-5 py-2 rounded-xl border-0 cursor-pointer shadow-md transition-all">
                  ✨ إصدار وتفعيل الصلاحية فوراً
                </button>
              </div>
            </form>

            {/* جدول عرض الطاقم الإداري الحالي */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 m-0">📋 الحسابات الإدارية النشطة حالياً:</h4>
              <div className="border border-solid border-slate-500/10 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className={isDarkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-100 text-slate-600'}>
                      <th className="p-3">الاسم</th>
                      <th className="p-3">اسم المستخدم</th>
                      <th className="p-3">مستوى الصلاحية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-solid divide-slate-500/10 font-medium">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-500/5">
                        <td className="p-3">{u.name}</td>
                        <td className="p-3 font-mono text-slate-400">@{u.username}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'super_admin' ? 'bg-red-500/10 text-red-500' : u.role === 'sub_admin' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-500/10 text-slate-500'}`}>
                            {u.role === 'super_admin' ? '👑 مدير عام' : u.role === 'sub_admin' ? '🔧 مشرف فرعي' : '👁️ عرض فقط'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : (
          /* في حال كان الحساب sub_admin أو viewer تظهر له رسالة توضيحية */
          <div className={`p-8 rounded-2xl border border-solid text-center space-y-2 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-100 text-slate-500 shadow-sm'}`}>
            <span className="text-3xl block">🔒</span>
            <h4 className="text-sm font-black text-slate-700 dark:text-slate-200 m-0">قسم الصلاحيات والتحكم الإداري مقفل</h4>
            <p className="text-xs max-w-md mx-auto leading-relaxed">تعديل الصلاحيات وإصدار حسابات المشرفين الجدد هي ميزة حصرية ومحمية لـ **مدير النظام العام (Super Admin)** لشركة وادي دفا فقط.</p>
          </div>
        )}
      </div>

    </div>
  );
};
