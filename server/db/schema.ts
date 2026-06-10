import { pgTable, serial, varchar, text, timestamp, integer } from 'drizzle-orm/pg-core';

// 1. جدول المستخدمين والصلاحيات (مشرف رئيسي أو قراءة فقط)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(), // الباسورد مشفرة
  name: varchar('name', { length: 100 }).notNull(), // اسم المشرف الحقيقي
  role: varchar('role', { length: 20 }).notNull().default('viewer'), // الصلاحية: 'super_admin' أو 'viewer'
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. جدول المعدات والآليات (أسطول وادي دفا)
export const equipment = pgTable('equipment', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // بوكلين، قلاب، كرين...
  code: varchar('code', { length: 50 }).notNull().unique(), // الكود الفريد (مثال: W.B.G 0001)
  model: varchar('model', { length: 50 }), // الموديل / سنة الصنع
  serialNumber: varchar('serial_number', { length: 100 }), // الرقم التسلسلي
  plateNumber: varchar('plate_number', { length: 50 }), // رقم اللوحة
  currentDriver: varchar('current_driver', { length: 100 }).notNull(), // اسم السائق الحالي
  
  // الحالات الثلاثة: available (جاهزة), in_maintenance (في الصيانة), out_of_service (خارج الخدمة)
  status: varchar('status', { length: 20 }).notNull().default('available'), 
  
  // روابط الـ 3 صور من كلاودنري (nullable عشان تترفع براحتهم متى ما توفرت)
  frontImageUrl: text('front_image_url'),
  backImageUrl: text('back_image_url'),
  codeImageUrl: text('code_image_url'),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. جدول سجلات وعمليات الصيانة
export const maintenanceLogs = pgTable('maintenance_logs', {
  id: serial('id').primaryKey(),
  equipmentId: integer('equipment_id').references(() => equipment.id, { onDelete: 'cascade' }).notNull(),
  
  // تثبيت اسم السائق اللي كان سايق المعدة "لحظة وقوع العطل" لتوثيق التاريخ صح
  driverAtFault: varchar('driver_at_fault', { length: 100 }).notNull(), 
  
  entryDate: timestamp('entry_date').defaultNow().notNull(), // تاريخ دخول الصيانة
  exitDate: timestamp('exit_date'), // تاريخ الخروج (يكون null لحد ما تطلع وتتصلح)
  
  maintenanceType: varchar('maintenance_type', { length: 100 }).notNull(), // نوع الصيانة (دورية، طارئة، إصلاح عطل)
  details: text('details'), // تفاصيل العطل والقطع المتضررة
  
  createdAt: timestamp('created_at').defaultNow(),
});
