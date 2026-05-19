/* eslint-disable no-console */
import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import { sendEmail } from '../../utils/send-email';
import config from '../../config/env';
import * as ContactMessageRepository from './contact-message.repository';
import { TContactMessage } from './contact-message.type';

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const buildNotificationHtml = (msg: TContactMessage): string => {
  const row = (label: string, value?: string) =>
    value
      ? `<tr><td style="padding:4px 8px;color:#666"><strong>${label}</strong></td><td style="padding:4px 8px">${escapeHtml(value)}</td></tr>`
      : '';
  return `
    <div style="font-family:system-ui,sans-serif">
      <h2>New contact message</h2>
      <table style="border-collapse:collapse;font-size:14px">
        ${row('Name', msg.name)}
        ${row('Email', msg.email)}
        ${row('Phone', msg.phone)}
        ${row('Subject', msg.subject)}
      </table>
      <h3 style="margin-top:16px">Message</h3>
      <div style="white-space:pre-wrap;padding:12px;background:#f7f7f7;border-radius:6px;font-size:14px">${escapeHtml(msg.message)}</div>
    </div>`;
};

const fireAndForgetEmail = (msg: TContactMessage) => {
  const to = config.smtp_email || config.email;
  if (!to) return;
  void (async () => {
    try {
      await sendEmail({
        to,
        subject: `Contact: ${msg.subject || msg.name}`,
        text: `From ${msg.name} <${msg.email}>: ${msg.message}`,
        html: buildNotificationHtml(msg),
      });
    } catch (err) {
      console.warn('Contact message email failed:', err);
    }
  })();
};

export const createContactMessage = async (
  data: Partial<TContactMessage>,
): Promise<TContactMessage> => {
  const msg = await ContactMessageRepository.create({
    ...data,
    is_read: false,
    is_archived: false,
  });
  fireAndForgetEmail(msg);
  return msg;
};

export const getContactMessages = async (
  query: Record<string, unknown>,
): Promise<{
  data: TContactMessage[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  return await ContactMessageRepository.findAdminPaginated(query);
};

export const getContactMessage = async (
  id: string,
): Promise<TContactMessage> => {
  const result = await ContactMessageRepository.findByIdLean(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Message not found');
  }
  return result;
};

export const updateContactMessage = async (
  id: string,
  payload: Partial<TContactMessage>,
): Promise<TContactMessage> => {
  const exists = await ContactMessageRepository.findByIdLean(id);
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Message not found');
  }
  const result = await ContactMessageRepository.updateById(id, payload);
  return result!;
};

export const deleteContactMessage = async (id: string): Promise<void> => {
  const msg = await ContactMessageRepository.findById(id);
  if (!msg) {
    throw new AppError(httpStatus.NOT_FOUND, 'Message not found');
  }
  await msg.softDelete();
};

export const deleteContactMessagePermanent = async (
  id: string,
): Promise<void> => {
  const exists = await ContactMessageRepository.findByIdLean(id);
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Message not found');
  }
  await ContactMessageRepository.hardDeleteById(id);
};

export const getUnreadCount = async (): Promise<number> => {
  return await ContactMessageRepository.countUnread();
};
