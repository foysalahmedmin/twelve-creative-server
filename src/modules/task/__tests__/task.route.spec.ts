import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

jest.mock('../task.service');
jest.mock('../../../middlewares/auth.middleware', () =>
  jest.fn(
    () =>
      (
        req: express.Request,
        _res: express.Response,
        next: express.NextFunction,
      ) => {
        req.user = {
          _id: '507f1f77bcf86cd799439099',
          role: 'admin',
          name: 'Admin',
          email: 'admin@twelvecreative.co',
        };
        next();
      },
  ),
);
jest.mock('../../../middlewares/validation.middleware', () =>
  jest.fn(
    () =>
      (
        _req: express.Request,
        _res: express.Response,
        next: express.NextFunction,
      ) =>
        next(),
  ),
);

import taskRoutes from '../task.route';
import * as TaskService from '../task.service';

const app = express();
app.use(express.json());
app.use('/api/task', taskRoutes);
app.use(
  (
    error: { status?: number; message?: string },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    res
      .status(error.status ?? 500)
      .json({ success: false, message: error.message });
  },
);
const request = supertest(app);

const id = '507f1f77bcf86cd799439011';
const task = {
  _id: id,
  title: 'Prepare treatment',
  priority: 'high',
  status: 'todo',
};

describe('Task routes', () => {
  it('GET / returns paginated tasks and forwards query parameters', async () => {
    (TaskService.getTasks as jest.Mock).mockResolvedValue({
      data: [task],
      meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
    });

    const response = await request.get('/api/task?status=todo&page=1');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([task]);
    expect(response.body.meta.total).toBe(1);
    expect(TaskService.getTasks).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'todo', page: '1' }),
    );
  });

  it('POST / creates a task with the authenticated user email', async () => {
    (TaskService.createTask as jest.Mock).mockResolvedValue(task);

    const response = await request.post('/api/task').send({
      title: task.title,
      priority: task.priority,
      status: task.status,
    });

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body.data).toEqual(task);
    expect(TaskService.createTask).toHaveBeenCalledWith({
      title: task.title,
      priority: task.priority,
      status: task.status,
      created_by: 'admin@twelvecreative.co',
    });
  });

  it('GET /:id returns one task', async () => {
    (TaskService.getTask as jest.Mock).mockResolvedValue(task);

    const response = await request.get(`/api/task/${id}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(task);
    expect(TaskService.getTask).toHaveBeenCalledWith(id);
  });

  it('PATCH /:id updates one task', async () => {
    const updated = { ...task, status: 'done' };
    (TaskService.updateTask as jest.Mock).mockResolvedValue(updated);

    const response = await request
      .patch(`/api/task/${id}`)
      .send({ status: 'done' });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data.status).toBe('done');
    expect(TaskService.updateTask).toHaveBeenCalledWith(id, { status: 'done' });
  });

  it('DELETE /:id deletes one task', async () => {
    (TaskService.deleteTask as jest.Mock).mockResolvedValue(undefined);

    const response = await request.delete(`/api/task/${id}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(TaskService.deleteTask).toHaveBeenCalledWith(id);
  });

  it('returns a service error through the route error handler', async () => {
    (TaskService.getTask as jest.Mock).mockRejectedValue({
      status: httpStatus.NOT_FOUND,
      message: 'Task not found',
    });

    const response = await request.get(`/api/task/${id}`);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Task not found',
    });
  });
});
