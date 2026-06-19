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
  // 🛡️ جلب رابط السيرفر الأساسي من متغيرات البيئة لمنع تضارب الاتصال
  const baseUrl = import.meta.env.VITE_API_URL || "";

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
      // 🌟 تعديل المسار ليتوافق مع آلية الباك إند المباشرة الموثقة عندك
      const res = await fetch(`${baseUrl}/api/users`); 
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
      // 🌟 تعديل مسار تحديث كلمة المرور المباشر
      const res = await fetch(`${baseUrl}/api/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: user.username, 
          currentPassword, 
          newPassword 
        })
      });
      if (res.ok) {
        setPasswordMsg({ text: '✅ تم تحديث كلمة المرور بنجاح!', isError: false });
        setCurrentPassword('');
        setNewPassword('');
      } else {
        const data = await res.json();
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
      // 🌟 تعديل مسار إضافة حساب مستخدم جديد المباشر
      const res = await fetch(`${baseUrl}/api/users`, {
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 box-border w-full text-black" dir="rtl">
      
      {/* 👤 العمود الأيمن: بطاقة بيانات الحساب الحالي + تغيير الباسورد */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* كرت تفاصيل الحساب الحالي */}
        <div className="p-6 rounded-xl border-4 border-solid border-black bg-white shadow-md">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-blue-100 text-blue-900 text-3xl flex items-center justify-center rounded-full mx-auto font-black border-2 border-solid border-black">
              👤
            </div>
            <div>
              <h3 className="text-lg font-black text-black m-0">{user.name}</h3>
              <p className="text-sm font-black text-blue-950 m-0 mt-1 bg-slate-100 py-1 px-2 rounded border border-solid border-black inline-block" dir="ltr">@{user.username}</p>
            </div>
            <div className="pt-2">
              <span className={`inline-block px-4 py-1.5 rounded text-xs font-black border-2 border-solid ${user.role === 'super_admin' ? 'bg-red-100 text-red-900 border-red-700' : user.role === 'sub_admin' ? 'bg-blue-100 text-blue-900 border-blue-900' : 'bg-slate-100 text-slate-900 border-slate-700'}`}>
                {user.role === 'super_admin' ? '👑 مدير النظام العام' : user.role === 'sub_admin' ? '🔧 مشرف صيانة فرعي' : '👁️ صلاحية عرض فقط'}
              </span>
            </div>
          </div>
        </div>

        {/* كرت تغيير كلمة المرور */}
        <div className="p-6 rounded-xl border-4 border-solid border-black bg-white shadow-md">
          <h4 className="text-sm font-black text-blue-900 m-0 mb-4">🔐 تحديث أمان الحساب (كلمة المرور):</h4>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-black block font-black">كلمة المرور الحالية:</label>
              <input 
                type="password" 
                required 
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)} 
                className="w-full px-3 py-2.5 text-sm font-black rounded border-2 border-solid border-black bg-white text-blue-900 outline-none focus:border-blue-900 shadow-sm" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-black block font-black">كلمة المرور الجديدة:</label>
              <input 
                type="password" 
                required 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                className="w-full px-3 py-2.5 text-sm font-black rounded border-2 border-solid border-black bg-white text-blue-900 outline-none focus:border-blue-900 shadow-sm" 
              />
            </div>
            {passwordMsg.text && (
              <p className={`text-xs font-black p-2 rounded border border-solid ${passwordMsg.isError ? 'bg-red-100 text-red-900 border-red-700' : 'bg-emerald-100 text-emerald-900 border-emerald-700'}`}>{passwordMsg.text}</p>
            )}
            <button 
              type="submit" 
              className="w-full bg-blue-900 hover:bg-blue-950 text-white text-sm font-black py-3 rounded-lg border-2 border-solid border-black cursor-pointer transition-all active:scale-95 shadow"
            >
              🔄 حفظ وتحديث الباسورد الشخصي
            </button>
          </form>
        </div>

      </div>

      {/* 👑 العمود الأيسر: لوحة التحكم في الصلاحيات والمشرفين */}
      <div className="lg:col-span-2">
        {user.role === 'super_admin' ? (
          <div className="p-6 rounded-xl border-4 border-solid border-black bg-white space-y-6 shadow-md">
            <div>
              <h3 className="text-base font-black text-blue-900 m-0">🛠️ لوحة تحكم وإصدار صلاحيات المشرفين</h3>
              <p className="text-xs text-black font-black m-0 mt-1">بصفتك مديراً عاماً للنظام، يمكنك منح أو سحب صلاحيات المراقبة والصيانة لشركة وادي دفا.</p>
            </div>

            {/* نموذج إضافة حساب مشرف جديد */}
            <form onSubmit={handleCreateAdmin} className="p-4 rounded-xl bg-slate-50 border-2 border-solid border-black grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-black block font-black">اسم المشرف الكامل:</label>
                <input 
                  type="text" 
                  required 
                  placeholder="مثال: المهندس أحمد محمد" 
                  value={newAdminName} 
                  onChange={(e) => setNewAdminName(e.target.value)} 
                  className="w-full px-3 py-2.5 text-sm font-black rounded border-2 border-solid border-black bg-white text-black placeholder:text-slate-400 outline-none focus:border-blue-900" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-black block font-black">اسم المستخدم (بالإنجليزي للدخول):</label>
                <input 
                  type="text" 
                  required 
                  placeholder="مثال: ahmed_eng" 
                  value={newAdminUsername} 
                  onChange={(e) => setNewAdminUsername(e.target.value)} 
                  className="w-full px-3 py-2.5 text-sm font-black rounded border-2 border-solid border-black bg-white text-black placeholder:text-slate-400 outline-none focus:border-blue-900" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-black block font-black">كلمة المرور الأولية للحساب:</label>
                <input 
                  type="password" 
                  required 
                  value={newAdminPassword} 
                  onChange={(e) => setNewAdminPassword(e.target.value)} 
                  className="w-full px-3 py-2.5 text-sm font-black rounded border-2 border-solid border-black bg-white text-black outline-none focus:border-blue-900" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-black block font-black">نوع ومستوى الصلاحية الممنوحة:</label>
                <select 
                  value={newAdminRole} 
                  onChange={(e) => setNewAdminRole(e.target.value as any)} 
                  className="w-full px-3 py-2.5 rounded border-2 border-solid border-black text-sm font-black bg-white text-black outline-none focus:border-blue-900 cursor-pointer"
                >
                  <option value="sub_admin" className="font-black text-black">🔧 مشرف صيانة فرعي (إضافة وتسجيل أعطال ومشتريات)</option>
                  <option value="viewer" className="font-black text-black">👁️ مراقب فقط / Viewer (عرض وتقارير وطباعة فقط)</option>
                </select>
              </div>
              
              {adminMsg && (
                <p className="text-xs font-black text-blue-900 md:col-span-2 m-0 bg-amber-100 p-2 rounded border border-solid border-black">{adminMsg}</p>
              )}
              
              <div className="md:col-span-2 flex justify-end pt-2 border-t border-solid border-black/10">
                <button 
                  type="submit" 
                  className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-black px-6 py-2.5 rounded-lg border-2 border-solid border-black cursor-pointer shadow-md transition-all active:scale-95"
                >
                  ✨ إصدار وتفعيل الصلاحية فوراً
                </button>
              </div>
            </form>

            {/* جدول عرض الطاقم الإداري */}
            <div className="space-y-3">
              <h4 className="text-sm font-black text-black m-0">📋 الحسابات الإدارية النشطة حالياً بالنظام:</h4>
              <div className="border-2 border-solid border-black rounded-lg overflow-hidden text-sm bg-white">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-black text-white font-black">
                      <th className="p-3 border-b-2 border-solid border-black">الاسم</th>
                      <th className="p-3 border-b-2 border-solid border-black">اسم المستخدم للدخول</th>
                      <th className="p-3 border-b-2 border-solid border-black text-center">مستوى الصلاحية الموثق</th>
                    </tr>
                  </thead>
                  <tbody className="font-black text-black">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-100 border-b border-solid border-black/20">
                        <td className="p-3 border-l border-solid border-black/10">{u.name}</td>
                        <td className="p-3 font-mono font-black text-blue-900 border-l border-solid border-black/10">@{u.username}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-3 py-0.5 rounded text-xs font-black border border-solid ${u.role === 'super_admin' ? 'bg-red-100 text-red-900 border-red-700' : u.role === 'sub_admin' ? 'bg-blue-100 text-blue-900 border-blue-900' : 'bg-slate-100 text-slate-900 border-slate-700'}`}>
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
          <div className="p-8 rounded-xl border-4 border-solid border-black bg-white text-center space-y-3 shadow-md">
            <span className="text-4xl block">🔒</span>
            <h4 className="text-base font-black text-black m-0">قسم الصلاحيات والتحكم الإداري مقفل</h4>
            <p className="text-sm max-w-md mx-auto leading-relaxed font-black text-slate-800">
              تعديل الصلاحيات وإصدار حسابات المشرفين الجدد هي ميزة حصرية ومحمية لـ <span className="text-blue-900 underline font-black">مدير النظام العام (Super Admin)</span> لشركة وادي دفا فقط.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
