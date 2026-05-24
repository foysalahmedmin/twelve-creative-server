import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as ServiceControllers from './service.controller';
import * as ServiceValidations from './service.validator';

const router = express.Router();

router.get('/public', ServiceControllers.getPublicServices);

router.get('/', auth('admin', 'editor'), ServiceControllers.getServices);

router.get(
  '/:id',
  auth('admin', 'editor'),
  validation(ServiceValidations.serviceIdSchema),
  ServiceControllers.getService,
);

router.post(
  '/',
  auth('admin', 'editor'),
  validation(ServiceValidations.createServiceValidationSchema),
  ServiceControllers.createService,
);

router.post(
  '/reorder',
  auth('admin', 'editor'),
  validation(ServiceValidations.reorderServicesValidationSchema),
  ServiceControllers.reorderServices,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(ServiceValidations.serviceIdSchema),
  ServiceControllers.restoreService,
);

router.patch(
  '/:id',
  auth('admin', 'editor'),
  validation(ServiceValidations.updateServiceValidationSchema),
  ServiceControllers.updateService,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(ServiceValidations.serviceIdSchema),
  ServiceControllers.deleteServicePermanent,
);

router.delete(
  '/:id',
  auth('admin', 'editor'),
  validation(ServiceValidations.serviceIdSchema),
  ServiceControllers.deleteService,
);

const serviceRoutes = router;
export default serviceRoutes;
