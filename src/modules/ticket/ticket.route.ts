import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as TicketControllers from './ticket.controller';
import * as TicketValidations from './ticket.validator';

const router = express.Router();

router.get('/', auth('admin', 'editor'), TicketControllers.getTickets);

router.post(
  '/',
  auth('admin', 'editor'),
  validation(TicketValidations.createTicketSchema),
  TicketControllers.createTicket,
);

router.get(
  '/:id',
  auth('admin', 'editor'),
  validation(TicketValidations.ticketIdSchema),
  TicketControllers.getTicket,
);

router.patch(
  '/:id',
  auth('admin', 'editor'),
  validation(TicketValidations.updateTicketSchema),
  TicketControllers.updateTicket,
);

router.delete(
  '/:id',
  auth('admin', 'editor'),
  validation(TicketValidations.ticketIdSchema),
  TicketControllers.deleteTicket,
);

const ticketRoutes = router;
export default ticketRoutes;
