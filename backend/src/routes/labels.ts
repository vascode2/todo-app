import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response) => {
  const labels = await prisma.label.findMany({
    where: { project: { id: req.params.projectId, userId: req.userId } },
  });
  res.json(labels);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const project = await prisma.project.findFirst({ where: { id: req.params.projectId, userId: req.userId } });
  if (!project) return res.status(404).json({ error: 'Not found' });
  const label = await prisma.label.create({
    data: { name: req.body.name, color: req.body.color, projectId: req.params.projectId },
  });
  res.status(201).json(label);
});

router.patch('/:labelId', async (req: AuthRequest, res: Response) => {
  const label = await prisma.label.findFirst({
    where: { id: req.params.labelId, project: { userId: req.userId } },
  });
  if (!label) return res.status(404).json({ error: 'Not found' });
  const updated = await prisma.label.update({
    where: { id: req.params.labelId },
    data: { name: req.body.name, color: req.body.color },
  });
  res.json(updated);
});

router.delete('/:labelId', async (req: AuthRequest, res: Response) => {
  const label = await prisma.label.findFirst({
    where: { id: req.params.labelId, project: { userId: req.userId } },
  });
  if (!label) return res.status(404).json({ error: 'Not found' });
  await prisma.label.delete({ where: { id: req.params.labelId } });
  res.json({ ok: true });
});

export default router;
