import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(requireAuth);

async function projectBelongsToUser(projectId: string, userId: string) {
  return prisma.project.findFirst({ where: { id: projectId, userId } });
}

router.get('/', async (req: AuthRequest, res: Response) => {
  const project = await projectBelongsToUser(req.params.projectId, req.userId!);
  if (!project) return res.status(404).json({ error: 'Not found' });
  const lists = await prisma.taskList.findMany({
    where: { projectId: req.params.projectId },
    orderBy: { position: 'asc' },
    include: { tasks: { orderBy: { position: 'asc' } } },
  });
  res.json(lists);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const project = await projectBelongsToUser(req.params.projectId, req.userId!);
  if (!project) return res.status(404).json({ error: 'Not found' });
  const count = await prisma.taskList.count({ where: { projectId: req.params.projectId } });
  const list = await prisma.taskList.create({
    data: { name: req.body.name, position: count, projectId: req.params.projectId },
  });
  res.status(201).json(list);
});

router.patch('/:listId', async (req: AuthRequest, res: Response) => {
  const project = await projectBelongsToUser(req.params.projectId, req.userId!);
  if (!project) return res.status(404).json({ error: 'Not found' });
  const list = await prisma.taskList.updateMany({
    where: { id: req.params.listId, projectId: req.params.projectId },
    data: { name: req.body.name, position: req.body.position },
  });
  if (!list.count) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

router.delete('/:listId', async (req: AuthRequest, res: Response) => {
  const project = await projectBelongsToUser(req.params.projectId, req.userId!);
  if (!project) return res.status(404).json({ error: 'Not found' });
  await prisma.taskList.deleteMany({ where: { id: req.params.listId, projectId: req.params.projectId } });
  res.json({ ok: true });
});

export default router;
