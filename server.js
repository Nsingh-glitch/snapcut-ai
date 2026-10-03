import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { processImage, ProcessingError } from './server/remove-bg.js';
import { getAuthenticatedUser } from './server/auth.js';
import { createOrderHandler, paymentStatusHandler } from './server/payment.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = express();
  const port = process.env.PORT || 8080;

  // Body parsing middleware
  app.use(express.json());
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  // Simple logger for all requests
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // API Routes (Directly on app for maximum visibility)
  app.get('/api/test', (req, res) => {
    console.log('--- API Test Route Hit ---');
    res.json({ message: 'API is working!' });
  });

  app.post('/api/remove-bg', (req, res, next) => {
    upload.single('image')(req, res, (uploadError) => {
      if (uploadError) {
        const statusCode = uploadError.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        return res.status(statusCode).json({
          success: false,
          error: uploadError.code === 'LIMIT_FILE_SIZE' ? 'File too large. Max 10MB.' : 'Invalid image upload.',
        });
      }
      next();
    });
  }, async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      const result = await processImage(req.file, user.id);
      res.json({ success: true, ...result });
    } catch (error) {
      const statusCode = error instanceof ProcessingError || error.statusCode ? error.statusCode : 500;
      res.status(statusCode).json({
        success: false,
        error: error instanceof ProcessingError || error.statusCode ? error.message : 'Failed to process image.',
        ...(error.code ? { code: error.code } : {}),
      });
    }
  });

  app.post('/api/create-order', createOrderHandler);
  app.get('/api/payment-status', paymentStatusHandler);

  // Vite middleware in dev mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(port, () => {
    console.log(`\n  🚀 SnapCut AI combined server running at http://localhost:${port}`);
    console.log(`  🔗 App: http://localhost:${port}`);
    console.log(`  🔌 APIs: http://localhost:${port}/api/create-order\n`);
  });
}

createServer();
