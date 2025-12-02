import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import os from 'os';
import { sequelize } from './config/database';
import './models'; // Import models to register associations
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import contactRoutes from './routes/contacts';
import companyRoutes from './routes/companies';
import dealRoutes from './routes/deals';
import taskRoutes from './routes/tasks';
import ticketRoutes from './routes/tickets';
import subscriptionRoutes from './routes/subscriptions';
import paymentRoutes from './routes/payments';
import activityRoutes from './routes/activities';
import campaignRoutes from './routes/campaigns';
import dashboardRoutes from './routes/dashboard';
import automationRoutes from './routes/automations';
import emailRoutes from './routes/emails';
import googleRoutes from './routes/calendar';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Función para obtener la IP local
const getLocalIP = (): string => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const nets = interfaces[name];
    if (nets) {
      for (const net of nets) {
        // Ignorar direcciones IPv6 y direcciones internas (no enlazadas)
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }
  return 'localhost';
};

// Middleware CORS - Permitir todas las conexiones desde la red
app.use(cors({
  origin: true, // Permitir cualquier origen (localhost, IPs locales, etc.)
  credentials: true, // Permitir cookies y credenciales
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging para debug de conexiones
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} from ${req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/google', googleRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CRM API is running' });
});

// Initialize database and start server
sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    const localIP = getLocalIP();
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n========================================');
      console.log(`✅ Servidor iniciado correctamente`);
      console.log(`📍 Puerto: ${PORT}`);
      console.log(`\n🌐 Acceso desde otros dispositivos en la red:`);
      console.log(`   http://${localIP}:${PORT}/api`);
      console.log(`\n💻 Acceso local:`);
      console.log(`   http://localhost:${PORT}/api`);
      console.log(`   http://127.0.0.1:${PORT}/api`);
      console.log(`\n📱 Frontend debe acceder desde:`);
      console.log(`   http://${localIP}:3000`);
      console.log(`========================================\n`);
    });
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });

export default app;

