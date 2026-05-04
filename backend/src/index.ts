import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import listRoutes from './routes/lists';
import taskRoutes from './routes/tasks';
import labelRoutes from './routes/labels';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/lists', listRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects/:projectId/labels', labelRoutes);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
