import { Router } from 'express';
import { db } from '../db/index.js'; // تأكد من الـ .js إذا كنت شغال بـ ESM
import { projects } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// 1. جلب جميع المشاريع لتغذية القائمة المنسدلة (Dropdown) في الفرونت إند
// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const allProjects = await db.select().from(projects);
    return res.status(200).json(allProjects);
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({ error: 'فشل في جلب قائمة المشاريع' });
  }
});

// 2. إضافة مشروع جديد (يستخدمه المشرف الرئيسي في صفحة البروفايل)
// POST /api/projects
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'اسم المشروع مطلوب' });
    }

    // إدخال المشروع في قاعدة البيانات
    const newProject = await db.insert(projects).values({
      name: name.trim(),
    }).returning();

    return res.status(201).json({ success: true, project: newProject[0] });
  } catch (error: any) {
    console.error('Error creating project:', error);
    
    // معالجة حالة إذا كان اسم المشروع مكرر في قاعدة البيانات (Unique)
    if (error.code === '23505') {
      return res.status(400).json({ error: 'هذا المشروع مضاف مسبقاً في النظام' });
    }
    
    return res.status(500).json({ error: 'حدث خطأ أثناء إضافة المشروع الجديد' });
  }
});

// 3. حذف مشروع من النظام (يستخدمه المشرف الرئيسي في صفحة البروفايل)
// DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'معرف المشروع مطلوب لإتمام عملية الحذف' });
    }

    // حذف المشروع بناءً على الـ id
    await db.delete(projects).where(eq(projects.id, parseInt(id)));

    return res.status(200).json({ success: true, message: 'تم حذف المشروع بنجاح من قاعدة البيانات' });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return res.status(500).json({ error: 'حدث خطأ في السيرفر أثناء محاولة حذف المشروع' });
  }
});

export default router;
