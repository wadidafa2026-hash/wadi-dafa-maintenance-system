import { Router } from 'express';
import { db } from '../db';
import { equipment, projects } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// 1. جلب جميع الآليات (معدات ومركبات) مع دمج اسم المشروع الحالي
// GET /api/equipment
router.get('/', async (req, res) => {
  try {
    const allEquipment = await db
      .select({
        id: equipment.id,
        name: equipment.name,
        code: equipment.code,
        model: equipment.model,
        type: equipment.type,
        serialNumber: equipment.serialNumber,
        plateNumber: equipment.plateNumber,
        status: equipment.status,
        frontImageUrl: equipment.frontImageUrl,
        backImageUrl: equipment.backImageUrl,
        codeImageUrl: equipment.codeImageUrl,
        currentProjectId: equipment.currentProjectId,
        projectName: projects.name, // جلب اسم المشروع من الجدول الآخر
        createdAt: equipment.createdAt,
      })
      .from(equipment)
      .leftJoin(projects, eq(equipment.currentProjectId, projects.id)); // ربط الجدولين بناءً على ID المشروع

    return res.status(200).json(allEquipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return res.status(500).json({ error: 'حدث خطأ أثناء جلب بيانات الأسطول' });
  }
});

// 2. إضافة آلية جديدة (معدة أو مركبة) بالـ 3 صور والمشروع وبدون سائق
// POST /api/equipment
router.post('/', async (req, res) => {
  try {
    const {
      name,
      code,
      model,
      type, // 'equipment' أو 'vehicle'
      serialNumber,
      plateNumber,
      currentProjectId,
      frontImageUrl,
      backImageUrl,
      codeImageUrl
    } = req.body;

    // التحقق من الحقول الأساسية
    if (!name || !code || !type) {
      return res.status(400).json({ error: 'الاسم، الكود، ونوع الآلية حقول مطلوبة' });
    }

    // إدخال البيانات الجديدة في الجدول
    const newEquipment = await db.insert(equipment).values({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      model: model ? model.trim() : null,
      type,
      serialNumber: type === 'equipment' ? serialNumber : null, // إذا مركبة يكون null
      plateNumber: type === 'vehicle' ? plateNumber : null,    // إذا معدة يكون null
      currentProjectId: currentProjectId ? Number(currentProjectId) : null,
      frontImageUrl,
      backImageUrl,
      codeImageUrl,
      status: 'available' // الحالة الافتراضية جاهزة للعمل
    }).returning();

    return res.status(201).json({ success: true, equipment: newEquipment[0] });
  } catch (error: any) {
    console.error('Error creating equipment:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'كود الآلية مكرر! يرجى استخدام كود فريد' });
    }
    return res.status(500).json({ error: 'فشل في تسجيل الآلية الجديدة' });
  }
});

// 3. تعديل بيانات آلية أو نقلها من مشروع لآخر (يفتح في البروفايل المنبثق)
// PUT /api/equipment/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      model,
      serialNumber,
      plateNumber,
      currentProjectId,
      status,
      frontImageUrl,
      backImageUrl,
      codeImageUrl
    } = req.body;

    // تحديث السجل في قاعدة البيانات
    const updatedEquipment = await db
      .update(equipment)
      .set({
        name: name ? name.trim() : undefined,
        code: code ? code.trim().toUpperCase() : undefined,
        model: model !== undefined ? model : undefined,
        serialNumber: serialNumber !== undefined ? serialNumber : undefined,
        plateNumber: plateNumber !== undefined ? plateNumber : undefined,
        currentProjectId: currentProjectId !== undefined ? (currentProjectId ? Number(currentProjectId) : null) : undefined,
        status: status !== undefined ? status : undefined,
        frontImageUrl: frontImageUrl !== undefined ? frontImageUrl : undefined,
        backImageUrl: backImageUrl !== undefined ? backImageUrl : undefined,
        codeImageUrl: codeImageUrl !== undefined ? codeImageUrl : undefined,
      })
      .where(eq(equipment.id, Number(id)))
      .returning();

    if (updatedEquipment.length === 0) {
      return res.status(404).json({ error: 'الآلية غير موجودة بالنظام' });
    }

    return res.status(200).json({ success: true, equipment: updatedEquipment[0] });
  } catch (error: any) {
    console.error('Error updating equipment:', error);
    return res.status(500).json({ error: 'حدث خطأ أثناء تحديث بيانات الآلية' });
  }
});

export default router;
