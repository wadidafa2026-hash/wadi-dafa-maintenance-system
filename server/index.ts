import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import projectRouter from './routes/projects.js';
import purchasesRouter from './routes/purchases.js'; 

// استيراد الـ Routes الخاصة بالصيانة والآليات والصلاحيات
import equipmentRouter from './routes/equipment.js';
import maintenanceRouter from './routes/maintenance.js';
import authRouter from './routes/auth.js';

const app = express();

// تشغيل الـ Middleware الأساسية
app.use(cors()); 
app.use(express.json()); 

// ربط وتفعيل الـ Routes مع روابط الـ API الرئيسية
app.use('/api/equipment', equipmentRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/auth', authRouter);
app.use('/api/projects', projectRouter);
app.use('/api/purchases', purchasesRouter); 

// رابط تجريبي سريع للتأكد من أن السيرفر شغال وزي الورد
app.get('/', (req, res) => {
  res.send('🚀 سيرفر صيانة آليات وادي دفا يعمل بنجاح ومية مية!');
});

// تحديد المنفذ (Port) اللي حيقعد السيرفر يتسمع فيه
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`🤖 Wadi Dafa Server is running on port ${PORT}`);
  console.log(`=============================================`);
});
