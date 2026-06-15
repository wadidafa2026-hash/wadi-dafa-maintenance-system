// client/src/components/AddEquipmentModal.tsx
import React, { useState, useEffect } from 'react';

interface AddEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'equipment' | 'vehicle'; 
  onSuccess: () => void;
  isDarkMode?: boolean;
}

export const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({
  isOpen,
  onClose,
  type,
  onSuccess,
  isDarkMode = false,
}) => {
  // ─── حالات الحقول الأساسية ───────────────────────────────────
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  
  // 🏗️ حالة المشاريع (القائمة المنسدلة)
  const [projectsList, setProjectsList] = useState<{ id: number; name: string }[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState('');

  // 📸 حالات روابط الصور (كلاودنري لاحقاً)
  const [frontImageUrl, setFrontImageUrl] = useState('');
  const [backImageUrl, setBackImageUrl] = useState('');
  const [codeImageUrl, setCodeImageUrl] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔄 جلب قائمة المشاريع حياً عند فتح المودال لتغذية القائمة المنسدلة
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
          console.error('Error fetching projects:', err);
        }
      };
      fetchProjects();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('حقل الكود هو المعرف الفريد الإجباري ولا يمكن تركه فارغاً.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const baseUrl = import.meta.env.VITE_API_URL || "";

    // 📦 تجهيز البيانات بالتوافق التام مع الـ Schema الرسمية
    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim() || `آلية غير مسمية (${code})`,
      model: model.trim() || null,
      type,
      serialNumber: type === 'equipment' ? (serialNumber.trim() || null) : null,
      plateNumber: type === 'vehicle' ? (plateNumber.trim() || null) : null,
      
      // إرسال الرقم المعرّف للمشروع (ID) بدلاً من النص
      currentProjectId: currentProjectId ? parseInt(currentProjectId) : null,
      
      // روابط الصور الاختيارية
      frontImageUrl: frontImageUrl.trim() || null,
      backImageUrl: backImageUrl.trim() || null,
      codeImageUrl: codeImageUrl.trim() || null,
      
      status: 'available', 
    };

    try {
      const response = await fetch(`${baseUrl}/api/equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // تنظيف الحقول تماماً بعد النجاح
        setCode(''); setName(''); setModel(''); setSerialNumber(''); setPlateNumber(''); 
        setCurrentProjectId(''); setFrontImageUrl(''); setBackImageUrl(''); setCodeImageUrl('');
        onSuccess(); 
        onClose();   
      } else {
        const errData = await response.json();
        setError(errData.error || 'حدث خطأ أثناء حفظ البيانات، تأكد من عدم تكرار الكود.');
      }
    } catch (err) {
      console.error(err);
      setError('فشل الاتصال بالسيرفر، يرجى التحقق من الشبكة.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" dir="rtl">
      <div className={`w-full max-w-lg p-6 rounded-2xl border shadow-2xl relative max-h-[90vh] overflow-y-auto ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'
      }`}>
        
        <div className="mb-4 pb-2 border-b border-slate-500/10">
          <h3 className="text-lg font-black text-blue-500">
            {type === 'equipment' ? '⚙️ تسجيل معدة ثقيلة جديدة' : '🚚 تسجيل مركبة / سيارة جديدة'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            حقل الكود إجباري، وباقي الحقول اختيارية لتسهيل العمل اليومي.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs font-bold bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* كود الآلية */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">كود الآلية الفريد <span className="text-red-500 font-black">*</span>:</label>
            <input
              type="text"
              required
              placeholder="مثال: EQ-01 أو VH-14"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`w-full px-4 py-2.5 text-sm font-black tracking-wider rounded-xl border outline-none focus:border-blue-500 ${
                isDarkMode ? 'bg-slate-950 border-slate-800 text-amber-400' : 'bg-slate-50 border-slate-200 text-blue-600'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">الاسم الفني الإجمالي:</label>
              <input
                type="text"
                placeholder="مثال: بولدوزر كاتر بيلر"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-blue-500 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">الموديل / سنة الصنع:</label>
              <input
                type="text"
                placeholder="مثال: D9R / 2024"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-blue-500 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {type === 'equipment' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">الرقم التسلسلي (Serial Number):</label>
                <input
                  type="text"
                  placeholder="أدخل السيريال نمبر"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className={`w-full px-3 py-2 text-sm font-mono rounded-xl border outline-none focus:border-blue-500 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">رقم اللوحة والترميز:</label>
                <input
                  type="text"
                  placeholder="مثال: أ ب ج 1234"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-blue-500 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>
            )}

            {/* 🏗️ القائمة المنسدلة للمشاريع المستدعاة من قاعدة البيانات */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">الموقع أو المشروع الحالي المبدئي:</label>
              <select
                value={currentProjectId}
                onChange={(e) => setCurrentProjectId(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-blue-500 cursor-pointer ${
                  isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="">📍 الورشة الرئيسية (بدون مشروع)</option>
                {projectsList.map((project) => (
                  <option key={project.id} value={project.id}>
                    🚧 {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 📸 قسم حقول روابط الصور (تجهيزاً لربط كلاودنري لاحقاً) */}
          <div className="p-4 rounded-xl border border-dashed border-slate-500/20 space-y-3 bg-slate-500/5">
            <span className="text-xs font-black text-amber-500 block">🖼️ روابط صور الآلية (اختياري):</span>
            
            <div className="space-y-2">
              <input
                type="text"
                placeholder="رابط الصورة الأمامية للمعدة (Cloudinary URL)"
                value={frontImageUrl}
                onChange={(e) => setFrontImageUrl(e.target.value)}
                className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}
              />
              <input
                type="text"
                placeholder="رابط الصورة الخلفية للمعدة (Cloudinary URL)"
                value={backImageUrl}
                onChange={(e) => setBackImageUrl(e.target.value)}
                className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}
              />
              <input
                type="text"
                placeholder="رابط صورة كود/لوحة المعدة (Cloudinary URL)"
                value={codeImageUrl}
                onChange={(e) => setCodeImageUrl(e.target.value)}
                className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-500/10 flex justify-end gap-3 items-center">
            <button type="button" onClick={onClose} disabled={submitting} className="text-xs font-bold text-slate-400 bg-transparent border-0 cursor-pointer">
              إلغاء الأمر
            </button>
            <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md border-0 cursor-pointer">
              {submitting ? 'جاري الحفظ والربط...' : '💾 تثبيت الآلية في قاعدة البيانات'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
