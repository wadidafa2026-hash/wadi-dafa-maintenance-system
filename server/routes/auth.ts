import { Router } from 'express';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// رابط تسجيل الدخول (POST /api/auth/login)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // التأكد من إدخال البيانات
    if (!username || !password) {
      return res.status(400).json({ message: 'الرجاء إدخال اسم المستخدم وكلمة المرور' });
    }

    // البحث عن المستخدم في قاعدة البيانات بـ اسم المستخدم
    const foundUser = await db.select().from(users).where(eq(users.username, username));

    // إذا ما لحيناهو
    if (foundUser.length === 0) {
      return res.status(401).json({ message: 'عفواً، اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    // مطابقة كلمة المرور
    if (foundUser[0].password !== password) {
      return res.status(401).json({ message: 'عفواً، اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    // إذا كله تمام، نرسل بياناته وصلاحيته طوالي للواجهة
    res.json({
      message: 'تم تسجيل الدخول بنجاح مرحبا بك',
      user: {
        id: foundUser[0].id,
        name: foundUser[0].name,
        username: foundUser[0].username,
        role: foundUser[0].role // حتكون إما super_admin أو viewer
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ في سيرفر الصلاحيات', error });
  }
});

export default router;
