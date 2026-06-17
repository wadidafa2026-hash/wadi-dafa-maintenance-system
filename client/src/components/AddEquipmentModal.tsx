// client/src/components/EquipmentProfileModal.tsx
import React, { useState, useEffect } from 'react';

interface Equipment {
  id: number;
  code: string;
  name: string;
  model: string | null;
  type: 'equipment' | 'vehicle';
  serialNumber: string | null;
  plateNumber: string | null;
  status: 'available' | 'broken' | 'out_of_service';
  
  // متوافق مع قاعدة البيانات الفعلية لديك
  currentProjectId?: number | null; 
  projectName?: string | null;
  
  // روابط الصور الثلاثة كما هي في الـ Schema والإضافة
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
  codeImageUrl?: string | null;
}

interface EquipmentProfileModalProps {
  equipment: Equipment;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  userRole: 'super_admin' | 'sub_admin' | 'viewer';
  isDarkMode: boolean;
}

export const EquipmentProfileModal: React.FC<EquipmentProfileModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onRefresh,
  userRole,
  isDarkMode,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // ─── حالات الحقول متطابقة مع مسميات الإضافة ───────────────────
  const [name, setName] = useState(equipment.name);
  const [model, setModel] = useState(equipment.model || '');
  const [serialNumber, setSerialNumber] = useState(equipment.serialNumber || '');
  const [plateNumber, setPlateNumber] = useState(equipment.plateNumber || '');
  
  // التعامل بالـ ID الرقمي للمشروع منعاً لأي تعارض
  const [currentProjectId, setCurrentProjectId] = useState<string>(
    equipment.currentProjectId ? String(equipment.currentProjectId) : ''
  );
  
  // حالات تعديل روابط الصور
  const [frontImageUrl, setFrontImageUrl] = useState(equipment.frontImageUrl || '');
  const [backImageUrl, setBackImageUrl] = useState(equipment.backImageUrl || '');
  const [codeImageUrl, setCodeImageUrl] = useState(equipment.codeImageUrl || '');

  // مصفوفة المشاريع مستدعاة من قاعدة البيانات ككائنات (id, name) تماماً مثل الإضافة
  const [projectsList, setProjectsList] = useState<{ id: number; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthorized = userRole === 'super_admin' || userRole === 'sub_admin';

  // 🔄 جلب المشاريع من قاعدة البيانات بنفس طريقة الإضافة بالظبط
  useEffect(() => {
    if (isOpen) {
      const fetchProjects = async () => {
        const baseUrl = import.meta.env.VITE_API_URL || "";
        try {
          const res = await fetch(`${baseUrl}/api/projects`);
          if (res.ok) {
            const data = await res.json();
            setProjectsList(data);
          }
        } catch (err) {
          console.error('Error fetching projects in profile:', err);
        }
      };
      fetchProjects();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const baseUrl = import.meta.env.VITE_API_URL || "";

    // 📦 تجهيز الداتا بالتطابق مع الـ Payload المتوقع بالسيرفر
    const payload = {
      name: name.trim(),
      model: model.trim() || null,
      serialNumber: equipment.type === 'equipment' ? (serialNumber.trim() || null) : null,
      plateNumber: equipment.type === 'vehicle' ? (plateNumber.trim() || null) : null,
      currentProjectId: currentProjectId ? parseInt(currentProjectId) : null,
      frontImageUrl: frontImageUrl.trim() || null,
      backImageUrl: backImageUrl.trim() || null,
      codeImageUrl: codeImageUrl.trim() || null,
    };

    try {
      const response = await fetch(`${baseUrl}/api/equipment/${equipment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsEditing(false);
        onRefresh();
        onClose();
      } else {
        const errData = await response.json();
        setError(errData.error || 'حدث خطأ أثناء تحديث البيانات في السيرفر.');
      }
    } catch (err) {
      setError('فشل الاتصال بالنظام، يرجى التحقق من جودة الشبكة.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm box-border w-full">
      <div className={`w-full max-w-xl rounded-2xl border shadow-2xl relative max-h-[92vh] overflow-y-auto ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'
      }`} dir="rtl">
        
        {/* هيدر المودال */}
        <div className="p-4 border-b border-solid border-slate-500/10 flex justify-between items-center sticky top-0 bg-inherit z-10">
          <div>
            <h3 className="text-base md:text-lg font-black text-blue-500 m-0">
              {isEditing ? '✏️ تعديل بيانات الآلية الحالية' : `📋 بروفايل: ${equipment.name}`}
            </h3>
            <p className="text-xs text-slate-400 m-0 mt-1">
              الكود التعريفي الثابت: <span className="font-black text-amber-500 uppercase tracking-wider">{equipment.code}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-lg font-black bg-transparent border-0 cursor-pointer text-slate-400 hover:text-red-500 transition-colors">✕</button>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 text-xs font-bold bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
            ⚠️ {error}
          </div>
        )}

        {/* محتوى البروفايل */}
        <div className="p-4 md:p-6 space-y-5">
          
          {!isEditing ? (
            /* ──────────────── وضع العرض والمعاينة (شامل البوم الصور) ──────────────── */
            <div className="space-y-5">
              
              {/* قسم عرض الألبوم الثلاثي متجاوب ومحمي تماماً من الخروج عن حدود شاشة الجوال */}
              <div className="space-y-2">
                <span className="text-xs font-black text-amber-500 block">🖼️ ألبوم صور الآلية بالميدان:</span>
                <div className="grid grid-cols-3 gap-2">
                  
                  {/* الصورة الأمامية */}
                  <div className="aspect-square rounded-xl bg-slate-500/5 border border-slate-500/10 flex items-center justify-center overflow-hidden">
                    {equipment.frontImageUrl ? (
                      <img src={equipment.frontImageUrl} alt="أمامي" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-slate-500 font-bold">لا يوجد (أمامية)</span>
                    )}
                  </div>

                  {/* الصورة الخلفية */}
                  <div className="aspect-square rounded-xl bg-slate-500/5 border border-slate-500/10 flex items-center justify-center overflow-hidden">
                    {equipment.backImageUrl ? (
                      <img src={equipment.backImageUrl} alt="خلفي" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-slate-500 font-bold">لا يوجد (خلفية)</span>
                    )}
                  </div>

                  {/* صورة اللوحة أو الكود */}
                  <div className="aspect-square rounded-xl bg-slate-500/5 border border-slate-500/10 flex items-center justify-center overflow-hidden">
                    {equipment.codeImageUrl ? (
                      <img src={equipment.codeImageUrl} alt="كود" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-slate-500 font-bold">لا يوجد (كود/لوحة)</span>
                    )}
                  </div>

                </div>
              </div>

              {/* تفاصيل البيانات النصية */}
              <div className="grid grid-cols-2 gap-4 bg-slate-500/5 p-4 rounded-xl border border-slate-500/10 text-sm">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-bold block">الاسم الإجمالي:</span>
                  <span className="font-black">{equipment.name}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-bold block">الموديل / السنة:</span>
                  <span className="font-black font-sans">{equipment.model || 'غير مسجل'}</span>
                </div>
                <div className="col-span-2 border-t border-slate-500/10 pt-2 space-y-1">
                  <span className="text-xs text-slate-400 font-bold block">الموقع الميداني التابع له حالياً:</span>
                  <span className="font-black text-blue-500">🚧 {equipment.projectName || 'الورشة المركزية (بدون مشروع)'}</span>
                </div>
                <div className="col-span-2 border-t border-slate-500/10 pt-2 space-y-1">
                  <span className="text-xs text-slate-400 font-bold block">
                    {equipment.type === 'equipment' ? 'الرقم التسلسلي الهيكلي (S/N):' : 'رقم اللوحة المرورية الفعلي:'}
                  </span>
                  <span className="font-black font-mono tracking-wide">{equipment.type === 'equipment' ? (equipment.serialNumber || '---') : (equipment.plateNumber || '---')}</span>
                </div>
                <div className="col-span-2 border-t border-slate-500/10 pt-2 space-y-1">
                  <span className="text-xs text-slate-400 font-bold block">الحالة التشغيلية بالنظام:</span>
                  <span className={`inline-block mt-1 px-3 py-0.5 rounded-lg text-xs font-black text-white ${equipment.status === 'available' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                    {equipment.status === 'available' ? 'جاهز للعمل الميداني الفوري' : 'معطلة حالياً'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* ──────────────── وضع التعديل (فورم متطابق تماماً مع نظام الحفظ) ──────────────── */
            <form onSubmit={handleUpdate} className="space-y-4 text-sm">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">اسم المعدة / المركبة:</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={`w-full px-3 py-2 rounded-xl border outline-none focus:border-blue-500 font-bold ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">الموديل / السنة:</label>
                  <input type="text" value={model} onChange={(e) => setModel(e.target.value)} className={`w-full px-3 py-2 rounded-xl border outline-none font-bold ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
                </div>

                {equipment.type === 'equipment' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400">الرقم التسلسلي (S/N):</label>
                    <input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className={`w-full px-3 py-2 rounded-xl border outline-none font-mono ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400">رقم اللوحة والترميز:</label>
                    <input type="text" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} className={`w-full px-3 py-2 rounded-xl border outline-none font-bold ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
                  </div>
                )}
              </div>

              {/* 🏗️ القائمة المنسدلة الديناميكية للمشاريع - مطابقة للإضافة بنسبة 100% بالـ ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">نقل أو إسناد للموقع الحالي:</label>
                <select 
                  value={currentProjectId} 
                  onChange={(e) => setCurrentProjectId(e.target.value)} 
                  className={`w-full px-3 py-2 rounded-xl border outline-none font-bold cursor-pointer ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                >
                  <option value="">📍 الورشة الرئيسية (بدون مشروع)</option>
                  {projectsList.map((project) => (
                    <option key={project.id} value={project.id}>
                      🚧 {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* روابط وتعديل الصور الاختيارية */}
              <div className="p-3 rounded-xl border border-dashed border-slate-500/20 space-y-2 bg-slate-500/5">
                <span className="text-xs font-black text-amber-500 block">🖼️ روابط تحديث صور الآلية (Cloudinary URL):</span>
                <input type="text" placeholder="رابط الصورة الأمامية" value={frontImageUrl} onChange={(e) => setFrontImageUrl(e.target.value)} className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`} />
                <input type="text" placeholder="رابط الصورة الخلفية" value={backImageUrl} onChange={(e) => setBackImageUrl(e.target.value)} className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`} />
                <input type="text" placeholder="رابط صورة لوحة الكود" value={codeImageUrl} onChange={(e) => setCodeImageUrl(e.target.value)} className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`} />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsEditing(false)} className="text-xs font-bold text-slate-400 bg-transparent border-0 cursor-pointer">إلغاء التعديل</button>
                <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-5 py-2 rounded-xl border-0 cursor-pointer shadow-md">
                  {saving ? 'جاري حفظ التعديل...' : '💾 تحديث البيانات والموقع'}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* أزرار التحكم السفلية */}
        {!isEditing && (
          <div className="p-3 border-t border-solid border-slate-500/10 flex justify-end gap-2 bg-slate-500/5 sticky bottom-0">
            {isAuthorized && (
              <button 
                onClick={() => setIsEditing(true)} 
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-black px-4 py-2 rounded-xl border-0 cursor-pointer shadow-md transition-all"
              >
                ✏️ تعديل بيانات الآلية والمشروع
              </button>
            )}
            <button onClick={onClose} className="bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black px-4 py-2 rounded-xl border-0 cursor-pointer">إغلاق</button>
          </div>
        )}

      </div>
    </div>
  );
};
