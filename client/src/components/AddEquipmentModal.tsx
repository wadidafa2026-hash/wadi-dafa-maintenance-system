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
  // ─── حالات الحقول الأساسية (محفوظة بالكامل) ───────────────────────────────────
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  
  // 🏗️ حالة المشاريع (محفوظة بالكامل)
  const [projectsList, setProjectsList] = useState<{ id: number; name: string }[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState('');

  // 📸 حالات روابط الصور (محفوظة بالكامل)
  const [frontImageUrl, setFrontImageUrl] = useState('');
  const [backImageUrl, setBackImageUrl] = useState('');
  const [codeImageUrl, setCodeImageUrl] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔄 جلب قائمة المشاريع حياً عند فتح المودال (محفوظة ومؤمنة بالكامل)
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

    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim() || `آلية غير مسمية (${code})`,
      model: model.trim() || null,
      type,
      serialNumber: type === 'equipment' ? (serialNumber.trim() || null) : null,
      plateNumber: type === 'vehicle' ? (plateNumber.trim() || null) : null,
      currentProjectId: currentProjectId ? parseInt(currentProjectId) : null,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
      {/* تم تحويل الحاوية إلى خلفية بيضاء ناصعة مع حدود سوداء سميكة وحادة للتباين العالي */}
      <div className="w-full max-w-xl p-6 md:p-8 rounded-xl border-4 border-solid border-black bg-white text-black shadow-[0_0_30px_rgba(0,0,0,0.5)] max-h-[92vh] overflow-y-auto">
        
        {/* رأس المودال: العنوان باللون الأزرق الغامق الممتاز والواضح جداً والخط سميك جداً */}
        <div className="mb-5 pb-3 border-b-4 border-solid border-black">
          <h3 className="text-2xl font-black text-blue-900 m-0">
            {type === 'equipment' ? '⚙️ تسجيل معدة ثقيلة جديدة' : '🚚 تسجيل مركبة / سيارة جديدة'}
          </h3>
          <p className="text-sm font-black text-black mt-1.5 bg-yellow-100 p-2 rounded border-2 border-solid border-black">
            حقل الكود إجباري، وباقي الحقول اختيارية لتسهيل العمل اليومي الميداني.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 text-base font-black bg-red-100 text-red-900 rounded border-4 border-solid border-red-700">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* كود الآلية - أسود قاتم للعناوين، أزرق داكن للنص والـ Placeholder والحدود سوداء حادة */}
          <div className="space-y-1.5">
            <label className="block text-base font-black text-black">كود الآلية الفريد <span className="text-red-700 text-lg font-black">*</span>:</label>
            <input
              type="text"
              required
              placeholder="مثال: ادخل السيريال نمبر او الكود مثل EQ-01"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-3 text-base font-black tracking-wider rounded border-2 border-solid border-black bg-white text-blue-900 placeholder:text-blue-900/70 outline-none focus:border-blue-900 shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-base font-black text-black">الاسم الفني الإجمالي:</label>
              <input
                type="text"
                placeholder="مثال: بولدوزر كاتر بيلر"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 text-base font-black rounded border-2 border-solid border-black bg-white text-blue-900 placeholder:text-blue-900/70 outline-none focus:border-blue-900 shadow-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-base font-black text-black">الموديل / سنة الصنع:</label>
              <input
                type="text"
                placeholder="مثال: D9R / 2024"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-4 py-3 text-base font-black rounded border-2 border-solid border-black bg-white text-blue-900 placeholder:text-blue-900/70 outline-none focus:border-blue-900 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {type === 'equipment' ? (
              <div className="space-y-1.5">
                <label className="block text-base font-black text-black">الرقم التسلسلي (Serial Number):</label>
                <input
                  type="text"
                  placeholder="ادخل السيريال نمبر"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full px-4 py-3 text-base font-black font-mono rounded border-2 border-solid border-black bg-white text-blue-900 placeholder:text-blue-900/70 outline-none focus:border-blue-900 shadow-sm"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-base font-black text-black">رقم اللوحة والترميز:</label>
                <input
                  type="text"
                  placeholder="مثال: أ ب ج 1234"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="w-full px-4 py-3 text-base font-black rounded border-2 border-solid border-black bg-white text-blue-900 placeholder:text-blue-900/70 outline-none focus:border-blue-900 shadow-sm"
                />
              </div>
            )}

            {/* 🏗️ القائمة المنسدلة للمشاريع الحية - تم توضيح خطوطها وخلفيتها بالكامل */}
            <div className="space-y-1.5">
              <label className="block text-base font-black text-black">الموقع أو المشروع الحالي المبدئي:</label>
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
          </div>

          {/* 📸 قسم حقول روابط الصور الاختيارية - حدود واضحة تمنع الاختفاء في الشمس */}
          <div className="p-4 rounded-lg border-2 border-dashed border-black bg-blue-50/50 space-y-3">
            <span className="text-base font-black text-blue-900 block">🖼️ روابط صور الآلية (اختياري):</span>
            
            <div className="space-y-2">
              <input
                type="text"
                placeholder="رابط الصورة الأمامية للمعدة (Cloudinary URL)"
                value={frontImageUrl}
                onChange={(e) => setFrontImageUrl(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-black rounded border-2 border-solid border-black bg-white text-blue-900 placeholder:text-blue-900/70 outline-none focus:border-blue-900"
              />
              <input
                type="text"
                placeholder="رابط الصورة الخلفية للمعدة (Cloudinary URL)"
                value={backImageUrl}
                onChange={(e) => setBackImageUrl(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-black rounded border-2 border-solid border-black bg-white text-blue-900 placeholder:text-blue-900/70 outline-none focus:border-blue-900"
              />
              <input
                type="text"
                placeholder="رابط صورة كود/لوحة المعدة (Cloudinary URL)"
                value={codeImageUrl}
                onChange={(e) => setCodeImageUrl(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-black rounded border-2 border-solid border-black bg-white text-blue-900 placeholder:text-blue-900/70 outline-none focus:border-blue-900"
              />
            </div>
          </div>

          {/* أزرار التحكم والاعتماد السفلي */}
          <div className="pt-4 border-t-4 border-solid border-black flex justify-end gap-4 items-center">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={submitting} 
              className="text-base font-black text-black bg-transparent border-0 cursor-pointer hover:underline px-2 py-1"
            >
              إلغاء الأمر
            </button>
            <button 
              type="submit" 
              disabled={submitting} 
              className="bg-blue-900 hover:bg-blue-950 text-white font-black text-base px-8 py-3 rounded-lg border-2 border-solid border-black cursor-pointer shadow-md transition-all active:scale-95"
            >
              {submitting ? 'جاري الحفظ والربط حالياً...' : '💾 تثبيت الآلية في قاعدة البيانات'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
