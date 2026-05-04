import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(requireAuth);

async function taskBelongsToUser(taskId: string, userId: string) {
  return prisma.task.findFirst({
    where: { id: taskId, list: { project: { userId } } },
  });
}

router.get('/', async (req: AuthRequest, res: Response) => {
  const { search, priority, labelId, completed } = req.query;
  const tasks = await prisma.task.findMany({
    where: {
      list: { project: { userId: req.userId } },
      ...(search ? { title: { contains: search as string, mode: 'insensitive' } } : {}),
      ...(priority ? { priority: priority as any } : {}),
      ...(labelId ? { labels: { some: { id: labelId as string } } } : {}),
      ...(completed !== undefined ? { completed: completed === 'true' } : {}),
    },
    orderBy: { position: 'asc' },
    include: { labels: true, subtasks: { orderBy: { position: 'asc' } }, _count: { select: { comments: true } } },
  });
  res.json(tasks);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { title, description, priority, dueDate, listId, labelIds } = req.body;
  const count = await prisma.task.count({ where: { listId } });
  const task = await prisma.task.create({
    data: {
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      position: count,
      listId,
      ...(labelIds?.length ? { labels: { connect: labelIds.map((id: string) => ({ id })) } } : {}),
    },
    include: { labels: true, subtasks: true, _count: { select: { comments: true } } },
  });
  res.status(201).json(task);
});

router.get('/:taskId', async (req: AuthRequest, res: Response) => {
  const task = await prisma.task.findFirst({
    where: { id: req.params.taskId, list: { project: { userId: req.userId } } },
    include: {
      labels: true,
      subtasks: { orderBy: { position: 'asc' } },
      comments: { orderBy: { createdAt: 'asc' } },
      list: { include: { project: true } },
    },
  });
  if (!task) return res.status(404).json({ error: 'Not found' });
  res.json(task);
});

router.patch('/:taskId', async (req: AuthRequest, res: Response) => {
  const existing = await taskBelongsToUser(req.params.taskId, req.userId!);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const { title, description, priority, dueDate, completed, position, listId, labelIds } = req.body;
  const task = await prisma.task.update({
    where: { id: req.params.taskId },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      ...(completed !== undefined ? { completed } : {}),
      ...(position !== undefined ? { position } : {}),
      ...(listId !== undefined ? { listId } : {}),
      ...(labelIds !== undefined ? { labels: { set: labelIds.map((id: string) => ({ id })) } } : {}),
    },
    include: { labels: true, subtasks: { orderBy: { position: 'asc' } }, _count: { select: { comments: true } } },
  });
  res.json(task);
});

router.delete('/:taskId', async (req: AuthRequest, res: Response) => {
  const existing = await taskBelongsToUser(req.params.taskId, req.userId!);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  await prisma.task.delete({ where: { id: req.params.taskId } });
  res.json({ ok: true });
});

router.patch('/:taskId/subtasks/:subtaskId', async (req: AuthRequest, res: Response) => {
  const existing = await taskBelongsToUser(req.params.taskId, req.userId!);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const subtask = await prisma.subtask.update({
    where: { id: req.params.subtaskId },
    data: { completed: req.body.completed, title: req.body.title },
  });
  res.json(subtask);
});

router.post('/:taskId/subtasks', async (req: AuthRequest, res: Response) => {
  const existing = await taskBelongsToUser(req.params.taskId, req.userId!);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const count = await prisma.subtask.count({ where: { taskId: req.params.taskId } });
  const subtask = await prisma.subtask.create({
    data: { title: req.body.title, taskId: req.params.taskId, position: count },
  });
  res.status(201).json(subtask);
});

router.delete('/:taskId/subtasks/:subtaskId', async (req: AuthRequest, res: Response) => {
  const existing = await taskBelongsToUser(req.params.taskId, req.userId!);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  await prisma.subtask.delete({ where: { id: req.params.subtaskId } });
  res.json({ ok: true });
});

router.post('/:taskId/comments', async (req: AuthRequest, res: Response) => {
  const existing = await taskBelongsToUser(req.params.taskId, req.userId!);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const comment = await prisma.comment.create({
    data: { body: req.body.body, taskId: req.params.taskId },
  });
  res.status(201).json(comment);
});

router.delete('/:taskId/comments/:commentId', async (req: AuthRequest, res: Response) => {
  const existing = await taskBelongsToUser(req.params.taskId, req.userId!);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  await prisma.comment.deleteMany({ where: { id: req.params.commentId, taskId: req.params.taskId } });
  res.json({ ok: true });
});

export default router;
