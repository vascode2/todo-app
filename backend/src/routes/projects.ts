import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response) => {
  const projects = await prisma.project.findMany({
    where: { userId: req.userId },
    orderBy: { position: 'asc' },
    include: { lists: { orderBy: { position: 'asc' }, include: { tasks: { orderBy: { position: 'asc' } } } }, labels: true },
  });
  res.json(projects);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, description, color } = req.body;
  const count = await prisma.project.count({ where: { userId: req.userId } });
  const project = await prisma.project.create({
    data: { name, description, color, position: count, userId: req.userId! },
    include: { lists: true, labels: true },
  });
  res.status(201).json(project);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: {
      lists: {
        orderBy: { position: 'asc' },
        include: {
          tasks: {
            orderBy: { position: 'asc' },
            include: { labels: true, subtasks: { orderBy: { position: 'asc' } }, _count: { select: { comments: true } } },
          },
        },
      },
      labels: true,
    },
  });
  if (!project) return res.status(404).json({ error: 'Not found' });
  res.json(project);
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const { name, description, color, position } = req.body;
  const project = await prisma.project.updateMany({
    where: { id: req.params.id, userId: req.userId },
    data: { name, description, color, position },
  });
  if (!project.count) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await prisma.project.deleteMany({ where: { id: req.params.id, userId: req.userId } });
  res.json({ ok: true });
});

export default router;
