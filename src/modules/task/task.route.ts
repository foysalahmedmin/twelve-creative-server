import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as TaskControllers from './task.controller';
import * as TaskValidations from './task.validator';

const router = express.Router();

router.get('/', auth('admin', 'editor'), TaskControllers.getTasks);

router.post(
  '/',
  auth('admin', 'editor'),
  validation(TaskValidations.createTaskSchema),
  TaskControllers.createTask,
);

router.get(
  '/:id',
  auth('admin', 'editor'),
  validation(TaskValidations.taskIdSchema),
  TaskControllers.getTask,
);

router.patch(
  '/:id',
  auth('admin', 'editor'),
  validation(TaskValidations.updateTaskSchema),
  TaskControllers.updateTask,
);

router.delete(
  '/:id',
  auth('admin', 'editor'),
  validation(TaskValidations.taskIdSchema),
  TaskControllers.deleteTask,
);

const taskRoutes = router;
export default taskRoutes;
