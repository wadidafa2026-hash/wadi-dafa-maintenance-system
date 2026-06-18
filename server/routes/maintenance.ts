// server/routes/maintenance.ts
import { Router } from 'express';
import { db } from '../db';
import { maintenanceLogs, equipment, projects } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const router = Router();

// 1. تسجيل بلاغ عطل جديد ("تعطلت") مع أخذ لقطة للمشروع الحالي تلقائياً
// POST /api/maintenance/breakdown
router.post('/breakdown', async (req, res) => {
  try {
    const { equipmentId, breakdownDate, details } = req.body;

    if (!equipmentId || !breakdownDate) {
      return res.status(400).json({ error: 'معرف الآلية وتاريخ العطل حقول مطلوبة' });
    }

    // جلب بيانات الآلية مع اسم مشروعها الحالي لأخذ اللقطة التاريخية
    const targetEquipment = await db
      .select({
        id: equipment.id,
        currentProjectId: equipment.currentProjectId,
        projectName: projects.name,
      })
      .from(equipment)
      .leftJoin(projects, eq(equipment.currentProjectId, projects.id))
      .where(eq(equipment.id, Number(equipmentId)))
      .limit(1);

    if (targetEquipment.length === 0) {
      return res.status(404).json({ error: 'الآلية غير موجودة بالنظام' });
    }

    const currentProjectName = targetEquipment[0].projectName || 'خارج المشاريع / الورشة المركزية';

    // أ) إنشاء سجل العطل الجديد
    const newLog = await db.insert(maintenanceLogs).values({
      equipmentId: Number(equipmentId),
      projectNameSnapshot: currentProjectName,
      breakdownDate: new Date(breakdownDate),
      details: details ? details.trim() : null,
      status: 'broken',
    }).returning();

    // ب) تحديث حالة المعدة نفسها في جدول الأسطول لتصبح متعطلة
    await db
      .update(equipment)
      .set({ status: 'broken' })
      .where(eq(equipment.id, Number(equipmentId)));

    return res.status(201).json({ success: true, log: newLog[0] });
  } catch (error) {
    console.error('Error logging breakdown:', error);
    return res.status(500).json({ error: 'فشل في تسجيل بلاغ العطل' });
  }
});

// 2. إغلاق بلاغ العطل وتحديد تاريخ الجاهزية ("تم الإصلاح")
// PUT /api/maintenance/repair/:logId
router.put('/repair/:logId', async (req, res) => {
  try {
    const { logId } = req.params;
    const { repairDate } = req.body;

    if (!repairDate) {
      return res.status(400).json({ error: 'تاريخ الإصلاح والجاهزية مطلوب' });
    }

    // أ) تحديث سجل العطل وإغلاقه
    const updatedLog = await db
      .update(maintenanceLogs)
      .set({
        repairDate: new Date(repairDate),
        status: 'repaired',
      })
      .where(eq(maintenanceLogs.id, Number(logId)))
      .returning();

    if (updatedLog.length === 0) {
      return res.status(404).json({ error: 'سجل العطل غير موجود' });
    }

    // ب) إعادة حالة المعدة المرتبطة لتصبح جاهزة (available) تلقائياً
    await db
      .update(equipment)
      .set({ status: 'available' })
      .where(eq(equipment.id, updatedLog[0].equipmentId));

    return res.status(200).json({ success: true, log: updatedLog[0] });
  } catch (error) {
    console.error('Error closing maintenance log:', error);
    return res.status(500).json({ error: 'حدث خطأ أثناء إغلاق بلاغ الصيانة' });
  }
});

// 3. جلب التاريخ الصيانة الكامل لآلية معينة (يظهر داخل بروفايل المعدة)
// GET /api/maintenance/history/:equipmentId
router.get('/history/:equipmentId', async (req, res) => {
  try {
    const { equipmentId } = req.params;

    const history = await db
      .select()
      .from(maintenanceLogs)
      .where(eq(maintenanceLogs.equipmentId, Number(equipmentId)))
      .orderBy(desc(maintenanceLogs.breakdownDate));

    return res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching maintenance history:', error);
    return res.status(500).json({ error: 'فشل في جلب سجلات صيانة المعدة' });
  }
});

// 4. جلب تقرير شامل وموحد لجميع الأعطال لصفحة التقارير الفنية
// GET /api/maintenance/reports/all
router.get('/reports/all', async (req, res) => {
  try {
    const records = await db
      .select({
        id: maintenanceLogs.id,
        equipmentId: maintenanceLogs.equipmentId,
        equipmentCode: equipment.code,
        equipmentName: equipment.name,
        equipmentType: equipment.type,
        serialNumber: equipment.serialNumber,
        plateNumber: equipment.plateNumber,
        breakdownDate: maintenanceLogs.breakdownDate,
        repairDate: maintenanceLogs.repairDate,
        details: maintenanceLogs.details,
        projectNameSnapshot: maintenanceLogs.projectNameSnapshot,
      })
      .from(maintenanceLogs)
      .innerJoin(equipment, eq(maintenanceLogs.equipmentId, equipment.id))
      .orderBy(desc(maintenanceLogs.breakdownDate));

    return res.status(200).json(records);
  } catch (error) {
    console.error('Error fetching comprehensive report data:', error);
    return res.status(500).json({ error: 'فشل في توليد بيانات التقارير الموحدة' });
  }
});

// 5. تعديل شامل لبيانات سجل عطل/صيانة معين لتصحيح الأخطاء البشرية
// PUT /api/maintenance/logs/:logId
router.put('/logs/:logId', async (req, res) => {
  try {
    const { logId } = req.params;
    const { breakdownDate, repairDate, details } = req.body;

    if (!breakdownDate) {
      return res.status(400).json({ error: 'تاريخ العطل حقل إجبارى لتحديث السجل' });
    }

    const updateData: any = {
      breakdownDate: new Date(breakdownDate),
      details: details ? details.trim() : null,
    };

    if (repairDate) {
      updateData.repairDate = new Date(repairDate);
      updateData.status = 'repaired'; 
    } else {
      updateData.repairDate = null;
      updateData.status = 'broken'; 
    }

    const updatedRecord = await db
      .update(maintenanceLogs)
      .set(updateData)
      .where(eq(maintenanceLogs.id, Number(logId)))
      .returning();

    if (updatedRecord.length === 0) {
      return res.status(404).json({ error: 'سجل الصيانة المطلوب غير موجود بالنظام' });
    }

    await db
      .update(equipment)
      .set({ status: updateData.status })
      .where(eq(equipment.id, updatedRecord[0].equipmentId));

    return res.status(200).json({ success: true, log: updatedRecord[0] });
  } catch (error) {
    console.error('Error updating maintenance log:', error);
    return res.status(500).json({ error: 'حدث خطأ داخلي أثناء تعديل سجل الصيانة' });
  }
});

// 🤖 6. مسار استقبال محادثات المستشار الذكي لشركة وادي دفا (باستخدام المكاملة المباشرة والمضمونة)
// POST /api/maintenance/ai-chat
router.post('/ai-chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'الرسالة فارغة' });
    }

    // أ) جلب لقطة حية وفورية من قاعدة البيانات لأسطول شركة وادي دفا
    const fleetData = await db.select({ code: equipment.code, name: equipment.name, status: equipment.status, type: equipment.type }).from(equipment);
    const logsData = await db.select({ code: equipment.code, name: equipment.name, breakdown: maintenanceLogs.breakdownDate, repair: maintenanceLogs.repairDate, details: maintenanceLogs.details, project: maintenanceLogs.projectNameSnapshot }).from(maintenanceLogs).innerJoin(equipment, eq(maintenanceLogs.equipmentId, equipment.id));

    // ب) إعداد التعليمات الصارمة والبيانات الحية المدمجة
    const systemInstruction = `
      أنت "المستشار الفني الذكي" الرسمي لنظام صيانة المعدات والمركبات في (شركة وادي دفا للمقاولات).
      مهمتك الصارمة والمحددة هي الإجابة على أسئلة مسؤول الصيانة ومساعدته في حصر وتحليل الأعطال بناءً على البيانات الحية المرفقة أدناه فقط.

      قواعد التعامل والنطاق الجوهري (Strict Scope):
      1. خاطب المستخدم دائماً بلقب هندسي محترم وجاد: "يا هندسة".
      2. أسلوبك يجب أن يكون مهنياً، ومباشراً جداً، مدعماً بالأرقام والإحصائيات، دون لف أو دوران أو مقدمات إنشائية غير مفيدة.
      3. موضوع الفنيين وتوزيع العمال والورش الخارجية خارج تماماً عن صلاحيات نظامنا؛ إذا سألك عنها نبهه بلطف أن النظام محصور في حصر الآليات والتقارير الفنية والمالية للأعطال.

      البيانات الحية الفورية من قاعدة البيانات حالياً:
      - الأسطول الميداني الحالي (المعدات والمركبات): ${JSON.stringify(fleetData)}
      - سجل بلاغات الأعطال والصيانة التاريخي بالكامل: ${JSON.stringify(logsData)}
    `;

    // 🎯 ج) الربط الفوري والمباشر مع خوادم جوجل لضمان تخطي مشاكل الحزم القديمة على Render
    const apiKey = process.env.GEMINI_API_KEY || '';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemInstruction}\n\nUser Question: ${message}` }]
        }]
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error('Google API Direct Error:', errData);
      throw new Error('فشل السيرفر في التواصل المباشر مع بوابة الذكاء الاصطناعي.');
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "لم أتمكن من استخراج الإجابة الفنية، يرجى المحاولة مرة أخرى.";

    return res.json({
      success: true,
      reply: replyText,
    });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'عذراً يا هندسة، فشل سيرفر الذكاء الاصطناعي في معالجة وتحليل البيانات الحالية بسبب خطأ داخلي.',
    });
  }
});

export default router;
