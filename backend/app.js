import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';

const app = express();
app.set('trust proxy', 1); // доверяем одному реверс-прокси (nginx/CF); в dev безвредно
const PORT = process.env.PORT || 4000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware для парсинга JSON и URL-encoded данных
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS для всех источников
app.use(cors());

/**
 * Health check endpoint для проверки работоспособности сервера
 * 
 * @route GET /health
 * @returns {Object} 200 - JSON объект со статусом сервера
 */
app.get('/health', (req, res) => {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };
  
  res.status(200).json(healthData);
});

// API маршруты
app.use('/api/', routes);

// Раздача пользовательских загрузок (превью закладок и др.)
app.use('/previews', express.static(path.join(__dirname, 'uploads/previews')));

// Раздача статических файлов из папки public
app.use(express.static(path.join(__dirname, 'public')));

// Fallback для SPA - отдает index.html для всех неизвестных маршрутов
app.use((req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).send('Internal Server Error');
    }
  });
});

app.listen(PORT, () => {
  console.log(`server is listening on port ${PORT}`);
});