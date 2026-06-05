import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import axios from 'axios';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-service:8000';
const JWT_SECRET = process.env.JWT_SECRET || 'fracarc-secret';

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }

  const token = authorization.replace('Bearer ', '');
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'gateway' });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const payload = {
    username,
    role: 'radiologist',
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
  return res.json({ token, role: 'radiologist' });
});

app.post('/api/upload', authMiddleware, async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/analysis/upload`, req.body, {
      headers: { 'Content-Type': 'application/json' },
    });
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Upload proxy error', error);
    return res.status(502).json({ error: 'AI service proxy failed' });
  }
});

app.post('/api/analysis/run', authMiddleware, async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/analysis/run`, req.body, {
      headers: { 'Content-Type': 'application/json' },
    });
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Analysis proxy error', error);
    return res.status(502).json({ error: 'AI service proxy failed' });
  }
});

app.post('/api/analysis/export', authMiddleware, async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/analysis/export`, req.body, {
      headers: { 'Content-Type': 'application/json' },
      responseType: 'arraybuffer',
    });
    res.status(response.status);
    res.setHeader('content-type', response.headers['content-type'] || 'application/octet-stream');
    if (response.headers['content-disposition']) {
      res.setHeader('content-disposition', response.headers['content-disposition']);
    }
    return res.send(response.data);
  } catch (error) {
    console.error('Export proxy error', error);
    return res.status(502).json({ error: 'AI service export proxy failed' });
  }
});

app.post('/api/pacs/fetch', authMiddleware, async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/pacs/fetch`, req.body, {
      headers: { 'Content-Type': 'application/json' },
    });
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('PACS proxy error', error);
    return res.status(502).json({ error: 'AI service PACS proxy failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`FRACTARC gateway listening on port ${PORT}`);
});
