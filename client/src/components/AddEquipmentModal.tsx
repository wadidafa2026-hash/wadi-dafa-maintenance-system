// client/src/components/AddEquipmentModal.tsx
import React, { useState, useEffect } from 'react';

interface Project {
  id: number;
  name: string;
}

interface AddEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // لتحديث الجدول في الـ Dashboard بعد الإضافة
}

export const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState<'equipment' | 'vehicle'>('equipment'); 
  const [serialNumber, setSerialNumber] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [currentProjectId, setCurrentProjectId] = useState('');
  
  // روابط الصور من كلاودنري
  const [frontImageUrl, setFrontImageUrl] = useState('');
  const [backImageUrl, setBackImageUrl] = useState('');
  const [codeImageUrl, setCodeImageUrl] = useState('');

  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // جلب المشاريع لتغذية الـ Dropdown
  useEffect(() => {
    if (isOpen) {
      fetch('/api/projects')
        .then((res) => res.json())
        .then((data) => setProjects(data))
        .catch((err) => console.error('Error fetching projects:', err));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      name,
      code,
      model,
      type,
      serialNumber: type === 'equipment' ? serialNumber : null,
      plateNumber: type === 'vehicle' ? plateNumber : null,
      currentProjectId: currentProjectId ? Number(currentProjectId) : null,
      frontImageUrl: frontImageUrl || null,
      backImageUrl: backImageUrl || null,
      codeImageUrl: codeImageUrl || null,
    };

    try {
      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'فشل في حفظ البيانات');

      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName(''); setCode(''); setModel(''); setType('equipment');
    setSerialNumber(''); setPlateNumber(''); setCurrentProjectId('');
    setFrontImageUrl(''); setBackImageUrl(''); setCodeImageUrl('');
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" dir="rtl">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in duration-200">
        
        {/* الهيدر الأنيق باللون الأزرق المعتمد لأسطول وادي دفا */}
        <div className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-bold">تسجيل آلية جديدة بالأسطول</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl font-bold">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="bg-red-50 border-r-4 border-red-500 text-red-700 p-3 rounded text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* التبديل الذكي بين معدة ومركبة */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">تصنيف الآلية</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('equipment')}
                className={`py-2.5 text-center font-medium rounded-lg border transition-all text-sm ${
                  type === 'equipment' ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                ⚙️ معدة (بوكلين، بلدوزر..)
              </button>
              <button
                type="button"
                onClick={() => setType('vehicle')}
                className={`py-2.5 text-center font-medium rounded-lg border transition-all text-sm ${
                  type === 'vehicle' ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                🚚 مركبة (قلاب، تانكر..)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">اسم الآلية الإجمالي *</label>
              <input
                type="text" required placeholder="مثال: بلدوزر كوماتسو" value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">كود الآلية المميز *</label>
              <input
                type="text" required placeholder="مثال: W.B.G 001" value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">الموديل</label>
              <input
                type="text" placeholder="مثال: 2024" value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">الموقع / المشروع الحالي</label>
              <select
                value={currentProjectId} onChange={(e) => setCurrentProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">-- اختر المشروع الحركي أو ورشة مركزية --</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          {/* الحقل الشرطي الحركي المميز لأسطول وادي دفا */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            {type === 'equipment' ? (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">الرقم التسلسلي (Serial Number) *</label>
                <input
                  type="text" required={type === 'equipment'} placeholder="أدخل السيريال نمبر الخاص بالمعدة" value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">رقم اللوحة *</label>
                <input
                  type="text" required={type === 'vehicle'} placeholder="مثال: 1234 أ ب ج" value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                />
              </div>
            )}
          </div>

          {/* روابط الصور الثلاثة للمطابقة الكاملة */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-500">روابط معاينة الصور (Cloudinary Links)</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input type="text" placeholder="رابط الصورة الأمامية" value={frontImageUrl} onChange={(e) => setFrontImageUrl(e.target.value)} className="px-2 py-1.5 border rounded text-xs" />
              <input type="text" placeholder="رابط الصورة الخلفية" value={backImageUrl} onChange={(e) => setBackImageUrl(e.target.value)} className="px-2 py-1.5 border rounded text-xs" />
              <input type="text" placeholder="رابط صورة كود المعدة" value={codeImageUrl} onChange={(e) => setCodeImageUrl(e.target.value)} className="px-2 py-1.5 border rounded text-xs" />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end space-x-2 space-x-reverse">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg">إلغاء</button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:bg-blue-400">
              {isSubmitting ? 'جاري التأكيد والرفع...' : 'تأكيد وإضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
