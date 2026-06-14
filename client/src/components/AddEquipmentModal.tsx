// client/src/components/AddEquipmentModal.tsx
import React, { useState } from 'react';

interface AddEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'equipment' | 'vehicle'; // تحديد السياق القادم من التاب النشط
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
  // ─── حالات الحقول (كلها تبدأ بنصوص فارغة) ──────────────────────────
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [projectName, setProjectName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // دالة الإرسال وحفظ البيانات في قاعدة البيانات حياً
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('حقل الكود هو المعرف الفريد الإجباري ولا يمكن تركه فارغاً.');
      return;
    }

    setSubmitting(true);
    setError(null);

    // تجهيز الداتا وإرسال الحقول غير المملوءة كـ null لسلامة قاعدة البيانات
    const payload = {
      code: code.trim().toUpperCase(), // توحيد الكود ليكون بحروف واضحة
      name: name.trim() || `آلية غير مسمية (${code})`, // اسم افتراضي إذا تُرِك فارغاً
      model: model.trim() || null,
      type, // يتم التحديد تلقائياً بناءً على التاب (equipment أو vehicle)
      serialNumber: type === 'equipment' ? (serialNumber.trim() || null) : null,
      plateNumber: type === 'vehicle' ? (plateNumber.trim() || null) : null,
      projectName: projectName.trim() || null,
      status: 'available', // أي آلية جديدة تسجل تكون جاهزة للعمل افتراضياً
    };

    try {
      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // تصفية وتنظيف الحقول تماماً للاستعداد للإدخال القادم
        setCode(''); setName(''); setModel(''); setSerialNumber(''); setPlateNumber(''); setProjectName('');
        onSuccess(); // تحديث قائمة الأسطول حياً في الخلفية
        onClose();   // إغلاق النافذة
      } else {
        const errData = await response.json();
        setError(errData.message || 'حدث خطأ أثناء حفظ البيانات، تأكد من عدم تكرار الكود.');
      }
    } catch (err) {
      console.error(err);
      setError('فشل الاتصال بالسيرفر، يرجى التحقق من الشبكة.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className={`w-full max-w-lg p-6 rounded-2xl border shadow-2xl relative transition-all ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'
      }`}>
        
        {/* هيدر النافذة الديناميكي حسب نوع التاب */}
        <div className="mb-4 pb-2 border-b border-slate-500/10">
          <h3 className="text-lg font-black text-blue-500">
            {type === 'equipment' ? '⚙️ تسجيل معدة ثقيلة جديدة في النظام' : '🚚 تسجيل مركبة / سيارة جديدة في النظام'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            جميع الحقول أدناه <span className="text-amber-500 font-bold">اختيارية لتسهيل الشغل</span> ما عدا حقل الكود الفريد فهو إجباري.
          </p>
        </div>

        {/* عرض رسائل الخطأ إن وجدت */}
        {error && (
          <div className="p-3 mb-4 text-xs font-bold bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 🔴 الحقل الإجباري الوحيد: كود وادي دفا */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">
              كود الآلية الفريد <span className="text-red-500 font-black">* (إجـبـاري)</span>:
            </label>
            <input
              type="text"
              required
              placeholder="مثال: EQ-01 أو VH-14"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`w-full px-4 py-2.5 text-sm font-black tracking-wider rounded-xl border outline-none focus:border-blue-500 transition-all ${
                isDarkMode ? 'bg-slate-950 border-slate-800 text-amber-400' : 'bg-slate-50 border-slate-200 text-blue-600'
              }`}
            />
          </div>

          {/* باقي الحقول اختيارية تماماً */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">الاسم الفني الإجمالي (اختياري):</label>
              <input
                type="text"
                placeholder="مثال: بولدوزر كاتر بيلر"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-blue-500 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">الموديل / سنة الصنع (اختياري):</label>
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
            
            {/* عرض الحقل الفريد المخصص بناءً على السياق تلقائياً */}
            {type === 'equipment' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">الرقم التسلسلي Serial Number (اختياري):</label>
                <input
                  type="text"
                  placeholder="أدخل السيريال نمبر للمعدة"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className={`w-full px-3 py-2 text-sm font-mono rounded-xl border outline-none focus:border-blue-500 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">رقم اللوحة والترميز (اختياري):</label>
                <input
                  type="text"
                  placeholder="مثال: أ ب ج 1234"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-blue-500 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">الموقع أو المشروع الحالي المبدئي (اختياري):</label>
              <input
                type="text"
                placeholder="مثال: مشروع تبنيه (اتركه فارغاً للورشة)"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-blue-500 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
              />
            </div>
          </div>

          {/* أزرار الإجراءات أسفل الشاشة */}
          <div className="pt-4 border-t border-slate-500/10 flex justify-end gap-3 items-center">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="text-xs font-bold text-slate-400 hover:text-slate-500 disabled:opacity-50"
            >
              إلغاء الأمر
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              {submitting ? 'جاري الحفظ والربط حياً...' : '💾 تثبيت الآلية في قاعدة البيانات'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
