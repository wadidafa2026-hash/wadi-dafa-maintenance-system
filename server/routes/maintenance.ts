import { Router } from 'express';
import { db } from '../db/index.js';
import { maintenanceLogs, equipment } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const router = Router();

// 1. رابط جلب كل سجلات الصيانة في السيستم (GET /api/maintenance)
router.get('/', async (req, res) => {
  try {
    const logs = await db.select().from(maintenanceLogs).orderBy(desc(maintenanceLogs.entryDate));
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب سجلات الصيانة', error });
  }
});

// 2. رابط إدخال معدة للورشة أو إخراجها من الخدمة (POST /api/maintenance/enter)
router.post('/enter', async (req, res) => {
  try {
    const { equipmentId, maintenanceType, details } = req.body;

    if (!equipmentId || !maintenanceType) {
      return res.status(400).json({ message: 'الرجاء تحديد المعدة ونوع الصيانة' });
    }

    // أ/ جلب بيانات المعدة الحالية عشان نعرف السائق الماشي بيها أسي ونثبته في العطل
    const asset = await db.select().from(equipment).where(eq(equipment.id, equipmentId));
    if (asset.length === 0) {
      return res.status(404).json({ message: 'المعدة غير موجودة' });
    }

    const currentDriverAtFault = asset[0].currentDriver;
    // نحدد الحالة الجيدة بناءً على نوع الحركة (إما صيانة أو خارج الخدمة تماماً)
    const nextStatus = maintenanceType === 'خارج الخدمة' ? 'out_of_service' : 'in_maintenance';

    // ب/ فتح أورنيك (سجل) صيانة جديد وتثبيت السائق
    const newLog = await db.insert(maintenanceLogs).values({
      equipmentId,
      driverAtFault: currentDriverAtFault,
      maintenanceType,
      details,
    }).returning();

    // ج/ تحديث حالة المعدة في جدولها الرئيسي
    await db.update(equipment)
      .set({ status: nextStatus })
      .where(eq(equipment.id, equipmentId));

    res.status(201).json({ message: 'تم إدخال المعدة للصيانة وتوثيق السائق بنجاح', log: newLog[0] });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إدخال المعدة للصيانة', error });
  }
});

// 3. رابط إخراج المعدة من الصيانة وإعادتها للخدمة (POST /api/maintenance/exit/:logId)
router.post('/exit/:logId', async (req, res) => {
  try {
    const logId = parseInt(req.params.logId);

    // أ/ جلب سجل الصيانة المفتوح عشان نعرف الـ equipmentId
    const logEntry = await db.select().from(maintenanceLogs).where(eq(maintenanceLogs.id, logId));
    if (logEntry.length === 0) {
      return res.status(404).json({ message: 'سجل الصيانة هذا غير موجود' });
    }

    // ب/ تحديث السجل بوضع تاريخ الخروج (الآن)
    await db.update(maintenanceLogs)
      .set({ exitDate: new Date() })
      .where(eq(maintenanceLogs.id, logId));

    // ج/ إرجاع حالة المعدة في الجدول الرئيسي لتكون جاهزة ومتاحة (available)
    await db.update(equipment)
      .set({ status: 'available' })
      .where(eq(equipment.id, logEntry[0].equipmentId));

    res.json({ message: 'تم إخراج المعدة من الصيانة وإعادتها للخدمة بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إخراج المعدة من الصيانة', error });
  }
});

export default router;
