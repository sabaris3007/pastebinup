import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import pastesRouter from './routes/pastes';
import authRouter from './routes/auth';
import { errorHandler } from './middleware/errorHandler';
import { cleanupExpiredPastes } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Periodic cleanup of expired pastes every 15 minutes
const cleanupInterval = setInterval(() => {
  try {
    const deleted = cleanupExpiredPastes();
    if (deleted > 0) {
      console.log(`Cleaned up ${deleted} expired paste(s).`);
    }
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}, 15 * 60 * 1000);
cleanupInterval.unref();

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/pastes', pastesRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve client static files in production
const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientBuildPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('Server is running. Client frontend build not found.');
    }
  });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export default app;
