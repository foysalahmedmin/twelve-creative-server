import sgMail from '@sendgrid/mail';
import { readFile } from 'fs/promises';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import config from '../config/env';

export type EmailOptions = {
  /** One address, or several to notify a whole team. */
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  attachments?: {
    filename: string;
    content?: Buffer | string;
    path?: string;
    type?: string;
    cid?: string;
    disposition?: string;
  }[];
};

export const sendEmailSMTP = async ({
  to,
  subject,
  text,
  html,
  attachments,
}: EmailOptions) => {
  if (!config.smtp_email || !config.smtp_email_password) {
    throw new Error('SMTP credentials are missing');
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp_host || 'smtp.gmail.com',
    port: Number(config.smtp_port) || 587,
    secure: Number(config.smtp_port) === 465,
    auth: {
      user: config.smtp_email,
      pass: config.smtp_email_password,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: config.smtp_email,
      to,
      subject,
      text,
      html,
      attachments: attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
        path: att.path,
        contentType: att.type,
        cid: att.cid,
      })),
    });
    console.log(`Email sent (SMTP): ${info.messageId}`);
  } catch (error) {
    console.error('SMTP Email Error:', error);
    throw error;
  }
};

export const sendEmailResend = async ({
  to,
  subject,
  text,
  html,
  attachments,
}: EmailOptions) => {
  if (!config.resend_api_key || !config.resend_email) {
    throw new Error('Resend credentials are missing');
  }

  const resend = new Resend(config.resend_api_key);

  try {
    const { data, error } = await resend.emails.send({
      from: config.resend_email,
      to,
      subject,
      text,
      html,
      attachments: attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
        path: att.path,
        contentType: att.type,
        cid: att.cid,
      })),
    });

    if (error) {
      throw error;
    }

    console.log(`Email sent (Resend): ${data?.id}`);
  } catch (error) {
    console.error('Resend Email Error:', error);
    throw error;
  }
};

export const sendEmailSendgrid = async ({
  to,
  subject,
  text,
  html,
  attachments,
}: EmailOptions) => {
  if (!config.sendgrid_api_key || !config.sendgrid_email) {
    throw new Error('SendGrid credentials are missing');
  }

  sgMail.setApiKey(config.sendgrid_api_key);

  try {
    // SendGrid requires base64-encoded content and does not support
    // path-based attachments, so resolve every attachment to base64 here.
    const mappedAttachments = attachments
      ? await Promise.all(
          attachments.map(async (att) => {
            let content: string;
            if (Buffer.isBuffer(att.content)) {
              content = att.content.toString('base64');
            } else if (att.path) {
              content = (await readFile(att.path)).toString('base64');
            } else if (typeof att.content === 'string') {
              content = Buffer.from(att.content, 'utf-8').toString('base64');
            } else {
              content = '';
            }

            return {
              filename: att.filename,
              content,
              contentId: att.cid || att.filename,
              disposition: att?.disposition || 'attachment',
              type: att.type,
            };
          }),
        )
      : undefined;

    const info = await sgMail.send({
      from: config.sendgrid_email,
      to,
      subject,
      text,
      html,
      attachments: mappedAttachments,
    });
    console.log(`Email sent (SendGrid): ${info[0].headers['x-message-id']}`);
  } catch (error: unknown) {
    const err = error as { response?: { body?: unknown } };
    console.error('SendGrid Email Error:', err.response?.body || error);
    throw error;
  }
};

export const sendEmail = async (options: EmailOptions) => {
  // An empty recipient list reaches the providers as a hard error, so treat it
  // as "nobody is configured to be notified" and stop here instead.
  const hasRecipient = Array.isArray(options.to)
    ? options.to.length > 0
    : Boolean(options.to?.trim());
  if (!hasRecipient) {
    console.warn('Email skipped: no recipient configured');
    return;
  }

  if (config.email_provider === 'smtp') {
    await sendEmailSMTP(options);
  } else if (config.email_provider === 'resend') {
    await sendEmailResend(options);
  } else if (config.email_provider === 'sendgrid') {
    await sendEmailSendgrid(options);
  } else {
    await sendEmailSMTP(options);
  }
};
