import httpStatus from 'http-status';

jest.mock('../task.repository');

import * as TaskRepository from '../task.repository';
import * as TaskService from '../task.service';

const task = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Prepare project treatment',
  priority: 'high' as const,
  status: 'todo' as const,
};

describe('TaskService', () => {
  it('creates a task through the repository', async () => {
    (TaskRepository.create as jest.Mock).mockResolvedValue(task);

    await expect(TaskService.createTask(task)).resolves.toEqual(task);
    expect(TaskRepository.create).toHaveBeenCalledWith(task);
  });

  it('returns the repository paginated task result', async () => {
    const page = {
      data: [task],
      meta: { total: 1, page: 2, limit: 10, total_pages: 1 },
    };
    (TaskRepository.findAll as jest.Mock).mockResolvedValue(page);

    await expect(
      TaskService.getTasks({ page: 2, status: 'todo' }),
    ).resolves.toEqual(page);
    expect(TaskRepository.findAll).toHaveBeenCalledWith({
      page: 2,
      status: 'todo',
    });
  });

  it('returns a task by id', async () => {
    (TaskRepository.findByIdLean as jest.Mock).mockResolvedValue(task);

    await expect(TaskService.getTask(task._id)).resolves.toEqual(task);
    expect(TaskRepository.findByIdLean).toHaveBeenCalledWith(task._id);
  });

  it('throws 404 when a task is not found', async () => {
    (TaskRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(TaskService.getTask(task._id)).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Task not found',
    });
  });

  it('updates an existing task and returns a plain object', async () => {
    const updated = { ...task, status: 'done' as const };
    const toObject = jest.fn().mockReturnValue(updated);
    (TaskRepository.findByIdLean as jest.Mock).mockResolvedValue(task);
    (TaskRepository.updateById as jest.Mock).mockResolvedValue({ toObject });

    await expect(
      TaskService.updateTask(task._id, { status: 'done' }),
    ).resolves.toEqual(updated);
    expect(TaskRepository.updateById).toHaveBeenCalledWith(task._id, {
      status: 'done',
    });
    expect(toObject).toHaveBeenCalledWith();
  });

  it('does not update a missing task', async () => {
    (TaskRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      TaskService.updateTask(task._id, { status: 'done' }),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Task not found',
    });
    expect(TaskRepository.updateById).not.toHaveBeenCalled();
  });

  it('soft-deletes an existing task', async () => {
    (TaskRepository.findById as jest.Mock).mockResolvedValue(task);
    (TaskRepository.softDeleteById as jest.Mock).mockResolvedValue(undefined);

    await expect(TaskService.deleteTask(task._id)).resolves.toBeUndefined();
    expect(TaskRepository.softDeleteById).toHaveBeenCalledWith(task._id);
  });

  it('does not delete a missing task', async () => {
    (TaskRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(TaskService.deleteTask(task._id)).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Task not found',
    });
    expect(TaskRepository.softDeleteById).not.toHaveBeenCalled();
  });
});
