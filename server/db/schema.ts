import { pgTable, serial, varchar, text, timestamp, integer } from 'drizzle-orm/pg-core';

// 1. جدول المستخدمين والصلاحيات (تحديث الأدوار لـ 3 مستويات)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(), // كلمة المرور المشفرة
  name: varchar('name', { length: 100 }).notNull(), // اسم المشرف الحقيقي
  
  // الصلاحيات الثلاثة: 
  // 'super_admin' (مشرف رئيسي - مدير الصيانة)
  // 'sub_admin' (مشرف فرعي - نفس الصلاحيات عدا إضافة مشرفين)
  // 'viewer' (مشرف قراءة فقط)
  role: varchar('role', { length: 20 }).notNull().default('viewer'), 
  
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. جدول المشاريع (جديد كلياً لتغذية القائمة المنسدلة وإدارة المواقع)
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 150 }).notNull().unique(), // اسم المشروع (مثل: مشروع الحزم، مشروع اليرموك)
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. جدول المعدات والمركبات (تحديث شامل لأسطول وادي دفا)
export const equipment = pgTable('equipment', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // بوكلين، قلاب، دينا، تانكر موية...
  code: varchar('code', { length: 50 }).notNull().unique(), // الكود المميز (مثل: W.B.G 001)
  model: varchar('model', { length: 50 }), // الموديل / سنة الصنع
  
  // حقل ذكي لتحديد الصنف البرمجي لسهولة الفرز والتنقل في التابات بالفرونت إند
  // قيم الحقل: 'equipment' (معدة) أو 'vehicle' (مركبة)
  type: varchar('type', { length: 20 }).notNull(), 
  
  serialNumber: varchar('serial_number', { length: 100 }), // الرقم التسلسلي (يظهر إذا كانت معدة)
  plateNumber: varchar('plate_number', { length: 50 }), // رقم اللوحة (يظهر إذا كانت مركبة)
  
  // ربط المعدة بالمشروع الحالي (قائمة منسدلة تسحب من جدول المشاريع أعلاه)
  currentProjectId: integer('current_project_id').references(() => projects.id, { onDelete: 'set null' }),
  
  // الحالات: available (جاهزة)، broken (تعطلت)، out_of_service (خارج الخدمة)
  status: varchar('status', { length: 20 }).notNull().default('available'), 
  
  // روابط الـ 3 صور من كلاودنري
  frontImageUrl: text('front_image_url'),
  backImageUrl: text('back_image_url'),
  codeImageUrl: text('code_image_url'),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. جدول سجلات الأعطال والإصلاح ("تعطلت")
export const maintenanceLogs = pgTable('maintenance_logs', {
  id: serial('id').primaryKey(),
  equipmentId: integer('equipment_id').references(() => equipment.id, { onDelete: 'cascade' }).notNull(),
  
  // تثبيت لقطة لاسم المشروع "لحظة وقوع العطل" لتوثيق التاريخ والتقارير بدقة 
  // حتى لو نُقلت المعدة لمشروع آخر لاحقاً، السجل القديم يحافظ على اسم مشروعه القديم
  projectNameSnapshot: varchar('project_name_snapshot', { length: 150 }).notNull(), 
  
  breakdownDate: timestamp('breakdown_date').notNull(), // تاريخ العطل (يتم اختياره عبر التقويم)
  repairDate: timestamp('repair_date'), // تاريخ الإصلاح (يتم اختياره عبر التقويم - يكون null طالما لسه متعطلة)
  
  details: text('details'), // تفاصيل ووصف العطل الفني المكتوب
  
  // حالة البلاغ الحالي: 'broken' (لسه متعطلة) أو 'repaired' (تم الإصلاح)
  status: varchar('status', { length: 20 }).notNull().default('broken'),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. جدول تفاصيل المشتريات والقطع (جديد كلياً - ديناميكي مرتبط بكل عطل)
export const maintenanceItems = pgTable('maintenance_items', {
  id: serial('id').primaryKey(),
  // ربط القطعة بسجل العطل (إذا حُذف سجل العطل تحذف مشترياته تلقائياً لسلامة البيانات)
  maintenanceLogId: integer('maintenance_log_id').references(() => maintenanceLogs.id, { onDelete: 'cascade' }).notNull(),
  
  itemName: varchar('item_name', { length: 255 }).notNull(), // اسم القطعة/المادة المشتراة (مثال: لديتر جديد، خراطيم، زيت)
  price: integer('price').notNull(), // سعر القطعة الواحدة بالريال (قيمة صحيحة لسهولة الحساب التلقائي)
  
  createdAt: timestamp('created_at').defaultNow(),
});
