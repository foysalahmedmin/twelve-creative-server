import express from 'express';
import auth from '../../middlewares/auth.middleware';
import * as SystemLogControllers from './system-log.controller';

const router = express.Router();

router.get('/', auth('admin'), SystemLogControllers.getLogs);

const systemLogRoutes = router;
export default systemLogRoutes;
