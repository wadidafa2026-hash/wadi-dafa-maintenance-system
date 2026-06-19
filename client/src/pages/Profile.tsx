// client/src/pages/Profile.tsx
import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  username: string;
  role: 'super_admin' | 'sub_admin' | 'viewer';
}

interface Project {
  id: number;
  name: string;
  location?: string;
}

interface ProfileProps {
  user: { name: string; username: string; role: 'super_admin' | 'sub_admin' | 'viewer' };
  isDarkMode: boolean;
}

export const Profile: React.FC<ProfileProps> = ({ user, isDarkMode }) => {
  const baseUrl = import.meta.env.VITE_API_URL || "";

  // ─── حالات تغيير كلمة المرور ───────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ text: '', isError: false });

  // ─── حالات إدارة المشرفين ─────────────────────────────────────
  const [usersList, setUsersList] = useState<User[]>([]);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'sub_admin' | 'viewer'>('sub_admin');
  const [adminMsg, setAdminMsg] = useState({ text: '', isError: false });

  // ─── حالات إدارة المشاريع الجديدة ───────────────────────────────
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [projectMsg, setProjectMsg] = useState({ text: '', isError: false });

  // دالة جلب المشرفين والمشاريع
  const fetchUsers = async () => {
    if (user.role !== 'super_admin') return;
    try {
      const res = await fetch(`${baseUrl}/api/auth/users`);
      if (res.ok) setUsersList(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchProjects = async () => {
    if (user.role !== 'super_admin') return;
    try {
      const res = await fetch(`${baseUrl}/api/projects`);
      if (res.ok) setProjectsList(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (user.role === 'super_admin') {
      fetchUsers();
      fetchProjects();
    }
  }, [user.role]);

  // 🔐 تغيير الباسورد الشخصي
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg({ text: '', isError: false });
    try {
      const res = await fetch(`${baseUrl}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg({ text: '✅ تم تحديث كلمة المرور بنجاح!', isError: false });
        setCurrentPassword(''); setNewPassword('');
      } else {
        setPasswordMsg({ text: `❌ ${data.message || 'فشل التحديث'}`, isError: true });
      }
    } catch (err) { setPasswordMsg({ text: '❌ خطأ في الاتصال', isError: true }); }
  };

  // ➕ إضافة مشرف جديد
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMsg({ text: '', isError: false });
    try {
      const res = await fetch(`${baseUrl}/api/auth/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAdminName, username: newAdminUsername, password: newAdminPassword, role: newAdminRole })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminMsg({ text: '✅ تم إضافة الحساب بنجاح!', isError: false });
        setNewAdminName(''); setNewAdminUsername(''); setNewAdminPassword('');
        fetchUsers();
      } else { setAdminMsg({ text: `❌ ${data.message || 'فشل الإنشاء'}`, isError: true }); }
    } catch (err) { setAdminMsg({ text: '❌ خطأ في السيرفر', isError: true }); }
  };

  // 🗑️ حذف مشرف
  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من سحب صلاحية هذا المشرف وحذفه نهائياً؟')) return;
    try {
      const res = await fetch(`${baseUrl}/api/auth/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsers();
      } else { alert('فشل حذف المشرف'); }
    } catch (err) { console.error(err); }
  };

  // 🚧 إضافة مشروع جديد
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjectMsg({ text: '', isError: false });
    if (!newProjectName.trim()) return;

    try {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName.trim() })
      });
      if (res.ok) {
        setProjectMsg({ text: '✅ تم تسجيل الموقع/المشروع بنجاح!', isError: false });
        setNewProjectName('');
        fetchProjects();
      } else { setProjectMsg({ text: '❌ فشل إضافة المشروع', isError: true }); }
    } catch (err) { setProjectMsg({ text: '❌ خطأ في السيرفر', isError: true }); }
  };

  // 🗑️ حذف مشروع
  const handleDeleteProject = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المشروع؟ سيتم فك ارتباطه من الآليات الحالية تلقائياً.')) return;
    try {
      const res = await fetch(`${baseUrl}/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProjects();
      } else { alert('فشل حذف المشروع'); }
    } catch (err) { console.error(err); }
  };

  return (
    // التحكم في تقسيم الشاشة حسب الرتبة لضمان توسيع العرض للمشرف الفرعي بعد إخفاء اللوحة
    <div className={`grid grid-cols-1 ${user.role === 'super_admin' ? 'lg:grid-cols-3' : 'max-w-2xl mx-auto'} gap-6 box-border w-full text-black`} dir="rtl">
      
      {/* 👤 العمود الأيمن: بطاقة المشرف وتغيير الباسورد */}
      <div className="space-y-6">
        <div className="p-6 rounded-xl border-4 border-solid border-black bg-white shadow-md">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-blue-100 text-blue-900 text-3xl flex items-center justify-center rounded-full mx-auto font-black border-2 border-solid border-black">👤</div>
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

        <div className="p-6 rounded-xl border-4 border-solid border-black bg-white shadow-md">
          <h4 className="text-sm font-black text-blue-900 m-0 mb-4">🔐 تحديث أمان الحساب (كلمة المرور):</h4>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-black block font-black">كلمة المرور الحالية:</label>
              <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-3 py-2.5 text-sm font-black rounded border-2 border-solid border-black bg-white text-blue-900 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-black block font-black">كلمة المرور الجديدة:</label>
              <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2.5 text-sm font-black rounded border-2 border-solid border-black bg-white text-blue-900 outline-none" />
            </div>
            {passwordMsg.text && (
              <p className={`text-xs font-black p-2 rounded border border-solid ${passwordMsg.isError ? 'bg-red-100 text-red-900 border-red-700' : 'bg-emerald-100 text-emerald-900 border-emerald-700'}`}>{passwordMsg.text}</p>
            )}
            <button type="submit" className="w-full bg-blue-900 text-white text-sm font-black py-3 rounded-lg border-2 border-solid border-black cursor-pointer shadow">🔄 حفظ وتحديث الباسورد الشخصي</button>
          </form>
        </div>
      </div>

      {/* 👑 العمود الأيسر: متاح فقط للـ super_admin ومخفي تماماً عن الباقين بدون رسائل حجب */}
      {user.role === 'super_admin' && (
        <div className="lg:col-span-2 space-y-6">
          
          {/* لوحة تحكم المشرفين */}
          <div className="p-6 rounded-xl border-4 border-solid border-black bg-white space-y-6 shadow-md">
            <div>
              <h3 className="text-base font-black text-blue-900 m-0">🛠️ لوحة تحكم وإصدار صلاحيات المشرفين</h3>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-4 rounded-xl bg-slate-50 border-2 border-solid border-black grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5"><label className="text-xs text-black block font-black">اسم المشرف الكامل:</label><input type="text" required placeholder="المهندس أحمد" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} className="w-full px-3 py-2.5 text-sm font-black rounded border-2 border-solid border-black" /></div>
              <div className="space-y-1.5"><label className="text-xs text-black block font-black">اسم المستخدم (بالإنجليزي):</label><input type="text" required placeholder="ahmed_eng" value={newAdminUsername} onChange={(e) => setNewAdminUsername(e.target.value)} className="w-full px-3 py-2.5 text-sm font-black rounded border-2 border-solid border-black" /></div>
              <div className="space-y-1.5"><label className="text-xs text-black block font-black">كلمة المرور الأولية:</label><input type="password" required value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} className="w-full px-3 py-2.5 text-sm font-black rounded border-2 border-solid border-black" /></div>
              <div className="space-y-1.5">
                <label className="text-xs text-black block font-black">مستوى الصلاحية:</label>
                <select value={newAdminRole} onChange={(e) => setNewAdminRole(e.target.value as any)} className="w-full px-3 py-2.5 rounded border-2 border-solid border-black text-sm font-black bg-white">
                  <option value="sub_admin">🔧 مشرف صيانة فرعي</option>
                  <option value="viewer">👁️ مراقب فقط / Viewer</option>
                </select>
              </div>
              {adminMsg.text && <p className={`text-xs font-black md:col-span-2 m-0 p-2 rounded border border-solid ${adminMsg.isError ? 'bg-red-100 text-red-900' : 'bg-amber-100 text-amber-900'}`}>{adminMsg.text}</p>}
              <div className="md:col-span-2 flex justify-end pt-2 border-t border-solid border-black/10">
                <button type="submit" className="bg-amber-500 text-white text-sm font-black px-6 py-2.5 rounded-lg border-2 border-solid border-black shadow-md">✨ إصدار وتفعيل الصلاحية فوراً</button>
              </div>
            </form>

            <div className="space-y-3">
              <h4 className="text-sm font-black text-black m-0">📋 الحسابات النشطة حالياً:</h4>
              <div className="border-2 border-solid border-black rounded-lg overflow-hidden text-sm bg-white">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-black text-white font-black">
                      <th className="p-3">الاسم</th>
                      <th className="p-3">اسم المستخدم</th>
                      <th className="p-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="font-black text-black">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-100 border-b border-solid border-black/20">
                        <td className="p-3">{u.name}</td>
                        <td className="p-3 font-mono text-blue-900">@{u.username}</td>
                        <td className="p-3 text-center">
                          {u.username !== user.username ? (
                            <button onClick={() => handleDeleteUser(u.id)} className="bg-red-100 text-red-700 border border-solid border-red-700 rounded px-2 py-1 text-xs cursor-pointer hover:bg-red-200">🗑️ حذف</button>
                          ) : <span className="text-xs text-slate-400">حسابك الحالي</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 🚧 اللوحة الجديدة: إدارة مواقع ومشاريع شركة وادي دفا */}
          <div className="p-6 rounded-xl border-4 border-solid border-black bg-white space-y-6 shadow-md">
            <div>
              <h3 className="text-base font-black text-blue-900 m-0">🚧 لوحة تحكم وإضافة المشاريع والمواقع الحية</h3>
              <p className="text-xs text-black font-black m-0 mt-1">أي مشروع تضيفه هنا، سينزل تلقائياً في قائمة الخيارات عند تسجيل مركبة أو معدة جديدة.</p>
            </div>

            <form onSubmit={handleCreateProject} className="p-4 rounded-xl bg-slate-50 border-2 border-solid border-black flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-1.5 w-full">
                <label className="text-xs text-black block font-black">اسم المشروع / الموقع الفيدرالي الجديد:</label>
                <input type="text" required placeholder="مثال: مشروع نيوم - القطاع الجنوبي" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="w-full px-3 py-2.5 text-sm font-black rounded border-2 border-solid border-black bg-white" />
              </div>
              {projectMsg.text && <p className="text-xs font-black p-2 rounded border border-solid bg-amber-50 md:hidden">{projectMsg.text}</p>}
              <button type="submit" className="bg-blue-900 hover:bg-blue-950 text-white text-sm font-black px-6 py-2.5 rounded-lg border-2 border-solid border-black shadow-md whitespace-nowrap w-full md:w-auto">➕ إدراج الموقع الآن</button>
            </form>
            {projectMsg.text && <p className={`text-xs font-black p-2 rounded border border-solid hidden md:block ${projectMsg.isError ? 'bg-red-100 text-red-900 border-red-700' : 'bg-emerald-100 text-emerald-900 border-emerald-700'}`}>{projectMsg.text}</p>}

            <div className="space-y-3">
              <h4 className="text-sm font-black text-black m-0">📋 قائمة المشاريع والمواقع المسجلة حالياً:</h4>
              <div className="border-2 border-solid border-black rounded-lg overflow-hidden text-sm bg-white">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-black">
                      <th className="p-3">اسم المشروع / الموقع الحالي</th>
                      <th className="p-3 text-center w-24">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="font-black text-black">
                    {projectsList.length > 0 ? (
                      projectsList.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-100 border-b border-solid border-black/20">
                          <td className="p-3 text-blue-950">🚧 {p.name}</td>
                          <td className="p-3 text-center">
                            <button onClick={() => handleDeleteProject(p.id)} className="bg-red-50 text-red-600 border border-solid border-red-300 rounded px-2 py-1 text-xs cursor-pointer hover:bg-red-100">🗑️ سحب</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={2} className="text-center p-4 text-slate-500">لا توجد مشاريع مسجلة حالياً، أضف أول مشروع أعلاه.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
