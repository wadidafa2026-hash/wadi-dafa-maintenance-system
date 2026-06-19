import { Router } from 'express';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// 1️⃣ رابط تسجيل الدخول (POST /api/auth/login)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'الرجاء إدخال اسم المستخدم وكلمة المرور' });
    }

    const foundUser = await db.select().from(users).where(eq(users.username, username));

    if (foundUser.length === 0 || foundUser[0].password !== password) {
      return res.status(401).json({ message: 'عفواً، اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    res.json({
      message: 'تم تسجيل الدخول بنجاح مرحبا بك',
      user: {
        id: foundUser[0].id,
        name: foundUser[0].name,
        username: foundUser[0].username,
        role: foundUser[0].role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ في سيرفر الصلاحيات', error });
  }
});

// 2️⃣ رابط تغيير كلمة المرور الشخصية (POST /api/auth/change-password)
router.post('/change-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
    }

    // التأكد من صحة كلمة المرور الحالية
    const foundUser = await db.select().from(users).where(eq(users.username, username));
    if (foundUser.length === 0 || foundUser[0].password !== currentPassword) {
      return res.status(401).json({ message: 'كلمة المرور الحالية غير صحيحة' });
    }

    // تحديث كلمة المرور في الداتابيز
    await db.update(users)
      .set({ password: newPassword })
      .where(eq(users.username, username));

    res.json({ message: 'تم تحديث كلمة المرور بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في السيرفر أثناء تحديث الباسورد', error });
  }
});

// 3️⃣ رابط جلب قائمة المشرفين (GET /api/auth/users)
router.get('/users', async (req, res) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      username: users.username,
      role: users.role
    }).from(users);

    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في السيرفر أثناء جلب المشرفين', error });
  }
});

// 4️⃣ رابط إنشاء حساب مشرف/مراقب جديد (POST /api/auth/users)
router.post('/users', async (req, res) => {
  try {
    const { name, username, password, role } = req.body;

    if (!name || !username || !password || !role) {
      return res.status(400).json({ message: 'الرجاء ملء جميع الحقول المطلوبة' });
    }

    // التأكد من عدم تكرار اسم المستخدم
    const existingUser = await db.select().from(users).where(eq(users.username, username));
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'اسم المستخدم هذا محجوز مسبقاً، اختر اسماً آخر' });
    }

    // إدخال الحساب الجديد في الداتابيز
    await db.insert(users).values({
      name,
      username,
      password,
      role
    });

    res.json({ message: 'تم إنشاء الحساب بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في السيرفر أثناء إنشاء الحساب', error });
  }
});

// 5️⃣ رابط حذف مشرف/مراقب نهائياً (DELETE /api/auth/users/:id)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'معرف المستخدم مطلوب لإتمام الحذف' });
    }

    // تنفيذ أمر الحذف من قاعدة البيانات بناءً على الرقم المعرف
    await db.delete(users).where(eq(users.id, parseInt(id)));

    res.json({ message: 'تم سحب الصلاحية وحذف المشرف بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في السيرفر أثناء محاولة حذف المشرف', error });
  }
});

export default router;
