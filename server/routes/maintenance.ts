// server/routes/maintenance.ts
import { Router } from 'express';
import { db } from '../db';
import { maintenanceLogs, equipment, projects } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

// 1. تسجيل بلاغ عطل جديد ("تعطلت")
router.post('/breakdown', async (req, res) => {
  try {
    const { equipmentId, breakdownDate, details } = req.body;
    if (!equipmentId || !breakdownDate) return res.status(400).json({ error: 'معرف الآلية وتاريخ العطل حقول مطلوبة' });

    const targetEquipment = await db
      .select({ id: equipment.id, currentProjectId: equipment.currentProjectId, projectName: projects.name })
      .from(equipment)
      .leftJoin(projects, eq(equipment.currentProjectId, projects.id))
      .where(eq(equipment.id, Number(equipmentId)))
      .limit(1);

    if (targetEquipment.length === 0) return res.status(404).json({ error: 'الآلية غير موجودة بالنظام' });
    const currentProjectName = targetEquipment[0].projectName || 'خارج المشاريع / الورشة المركزية';

    const newLog = await db.insert(maintenanceLogs).values({
      equipmentId: Number(equipmentId),
      projectNameSnapshot: currentProjectName,
      breakdownDate: new Date(breakdownDate),
      details: details ? details.trim() : null,
      status: 'broken',
    }).returning();

    await db.update(equipment).set({ status: 'broken' }).where(eq(equipment.id, Number(equipmentId)));
    return res.status(201).json({ success: true, log: newLog[0] });
  } catch (error) {
    console.error('Error logging breakdown:', error);
    return res.status(500).json({ error: 'فشل في تسجيل بلاغ العطل' });
  }
});

// 2. إغلاق بلاغ العطل وتحديد تاريخ الجاهزية ("تم الإصلاح")
router.put('/repair/:logId', async (req, res) => {
  try {
    const { logId } = req.params;
    const { repairDate } = req.body;
    if (!repairDate) return res.status(400).json({ error: 'تاريخ الإصلاح مطلوب' });

    const updatedLog = await db.update(maintenanceLogs)
      .set({ repairDate: new Date(repairDate), status: 'repaired' })
      .where(eq(maintenanceLogs.id, Number(logId))).returning();

    if (updatedLog.length === 0) return res.status(404).json({ error: 'سجل العطل غير موجود' });

    await db.update(equipment).set({ status: 'available' }).where(eq(equipment.id, updatedLog[0].equipmentId));
    return res.status(200).json({ success: true, log: updatedLog[0] });
  } catch (error) {
    console.error('Error closing maintenance log:', error);
    return res.status(500).json({ error: 'حدث خطأ أثناء إغلاق بلاغ الصيانة' });
  }
});

// 3. جلب التاريخ الصيانة الكامل لآلية معينة
router.get('/history/:equipmentId', async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const history = await db.select().from(maintenanceLogs)
      .where(eq(maintenanceLogs.equipmentId, Number(equipmentId)))
      .orderBy(desc(maintenanceLogs.breakdownDate));
    return res.status(200).json(history);
  } catch (error) {
    return res.status(500).json({ error: 'فشل في جلب سجلات صيانة المعدة' });
  }
});

// 4. جلب تقرير شامل لجميع الأعطال
router.get('/reports/all', async (req, res) => {
  try {
    const records = await db.select({
      id: maintenanceLogs.id, equipmentId: maintenanceLogs.equipmentId, equipmentCode: equipment.code,
      equipmentName: equipment.name, equipmentType: equipment.type, serialNumber: equipment.serialNumber,
      plateNumber: equipment.plateNumber, breakdownDate: maintenanceLogs.breakdownDate,
      repairDate: maintenanceLogs.repairDate, details: maintenanceLogs.details, projectNameSnapshot: maintenanceLogs.projectNameSnapshot,
    }).from(maintenanceLogs).innerJoin(equipment, eq(maintenanceLogs.equipmentId, equipment.id)).orderBy(desc(maintenanceLogs.breakdownDate));
    return res.status(200).json(records);
  } catch (error) {
    return res.status(500).json({ error: 'فشل في توليد بيانات التقارير' });
  }
});

// 5. تعديل شامل لبيانات سجل عطل/صيانة معين
router.put('/logs/:logId', async (req, res) => {
  try {
    const { logId } = req.params;
    const { breakdownDate, repairDate, details } = req.body;
    if (!breakdownDate) return res.status(400).json({ error: 'تاريخ العطل مطلوب' });

    const updateData: any = { breakdownDate: new Date(breakdownDate), details: details ? details.trim() : null };
    if (repairDate) { updateData.repairDate = new Date(repairDate); updateData.status = 'repaired'; }
    else { updateData.repairDate = null; updateData.status = 'broken'; }

    const updatedRecord = await db.update(maintenanceLogs).set(updateData).where(eq(maintenanceLogs.id, Number(logId))).returning();
    if (updatedRecord.length === 0) return res.status(404).json({ error: 'السجل غير موجود' });

    await db.update(equipment).set({ status: updateData.status }).where(eq(equipment.id, updatedRecord[0].equipmentId));
    return res.status(200).json({ success: true, log: updatedRecord[0] });
  } catch (error) {
    return res.status(500).json({ error: 'حدث خطأ داخلي' });
  }
});

// 🤖 6. مسار استقبال محادثات المستشار الذكي لشركة وادي دفا (نسخة مرنة وتوجيهية بالكامل)
// POST /api/maintenance/ai-chat
router.post('/ai-chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, error: 'الرسالة فارغة' });

    const fleetData = await db.select({ code: equipment.code, name: equipment.name, status: equipment.status, type: equipment.type }).from(equipment);
    const logsData = await db.select({ code: equipment.code, name: equipment.name, breakdown: maintenanceLogs.breakdownDate, repair: maintenanceLogs.repairDate, details: maintenanceLogs.details, project: maintenanceLogs.projectNameSnapshot }).from(maintenanceLogs).innerJoin(equipment, eq(maintenanceLogs.equipmentId, equipment.id));

    const systemInstruction = `
      أنت "المستشار الفني الذكي ومطور النظم" الرسمي لنظام صيانة المعدات والمركبات في (شركة وادي دفا للمقاولات).
      خاطب المستخدم دائماً بلقب هندسي محترم: "يا هندسة". أسلوبك يجب أن يكون مهنياً، مرناً جداً، وودوداً، يعكس عقلية خبير صيانة ومطور برمجيات في آن واحد.

      نطاق صلاحياتك وطريقة تعاملك:
      1. دقة البيانات: فيما يتعلق بحالة الأسطول، الأرقام، وسجلات الأعطال، يجب أن تعتمد تماماً على البيانات الحية المرفقة أدناه ولا تقم بابتكار أي أرقام من عندك.
      2. المرونة والنقاش: مسموح لك تماماً وبكل أريحية أن تبادل المستخدم أطراف الحديث، وتتناقش معه في أفكار لتطوير هذا الموقع، أو مناقشة ميزات برمجية جديدة، أو إعطاء نصائح ميكانيكية عامة وفنية حول صيانة المعدات. لا تقل أبداً "مهمتي حصر البيانات فقط".
      3. توجيه المستخدم في الواجهة (Navigation): عندما يطلب المستخدم الانتقال لصفحة معينة، أو عندما تلاحظ من سياق كلامه أنه يريد رؤية التقارير، أو فحص الأسطول، أو تعديل البيانات، قم بإدراج الرابط الخاص بالصفحة داخل النص بصيغة المارك داون [اسم الرابط](المسار) لكي تتمكن واجهة الـ Frontend من تحويلها لروابط قابلة للضغط والتحويل الفوري.

      قائمة المسارات والصفحات المتوفرة في النظام للتوجيه:
      - لوحة التحكم والإحصائيات الرئيسية: [/dashboard]
      - صفحة أسطول المعدات والآليات: [/fleet]
      - صفحة التقارير الشاملة وجداول الأعطال: [/reports]
      - صفحة المركز الموحد / المحور: [/hub]
      - الملف الشخصي للمستخدم: [/profile]
      - صفحة الدردشة الذكية (الحالية): [/ai-chat]

      مثال للتوجيه: "أبشر يا هندسة، يمكنك الإطلاع على كشوفات الصيانة الكاملة عبر الانتقال مباشرة إلى [صفحة التقارير الشاملة](/reports)."

      البيانات الحية الفورية من قاعدة البيانات حالياً:
      - الأسطول: ${JSON.stringify(fleetData)}
      - سجل الأعطال: ${JSON.stringify(logsData)}
    `;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: systemInstruction 
    });

    const result = await model.generateContent(message);
    const replyText = result.response.text() || "لم أتمكن من استخراج الإجابة الفنية، يرجى المحاولة مرة أخرى.";

    return res.json({ success: true, reply: replyText });
  } catch (error) {
    console.error('Gemini SDK Error:', error);
    return res.status(500).json({ success: false, error: 'عذراً يا هندسة، فشل سيرفر الذكاء الاصطناعي في معالجة البيانات.' });
  }
});

export default router;
