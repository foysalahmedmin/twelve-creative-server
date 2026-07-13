/* eslint-disable no-console */
import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import { sendEmail } from '../../utils/send-email';
import config from '../../config/env';
import * as BookingRepository from './booking.repository';
import { TBooking } from './booking.type';
import { createSystemNotification } from '../../utils/create-system-notification';

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const buildNotificationHtml = (booking: TBooking): string => {
  const row = (label: string, value?: string) =>
    value
      ? `<tr><td style="padding:4px 8px;color:#666"><strong>${label}</strong></td><td style="padding:4px 8px">${escapeHtml(value)}</td></tr>`
      : '';
  const date = booking.preferred_date
    ? new Date(booking.preferred_date).toDateString()
    : undefined;
  return `
    <div style="font-family:system-ui,sans-serif">
      <h2>New booking request</h2>
      <table style="border-collapse:collapse;font-size:14px">
        ${row('Name', booking.name)}
        ${row('Email', booking.email)}
        ${row('Phone', booking.phone)}
        ${row('Company', booking.company)}
        ${row('Industry', booking.industry)}
        ${row('Timeline', booking.timeline)}
        ${row('Preferred date', date)}
        ${row('Preferred time', booking.preferred_time)}
        ${row('Message', booking.message)}
      </table>
    </div>`;
};

const fireAndForgetEmail = (booking: TBooking) => {
  const to = config.smtp_email || config.email;
  if (!to) return;
  void (async () => {
    try {
      await sendEmail({
        to,
        subject: `New booking from ${booking.name}`,
        text: `New booking from ${booking.name} <${booking.email}>`,
        html: buildNotificationHtml(booking),
      });
    } catch (err) {
      console.warn('Booking notification email failed:', err);
    }
  })();
};

export const createBooking = async (
  data: Partial<TBooking>,
): Promise<TBooking> => {
  const booking = await BookingRepository.create({
    ...data,
    status: 'pending',
    source: 'booking_form',
  });
  fireAndForgetEmail(booking);
  createSystemNotification({
    title: `New booking from ${booking.name}`,
    message: booking.company
      ? `${booking.company} — ${booking.email}`
      : booking.email,
    type: 'booking',
    metadata: { url: '/admin/bookings' },
  });
  return booking;
};

export const getBookings = async (
  query: Record<string, unknown>,
): Promise<{
  data: TBooking[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  return await BookingRepository.findAdminPaginated(query);
};

export const getBooking = async (id: string): Promise<TBooking> => {
  const result = await BookingRepository.findByIdLean(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  return result;
};

export const updateBooking = async (
  id: string,
  payload: Partial<TBooking>,
): Promise<TBooking> => {
  const exists = await BookingRepository.findByIdLean(id);
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  const result = await BookingRepository.updateById(id, payload);
  return result!;
};

export const deleteBooking = async (id: string): Promise<void> => {
  const booking = await BookingRepository.findById(id);
  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  await booking.softDelete();
};

export const deleteBookingPermanent = async (id: string): Promise<void> => {
  // Permanent delete must find already soft-deleted bookings too, so bypass
  // the soft-delete filter for the existence check.
  const exists = await BookingRepository.findByIdWithDeleted(id);
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  await BookingRepository.hardDeleteById(id);
};

export const getPendingCount = async (): Promise<number> => {
  return await BookingRepository.countPending();
};
