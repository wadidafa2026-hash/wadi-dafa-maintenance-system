// client/src/components/EquipmentProfileModal.tsx
import React, { useState, useEffect } from 'react';

interface EquipmentProfileModalProps {
  equipment: any;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  userRole: 'super_admin' | 'sub_admin' | 'viewer';
  isDarkMode?: boolean;
}

export const EquipmentProfileModal: React.FC<EquipmentProfileModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onRefresh,
  userRole,
  isDarkMode = false,
}) => {
  // ─── حالات البيانات القابلة للتعديل ──────────────────────────────────
  const [formData, setFormData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // تحديث الحالات عند فتح المودال أو تغيير الآلية المختارة
  useEffect(() => {
    if (equipment) {
      setFormData(equipment);
      setIsEditing(false);
    }
  }, [equipment]);

  if (!isOpen || !equipment) return null;

  const handleUpdate = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/equipment/${equipment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onRefresh();
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const isReadOnly = !isEditing || userRole === 'viewer';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className={`w-full max-w-lg p-6 rounded-2xl border shadow-2xl relative transition-all ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'
      }`}>
        
        {/* هيدر البروفايل */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-black text-blue-500">{formData.name}</h3>
            <p className="text-xs text-slate-400 font-mono mt-1">كود وادي دفا: {formData.code}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-black text-xl">✕</button>
        </div>

        {/* حقول البيانات */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">الاسم الفني:</label>
              <input 
                disabled={isReadOnly}
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${isReadOnly ? 'bg-transparent border-transparent' : 'bg-slate-500/5 border-slate-500/20'}`}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">الموديل:</label>
              <input 
                disabled={isReadOnly}
                value={formData.model || ''}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${isReadOnly ? 'bg-transparent border-transparent' : 'bg-slate-500/5 border-slate-500/20'}`}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">الموقع/المشروع الحالي:</label>
            <input 
              disabled={isReadOnly}
              value={formData.projectName || ''}
              onChange={(e) => setFormData({...formData, projectName: e.target.value})}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${isReadOnly ? 'bg-transparent border-transparent' : 'bg-slate-500/5 border-slate-200'}`}
            />
          </div>

          {/* حقول السيريال/اللوحة */}
          {formData.type === 'equipment' ? (
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">الرقم التسلسلي:</label>
              <input 
                disabled={isReadOnly}
                value={formData.serialNumber || ''}
                onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${isReadOnly ? 'bg-transparent border-transparent' : 'bg-slate-500/5 border-slate-200'}`}
              />
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">رقم اللوحة:</label>
              <input 
                disabled={isReadOnly}
                value={formData.plateNumber || ''}
                onChange={(e) => setFormData({...formData, plateNumber: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${isReadOnly ? 'bg-transparent border-transparent' : 'bg-slate-500/5 border-slate-200'}`}
              />
            </div>
          )}
        </div>

        {/* تذييل الإجراءات */}
        <div className="mt-8 pt-4 border-t border-slate-500/10 flex justify-end gap-3">
          {userRole !== 'viewer' && (
            <>
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="text-xs px-4 py-2 text-slate-400 hover:text-slate-500">إلغاء</button>
                  <button 
                    onClick={handleUpdate}
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    {submitting ? 'جاري الحفظ...' : '💾 حفظ التعديلات'}
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  ✏️ تعديل بيانات الآلية
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
