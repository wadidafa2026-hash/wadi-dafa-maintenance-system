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
  currentProjectId?: number | null; 
  projectName?: string | null;
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
  
  // ─── حقول التعديل الشاملة (محفوظة بالكامل بدون أي تعديل منطقي) ───────────────────
  const [code, setCode] = useState(equipment.code);
  const [name, setName] = useState(equipment.name);
  const [model, setModel] = useState(equipment.model || '');
  const [serialNumber, setSerialNumber] = useState(equipment.serialNumber || '');
  const [plateNumber, setPlateNumber] = useState(equipment.plateNumber || '');
  
  const [currentProjectId, setCurrentProjectId] = useState<string>(
    equipment.currentProjectId ? String(equipment.currentProjectId) : ''
  );
  
  const [frontImageUrl, setFrontImageUrl] = useState(equipment.frontImageUrl || '');
  const [backImageUrl, setBackImageUrl] = useState(equipment.backImageUrl || '');
  const [codeImageUrl, setCodeImageUrl] = useState(equipment.codeImageUrl || '');

  const [projectsList, setProjectsList] = useState<{ id: number; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthorized = userRole === 'super_admin' || userRole === 'sub_admin';

  // 🔄 جلب المشاريع لتغذية القائمة المنسدلة (محفوظ ويعمل حياً من الداتا بيز)
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
    if (!code.trim()) {
      setError('حقل كود الآلية إجباري ولا يمكن تركه فارغاً.');
      return;
    }

    setSaving(true);
    setError(null);
    const baseUrl = import.meta.env.VITE_API_URL || "";

    const payload = {
      code: code.trim().toUpperCase(),
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
        setError(errData.error || 'حدث خطأ أثناء تحديث البيانات، تأكد من عدم تكرار الكود.');
      }
    } catch (err) {
      setError('فشل الاتصال بالنظام، يرجى التحقق من جودة الشبكة.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm box-border w-full" dir="rtl">
      {/* الحاوية الرئيسية بيضاء ناصعة ومحاطة بإطار أسود عريض لمنع تلاشي الألوان في الشمس */}
      <div className="w-full max-w-xl rounded-xl border-4 border-solid border-black bg-white text-black shadow-[0_0_35px_rgba(0,0,0,0.6)] relative max-h-[92vh] overflow-y-auto">
        
        {/* هيدر المودال: عناوين بالأسود الحاد والأزرق القاتم الممتاز */}
        <div className="p-4 border-b-4 border-solid border-black flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-xl font-black text-blue-900 m-0">
              {isEditing ? '✏️ تعديل كامل بيانات الآلية' : `📋 بروفايل: ${equipment.name}`}
            </h3>
            <p className="text-sm font-black text-black m-0 mt-1">
              الكود الحالي: <span className="font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded border border-solid border-blue-900 uppercase tracking-wider">{equipment.code}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-2xl font-black bg-transparent border-0 cursor-pointer text-black hover:text-red-700 transition-colors">✕</button>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 text-base font-black bg-red-100 text-red-900 rounded border-4 border-solid border-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* محتوى المودال التشغيلي */}
        <div className="p-4 md:p-6 space-y-6">
          
          {!isEditing ? (
            /* ──────────────── وضع المعاينة والعرض فقط (تباين حاد 100%) ──────────────── */
            <div className="space-y-6">
              
              {/* ألبوم الصور الميداني الثلاثي */}
              <div className="space-y-2">
                <span className="text-base font-black text-black block">🖼️ ألبوم صور الآلية بالميدان:</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="aspect-square rounded-lg bg-slate-100 border-2 border-solid border-black flex items-center justify-center overflow-hidden">
                    {equipment.frontImageUrl ? <img src={equipment.frontImageUrl} alt="أمامي" className="w-full h-full object-cover" /> : <span className="text-xs text-black font-black">لا يوجد (أمامية)</span>}
                  </div>
                  <div className="aspect-square rounded-lg bg-slate-100 border-2 border-solid border-black flex items-center justify-center overflow-hidden">
                    {equipment.backImageUrl ? <img src={equipment.backImageUrl} alt="خلفي" className="w-full h-full object-cover" /> : <span className="text-xs text-black font-black">لا يوجد (خلفية)</span>}
                  </div>
                  <div className="aspect-square rounded-lg bg-slate-100 border-2 border-solid border-black flex items-center justify-center overflow-hidden">
                    {equipment.codeImageUrl ? <img src={equipment.codeImageUrl} alt="كود" className="w-full h-full object-cover" /> : <span className="text-xs text-black font-black">لا يوجد (كود/لوحة)</span>}
                  </div>
                </div>
              </div>

              {/* تفاصيل البيانات النصية - تم إلغاء الـ Slate والشفافية بالكامل وتحويلها لخطوط سوداء حادة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border-2 border-solid border-black text-base">
                <div className="space-y-1">
                  <span className="text-xs text-black font-black block">كود الآلية الموحد:</span>
                  <span className="font-black text-blue-900 text-lg uppercase">{equipment.code}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-black font-black block">الاسم الإجمالي:</span>
                  <span className="font-black text-black text-lg">{equipment.name}</span>
                </div>
                <div className="space-y-1 border-t-2 border-solid border-black pt-2">
                  <span className="text-xs text-black font-black block">الموديل / السنة:</span>
                  <span className="font-black text-black">{equipment.model || 'غير مسجل بالنظام'}</span>
                </div>
                <div className="space-y-1 border-t-2 border-solid border-black pt-2">
                  <span className="text-xs text-black font-black block">
                    {equipment.type === 'equipment' ? 'الرقم التسلسلي (S/N):' : 'رقم اللوحة المرورية:'}
                  </span>
                  <span className="font-black font-mono text-blue-900">{equipment.type === 'equipment' ? (equipment.serialNumber || '---') : (equipment.plateNumber || '---')}</span>
                </div>
                <div className="col-span-1 md:col-span-2 border-t-2 border-solid border-black pt-2 space-y-1">
                  <span className="text-xs text-black font-black block">الموقع الميداني الحالي:</span>
                  <span className="font-black text-blue-900 text-base">🚧 {equipment.projectName || 'الورشة المركزية (بدون مشروع حالي)'}</span>
                </div>
                <div className="col-span-1 md:col-span-2 border-t-2 border-solid border-black pt-2 space-y-1">
                  <span className="text-xs text-black font-black block">الحالة التشغيلية بالنظام:</span>
                  <span className={`inline-block mt-1 px-4 py-1 rounded text-sm font-black text-white ${equipment.status === 'available' ? 'bg-emerald-700' : 'bg-red-700'}`}>
                    {equipment.status === 'available' ? 'جاهز للعمل الميداني الفوري' : 'معطلة وخارج الخدمة'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* ──────────────── وضع التعديل الشامل (مجهز بالكامل للوضوح التام تحت الشمس) ──────────────── */
            <form onSubmit={handleUpdate} className="space-y-5 text-base">
              
              {/* تعديل كود الآلية الفريد */}
              <div className="space-y-1.5">
                <label className="block text-base font-black text-black">كود الآلية الفريد (تعديل بحذر) <span className="text-red-700 text-lg font-black">*</span>:</label>
                <input 
                  type="text" 
                  required 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)} 
                  className="w-full px-4 py-3 text-base font-black tracking-wider uppercase rounded border-2 border-solid border-black bg-white text-blue-900 outline-none focus:border-blue-900 shadow-sm" 
                />
              </div>

              {/* تعديل الاسم الفني */}
              <div className="space-y-1.5">
                <label className="block text-base font-black text-black">اسم المعدة / المركبة الحالية:</label>
                <input 
                  type="text" 
                  required 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full px-4 py-3 text-base font-black rounded border-2 border-solid border-black bg-white text-blue-900 outline-none focus:border-blue-900 shadow-sm" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* تعديل الموديل */}
                <div className="space-y-1.5">
                  <label className="block text-base font-black text-black">الموديل / السنة:</label>
                  <input type="text" value={model} onChange={(e) => setModel(e.target.value)} className="w-full px-4 py-3 text-base font-black rounded border-2 border-solid border-black bg-white text-blue-900 outline-none focus:border-blue-900 shadow-sm" />
                </div>

                {/* تعديل السيريال أو اللوحة حسب النوع */}
                {equipment.type === 'equipment' ? (
                  <div className="space-y-1.5">
                    <label className="block text-base font-black text-black">الرقم التسلسلي (S/N):</label>
                    <input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className="w-full px-4 py-3 text-base font-black font-mono rounded border-2 border-solid border-black bg-white text-blue-900 outline-none focus:border-blue-900 shadow-sm" />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="block text-base font-black text-black">رقم اللوحة والترميز المروري:</label>
                    <input type="text" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} className="w-full px-4 py-3 text-base font-black rounded border-2 border-solid border-black bg-white text-blue-900 outline-none focus:border-blue-900 shadow-sm" />
                  </div>
                )}
              </div>

              {/* 🏗️ القائمة المنسدلة الديناميكية للمشاريع */}
              <div className="space-y-1.5">
                <label className="block text-base font-black text-black">الموقع أو المشروع الميداني التابع له حالياً:</label>
                <select 
                  value={currentProjectId} 
                  onChange={(e) => setCurrentProjectId(e.target.value)} 
                  className="w-full px-4 py-3 text-base font-black rounded border-2 border-solid border-black bg-white text-black outline-none focus:border-blue-900 shadow-sm cursor-pointer"
                >
                  <option value="" className="font-black text-black">📍 الورشة الرئيسية (بدون مشروع)</option>
                  {projectsList.map((project) => (
                    <option key={project.id} value={project.id} className="font-black text-black">
                      🚧 {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* تعديل روابط الصور الاختيارية الثلاثة بالكامل */}
              <div className="p-4 rounded-lg border-2 border-dashed border-black bg-blue-50/50 space-y-3">
                <span className="text-base font-black text-blue-900 block">🖼️ روابط تحديث صور الآلية (Cloudinary URL):</span>
                <input type="text" placeholder="رابط الصورة الأمامية للمعدة" value={frontImageUrl} onChange={(e) => setFrontImageUrl(e.target.value)} className="w-full px-4 py-2.5 text-sm font-black rounded border-2 border-solid border-black bg-white text-blue-900 placeholder:text-blue-900/70 outline-none focus:border-blue-900" />
                <input type="text" placeholder="رابط الصورة الخلفية للمعدة" value={backImageUrl} onChange={(e) => setBackImageUrl(e.target.value)} className="w-full px-4 py-2.5 text-sm font-black rounded border-2 border-solid border-black bg-white text-blue-900 placeholder:text-blue-900/70 outline-none focus:border-blue-900" />
                <input type="text" placeholder="رابط صورة لوحة الكود الفني" value={codeImageUrl} onChange={(e) => setCodeImageUrl(e.target.value)} className="w-full px-4 py-2.5 text-sm font-black rounded border-2 border-solid border-black bg-white text-blue-900 placeholder:text-blue-900/70 outline-none focus:border-blue-900" />
              </div>

              {/* أزرار التحكم بوضع التعديل */}
              <div className="flex justify-end gap-3 pt-4 border-t-4 border-solid border-black">
                <button type="button" onClick={() => setIsEditing(false)} className="text-base font-black text-black bg-transparent border-0 cursor-pointer hover:underline px-3">إلغاء الأمر</button>
                <button type="submit" disabled={saving} className="bg-blue-900 hover:bg-blue-950 text-white text-base font-black px-6 py-3 rounded-lg border-2 border-solid border-black cursor-pointer shadow">
                  {saving ? 'جاري حفظ التعديلات...' : '💾 حفظ التعديلات الشاملة'}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* أزرار التحكم السفلية المبدئية عند العرض فقط */}
        {!isEditing && (
          <div className="p-4 border-t-4 border-solid border-black flex justify-end gap-3 bg-slate-100 sticky bottom-0">
            {isAuthorized && (
              <button 
                onClick={() => setIsEditing(true)} 
                className="bg-amber-500 hover:bg-amber-600 text-white text-base font-black px-6 py-2.5 rounded-lg border-2 border-solid border-black cursor-pointer shadow-md transition-all active:scale-95"
              >
                ✏️ تعديل كامل البيانات والصور والموقع
              </button>
            )}
            <button onClick={onClose} className="bg-black hover:bg-slate-900 text-white text-base font-black px-6 py-2.5 rounded-lg border-2 border-solid border-black cursor-pointer">إغلاق النافذة</button>
          </div>
        )}

      </div>
    </div>
  );
};
