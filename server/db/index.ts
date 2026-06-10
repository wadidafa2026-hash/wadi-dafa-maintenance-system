import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';
import 'dotenv/config';

// التأكد من أن رابط قاعدة البيانات موجود وما فاضي
if (!process.env.DATABASE_URL) {
  throw new Error('عفواً: رابط الـ DATABASE_URL غير موجود في ملف البيئة .env');
}

// إنشاء الاتصال عبر الـ HTTP الخفيف والمناسب للبيئات السحابية
const sql = neon(process.env.DATABASE_URL);

// تصدير نسخة الداتابيز (db) عشان نستخدمها في كل الـ APIs الجاية
export const db = drizzle(sql, { schema });
