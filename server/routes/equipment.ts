import { Router } from 'express';
import { db } from '../db/index.js';
import { equipment } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// 1. رابط جلب كل المعدات (GET /api/equipment)
router.get('/', async (req, res) => {
  try {
    const allEquipment = await db.select().from(equipment);
    res.json(allEquipment);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب بيانات المعدات', error });
  }
});

// 2. رابط جلب معدة واحدة محددة بالـ ID حقها (GET /api/equipment/:id)
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const item = await db.select().from(equipment).where(eq(equipment.id, id));
    
    if (item.length === 0) {
      return res.status(404).json({ message: 'المعدة غير موجودة' });
    }
    
    res.json(item[0]);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب بروفايل المعدة', error });
  }
});

// 3. رابط إضافة معدة جديدة (POST /api/equipment)
router.post('/', async (req, res) => {
  try {
    const { name, code, model, serialNumber, plateNumber, currentDriver } = req.body;
    
    // التأكد من الحقول الأساسية ما فاضية
    if (!name || !code || !currentDriver) {
      return res.status(400).json({ message: 'الرجاء إدخال اسم المعدة، الكود، واسم السائق الحالي' });
    }

    const newAsset = await db.insert(equipment).values({
      name,
      code,
      model,
      serialNumber,
      plateNumber,
      currentDriver,
      status: 'available' // أي معدة بتنزل جديدة حتكون جاهزة للعمل تلقائياً
    }).returning();

    res.status(201).json({ message: 'تمت إضافة المعدة بنجاح', data: newAsset[0] });
  } catch (error: any) {
    // معالجة إذا الكود مكرر لأننا عاملينه Unique في الداتابيز
    if (error.code === '23505') {
      return res.status(400).json({ message: 'عفواً، هذا الكود مسجل لمعدة أخرى مسبقاً' });
    }
    res.status(500).json({ message: 'حدث خطأ أثناء إضافة المعدة', error });
  }
});

// 4. رابط تعديل بيانات المعدة أو السائق أو الصور (PATCH /api/equipment/:id)
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body; // البيانات الداير يتعدل بس (سواق، صور، حالة)

    const updatedAsset = await db.update(equipment)
      .set(updates)
      .where(eq(equipment.id, id))
      .returning();

    if (updatedAsset.length === 0) {
      return res.status(404).json({ message: 'المعدة غير موجودة لتعديلها' });
    }

    res.json({ message: 'تم تحديث البيانات بنجاح', data: updatedAsset[0] });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث بيانات المعدة', error });
  }
});

export default router;
