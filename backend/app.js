import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 4000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

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

app.use('/api/', routes);

app.use(express.static(path.join(__dirname, 'public')));

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
