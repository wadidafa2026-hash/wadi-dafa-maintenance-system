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
  
  // 🏗️ حالة المشاريع لربط المعدة بموقعها الحالي
  const [projectsList, setProjectsList] = useState<{ id: number; name: string }[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState('');

  // 📸 حالات روابط الصور (يتم ملؤها تلقائياً بعد الرفع لكلاودنري)
  const [frontImageUrl, setFrontImageUrl] = useState('');
  const [backImageUrl, setBackImageUrl] = useState('');
  const [codeImageUrl, setCodeImageUrl] = useState('');

  // حالات مؤشر الرفع (Spinner) لكل صورة على حدة لراحة المستخدم بالميدان
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [uploadingCode, setUploadingCode] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // جلب رابط السيرفر من متغيرات البيئة
  const baseUrl = import.meta.env.VITE_API_URL || "";

  // 🔄 جلب قائمة المشاريع لتغذية القائمة المنسدلة عند فتح المودال
  useEffect(() => {
    if (isOpen) {
      const fetchProjects = async () => {
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

  // ☁️ دالة رفع الصور التلقائية إلى السيرفر ومنه مباشرة إلى كلاودنري
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, imageType: 'front' | 'back' | 'code') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // تشغيل مؤشر التحميل حسب الزر المضغوط
    if (imageType === 'front') setUploadingFront(true);
    if (imageType === 'back') setUploadingBack(true);
    if (imageType === 'code') setUploadingCode(true);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', 'equipments');

    try {
      const res = await fetch(`${baseUrl}/api/upload`, {
        method: 'POST',
        body: formData, // إرسال الصورة كـ ملف
      });

      const data = await res.json();

      if (res.ok && data.imageUrl) {
        // تخزين الرابط المسترجع في الحالة المناسبة
        if (imageType === 'front') setFrontImageUrl(data.imageUrl);
        if (imageType === 'back') setBackImageUrl(data.imageUrl);
        if (imageType === 'code') setCodeImageUrl(data.imageUrl);
      } else {
        alert(data.error || 'فشل رفع الصورة، يرجى المحاولة مرة أخرى.');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ في الاتصال بالسيرفر أثناء رفع الصورة.');
    } finally {
      // إيقاف مؤشر التحميل
      if (imageType === 'front') setUploadingFront(false);
      if (imageType === 'back') setUploadingBack(false);
      if (imageType === 'code') setUploadingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('حقل كود الآلية مطلوب وإلزامي للنظام.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim() || `آلية (${code})`,
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
        // تصفير الحقول بعد النجاح
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
      <div className="w-full max-w-xl p-6 md:p-8 rounded-xl border-4 border-solid border-black bg-white text-black shadow-[0_0_30px_rgba(0,0,0,0.5)] max-h-[92vh] overflow-y-auto">
        
        <div className="mb-5 pb-3 border-b-4 border-solid border-black">
          <h3 className="text-2xl font-black text-blue-900 m-0">
            {type === 'equipment' ? '⚙️ تسجيل معدة ثقيلة جديدة' : '🚚 تسجيل مركبة / سيارة جديدة'}
          </h3>
          <p className="text-sm font-black text-black mt-1.5 bg-yellow-100 p-2 rounded border-2 border-solid border-black">
            الآن يمكنك التقاط أو رفع الصور مباشرة من الكاميرا أو الاستوديو بدلاً من الروابط النصية.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 text-base font-black bg-red-100 text-red-900 rounded border-4 border-solid border-red-700">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="space-y-1.5">
            <label className="block text-base font-black text-black">كود الآلية الفريد <span className="text-red-700 text-lg font-black">*</span>:</label>
            <input
              type="text"
              required
              placeholder="مثال: W.G.F566"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-3 text-base font-black tracking-wider rounded border-2 border-solid border-black bg-white text-blue-900 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-base font-black text-black">الاسم الإجمالي للآلية:</label>
              <input
                type="text"
                placeholder="مثال: كتر بيلر بوكلين"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 text-base font-black rounded border-2 border-solid border-black bg-white text-blue-900 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-base font-black text-black">الموديل / السنة:</label>
              <input
                type="text"
                placeholder="مثال: 2019"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-4 py-3 text-base font-black rounded border-2 border-solid border-black bg-white text-blue-900 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {type === 'equipment' ? (
              <div className="space-y-1.5">
                <label className="block text-base font-black text-black">الرقم التسلسلي (S/N):</label>
                <input
                  type="text"
                  placeholder="ادخل الرقم التسلسلي"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full px-4 py-3 text-base font-black rounded border-2 border-solid border-black bg-white text-blue-900 outline-none"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-base font-black text-black">رقم اللوحة:</label>
                <input
                  type="text"
                  placeholder="مثال: 1234 أ ب ج"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="w-full px-4 py-3 text-base font-black rounded border-2 border-solid border-black bg-white text-blue-900 outline-none"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-base font-black text-black">الموقع الميداني الحالي المبدئي:</label>
              <select
                value={currentProjectId}
                onChange={(e) => setCurrentProjectId(e.target.value)}
                className="w-full px-4 py-3 text-base font-black rounded border-2 border-solid border-black bg-white text-black outline-none cursor-pointer"
              >
                <option value="">🚧 الورشة المركزية (بدون مشروع حالي)</option>
                {projectsList.map((project) => (
                  <option key={project.id} value={project.id}>
                    📍 {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 📸 البوم رفع الصور التفاعلي المباشر لكلاودنري */}
          <div className="p-4 rounded-lg border-2 border-dashed border-black bg-blue-50/50 space-y-4">
            <span className="text-base font-black text-blue-900 block">🖼️ ألبوم صور الآلية بالميدان (اختياري):</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* صورة أمامية */}
              <div className="flex flex-col items-center p-3 rounded-lg border-2 border-solid border-black bg-white">
                <span className="text-xs font-black mb-2 text-black">📷 صورة (أمامية)</span>
                <input type="file" accept="image/*" id="front-img" className="hidden" onChange={(e) => handleImageChange(e, 'front')} />
                <label htmlFor="front-img" className="w-full text-center bg-slate-100 hover:bg-slate-200 text-black text-xs font-black py-2 px-1 rounded border border-solid border-black cursor-pointer transition-all">
                  {uploadingFront ? '⏳ جاري الرفع...' : frontImageUrl ? '✅ تم الرفع' : '➕ إختر صورة'}
                </label>
                {frontImageUrl && <span className="text-[10px] text-emerald-700 font-bold mt-1 text-center truncate w-full">جاهزة ومربوطة</span>}
              </div>

              {/* صورة خلفية */}
              <div className="flex flex-col items-center p-3 rounded-lg border-2 border-solid border-black bg-white">
                <span className="text-xs font-black mb-2 text-black">📷 صورة (خلفية)</span>
                <input type="file" accept="image/*" id="back-img" className="hidden" onChange={(e) => handleImageChange(e, 'back')} />
                <label htmlFor="back-img" className="w-full text-center bg-slate-100 hover:bg-slate-200 text-black text-xs font-black py-2 px-1 rounded border border-solid border-black cursor-pointer transition-all">
                  {uploadingBack ? '⏳ جاري الرفع...' : backImageUrl ? '✅ تم الرفع' : '➕ إختر صورة'}
                </label>
                {backImageUrl && <span className="text-[10px] text-emerald-700 font-bold mt-1 text-center truncate w-full">جاهزة ومربوطة</span>}
              </div>

              {/* صورة الكود/اللوحة */}
              <div className="flex flex-col items-center p-3 rounded-lg border-2 border-solid border-black bg-white">
                <span className="text-xs font-black mb-2 text-black">📷 صورة (كود/لوحة)</span>
                <input type="file" accept="image/*" id="code-img" className="hidden" onChange={(e) => handleImageChange(e, 'code')} />
                <label htmlFor="code-img" className="w-full text-center bg-slate-100 hover:bg-slate-200 text-black text-xs font-black py-2 px-1 rounded border border-solid border-black cursor-pointer transition-all">
                  {uploadingCode ? '⏳ جاري الرفع...' : codeImageUrl ? '✅ تم الرفع' : '➕ إختر صورة'}
                </label>
                {codeImageUrl && <span className="text-[10px] text-emerald-700 font-bold mt-1 text-center truncate w-full">جاهزة ومربوطة</span>}
              </div>

            </div>
          </div>

          <div className="pt-4 border-t-4 border-solid border-black flex justify-end gap-4 items-center">
            <button type="button" onClick={onClose} disabled={submitting} className="text-base font-black text-black hover:underline px-2 py-1">إلغاء الأمر</button>
            <button type="submit" disabled={submitting || uploadingFront || uploadingBack || uploadingCode} className="bg-blue-900 hover:bg-blue-950 text-white font-black text-base px-8 py-3 rounded-lg border-2 border-solid border-black shadow-md transition-all active:scale-95">
              {submitting ? 'جاري الحفظ والربط...' : '💾 تثبيت الآلية في قاعدة البيانات'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
