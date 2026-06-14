import { Router } from 'express';
import { db } from '../db';
import { maintenanceLogs, maintenanceItems, equipment } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// 1. إضافة قائمة المشتريات والقطع (إدخال متعدد ديناميكي) لعطل معين
// POST /api/purchases
router.post('/', async (req, res) => {
  try {
    const { maintenanceLogId, items } = req.body; 
    // المتوقع في الـ items هو مصفوفة كالتالي: [{ itemName: "لديتر جديد", price: 1500 }, { itemName: "خراطيم", price: 200 }]

    if (!maintenanceLogId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'معرف العطل وقائمة البنود المشتراة مطلوبة' });
    }

    // تجهيز البيانات مسبقاً للإدخال الجماعي لسرعة الأداء لسلامة البيانات
    const insertData = items.map((item: any) => ({
      maintenanceLogId: Number(maintenanceLogId),
      itemName: item.itemName.trim(),
      price: Number(item.price),
    }));

    // حفظ جميع البنود في جدول المشتريات بدفعة واحدة
    const newItems = await db.insert(maintenanceItems).values(insertData).returning();

    return res.status(201).json({ success: true, items: newItems });
  } catch (error) {
    console.error('Error saving purchases:', error);
    return res.status(500).json({ error: 'حدث خطأ أثناء حفظ قائمة المشتريات' });
  }
});

// 2. جلب التقارير المشتريات المالية بالكامل (لتغذية التبويب المالي والبحث)
// GET /api/purchases
router.get('/', async (req, res) => {
  try {
    // جلب البيانات مدمجة من الثلاثة جداول (الأعطال، الآليات، والمشتريات)
    const financialRows = await db
      .select({
        logId: maintenanceLogs.id,
        projectName: maintenanceLogs.projectNameSnapshot,
        breakdownDate: maintenanceLogs.breakdownDate,
        repairDate: maintenanceLogs.repairDate,
        equipmentName: equipment.name,
        equipmentCode: equipment.code,
        equipmentType: equipment.type,
        serialNumber: equipment.serialNumber,
        plateNumber: equipment.plateNumber,
        itemId: maintenanceItems.id,
        itemName: maintenanceItems.itemName,
        price: maintenanceItems.price,
      })
      .from(maintenanceLogs)
      .innerJoin(equipment, eq(maintenanceLogs.equipmentId, equipment.id))
      .innerJoin(maintenanceItems, eq(maintenanceItems.maintenanceLogId, maintenanceLogs.id));

    // [منطق ذكي] تجميع البيانات في السيرفر لكي يظهر كل عطل وبداخله مصفوفة القطع الخاصة به مع الإجمالي
    const financialReports: Record<number, any> = {};

    financialRows.forEach((row) => {
      if (!financialReports[row.logId]) {
        financialReports[row.logId] = {
          logId: row.logId,
          projectName: row.projectName,
          breakdownDate: row.breakdownDate,
          repairDate: row.repairDate,
          equipmentName: row.equipmentName,
          equipmentCode: row.equipmentCode,
          equipmentType: row.equipmentType,
          serialNumber: row.serialNumber,
          plateNumber: row.plateNumber,
          items: [], // مصفوفة القطع التفصيلية
          totalCost: 0, // حساب الإجمالي التلقائي للعطل لمنع الأخطاء
        };
      }

      // إضافة القطعة الحالية لمصفوفة القطع التابعة لهذا العطل
      financialReports[row.logId].items.push({
        id: row.itemId,
        name: row.itemName,
        price: row.price,
      });

      // زيادة السعر على التكلفة الإجمالية للعطل الحالي
      financialReports[row.logId].totalCost += row.price;
    });

    // تحويل الكائن إلى مصفوفة (Array) لكي يفهمها الـ Frontend مباشرة ويعرضها في الجدول
    return res.status(200).json(Object.values(financialReports));
  } catch (error) {
    console.error('Error fetching financial reports:', error);
    return res.status(500).json({ error: 'فشل في توليد التقارير المالية والمشتريات' });
  }
});

export default router;
