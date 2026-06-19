// server/routes/upload.ts
import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

const router = Router();
dotenv.config();

// 1️⃣ إعداد حساب كلاودنري بمفاتيح البيئة
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2️⃣ إعداد مكتبة multer لاستقبال الملفات وتخزينها مؤقتاً
const storage = multer.diskStorage({});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // الحد الأقصى 5 ميجابايت للصور الميدانية
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('عفواً، يجب أن يكون الملف المرفوع صورة فقط!') as any, false);
    }
  }
});

// 3️⃣ رابط استقبال الرفع من الفرونت إند (POST /api/upload)
router.post('/', upload.single('image'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'الرجاء إرفاق ملف الصورة المراد رفعها' });
    }

    // رفع الملف من السيرفر المحلي إلى سحابة كلاودنري داخل مجلد wadi-dafa
    const folder = req.body.folder || 'equipments';
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `wadi-dafa/${folder}`,
    });

    // إرجاع الرابط الآمن النهائي للفرونت إند
    return res.status(200).json({ success: true, imageUrl: result.secure_url });
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({ error: error.message || 'حدث خطأ أثناء معالجة ورفع الصورة' });
  }
});

export default router;
