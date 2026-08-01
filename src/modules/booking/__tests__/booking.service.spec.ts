import httpStatus from 'http-status';

jest.mock('../booking.repository');
jest.mock('../../industry/industry.repository');
jest.mock('../../../utils/send-email', () => ({ sendEmail: jest.fn() }));
jest.mock('../../../utils/create-system-notification', () => ({
  createSystemNotification: jest.fn(),
}));
jest.mock('../../../utils/delete-system-notifications', () => ({
  deleteSystemNotificationsByReference: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../utils/notification-recipient', () => ({
  resolveNotificationRecipients: jest
    .fn()
    .mockResolvedValue(['notifications@twelvecreative.co']),
}));
jest.mock('../../../config/env', () => ({
  __esModule: true,
  default: {
    smtp_email: 'notifications@twelvecreative.co',
    email: 'fallback@twelvecreative.co',
  },
}));

import { createSystemNotification } from '../../../utils/create-system-notification';
import { deleteSystemNotificationsByReference } from '../../../utils/delete-system-notifications';
import { resolveNotificationRecipients } from '../../../utils/notification-recipient';
import { sendEmail } from '../../../utils/send-email';
import * as IndustryRepository from '../../industry/industry.repository';
import * as BookingRepository from '../booking.repository';
import * as BookingService from '../booking.service';

const id = '507f1f77bcf86cd799439011';
const industryId = '507f1f77bcf86cd799439012';
const booking = {
  _id: id,
  name: '<Taylor & Co>',
  email: 'taylor@example.com',
  phone: '+8801000000000',
  company: 'Twelve "Partners"',
  industry: 'Hospitality',
  timeline: 'Next quarter',
  preferred_date: new Date('2026-08-01T00:00:00.000Z'),
  preferred_time: '10:00',
  message: 'Build <something> memorable',
  status: 'pending' as const,
  source: 'booking_form' as const,
};

describe('BookingService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (sendEmail as jest.Mock).mockResolvedValue(undefined);
    (resolveNotificationRecipients as jest.Mock).mockResolvedValue([
      'notifications@twelvecreative.co',
    ]);
  });

  it('creates a pending booking, notifies admins, and escapes email HTML', async () => {
    (BookingRepository.create as jest.Mock).mockResolvedValue(booking);

    await expect(
      BookingService.createBooking({
        ...booking,
        status: 'completed',
      }),
    ).resolves.toEqual(booking);

    expect(BookingRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending', source: 'booking_form' }),
    );
    expect(createSystemNotification).toHaveBeenCalledWith({
      title: `New booking from ${booking.name}`,
      message: `${booking.company} — ${booking.email}`,
      type: 'booking',
      // `reference` lets the notification be removed again if the booking is
      // ever permanently deleted.
      metadata: { url: '/admin/bookings', reference: id },
    });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['notifications@twelvecreative.co'],
        subject: `New booking from ${booking.name}`,
        html: expect.stringContaining('&lt;Taylor &amp; Co&gt;'),
      }),
    );
    expect((sendEmail as jest.Mock).mock.calls[0][0].html).toContain(
      'Twelve &quot;Partners&quot;',
    );
  });

  it('uses the booking email in the system notification when company is absent', async () => {
    const personal = { ...booking, company: undefined };
    (BookingRepository.create as jest.Mock).mockResolvedValue(personal);

    await BookingService.createBooking(personal);

    expect(createSystemNotification).toHaveBeenCalledWith(
      expect.objectContaining({ message: booking.email }),
    );
  });

  it('resolves an active Industry and stores an authoritative name snapshot', async () => {
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue({
      _id: industryId,
      name: 'Hospitality',
      is_active: true,
    });
    (BookingRepository.create as jest.Mock).mockImplementation(
      async (payload) => ({ ...booking, ...payload }),
    );

    await BookingService.createBooking({
      name: 'Taylor',
      email: 'taylor@example.com',
      industry_id: industryId,
      industry_name_snapshot: 'Spoofed client value',
    });

    expect(BookingRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        industry_id: industryId,
        industry_name_snapshot: 'Hospitality',
        industry: 'Hospitality',
      }),
    );
  });

  it('rejects a missing or inactive selected Industry', async () => {
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue({
      _id: industryId,
      name: 'Hospitality',
      is_active: false,
    });

    await expect(
      BookingService.createBooking({
        name: 'Taylor',
        email: 'taylor@example.com',
        industry_id: industryId,
      }),
    ).rejects.toMatchObject({
      status: httpStatus.BAD_REQUEST,
      message: 'Selected Industry is unavailable',
    });
    expect(BookingRepository.create).not.toHaveBeenCalled();
  });

  it('preserves an Other snapshot without an Industry reference', async () => {
    (BookingRepository.create as jest.Mock).mockImplementation(
      async (payload) => ({ ...booking, ...payload }),
    );

    await BookingService.createBooking({
      name: 'Taylor',
      email: 'taylor@example.com',
      industry_name_snapshot: 'Other',
    });

    expect(IndustryRepository.findByIdLean).not.toHaveBeenCalled();
    expect(BookingRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        industry_name_snapshot: 'Other',
        industry: 'Other',
      }),
    );
  });

  it('returns paginated bookings', async () => {
    const page = {
      data: [booking],
      meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
    };
    (BookingRepository.findAdminPaginated as jest.Mock).mockResolvedValue(page);

    await expect(
      BookingService.getBookings({ status: 'pending' }),
    ).resolves.toEqual(page);
    expect(BookingRepository.findAdminPaginated).toHaveBeenCalledWith({
      status: 'pending',
    });
  });

  it('gets a booking by id', async () => {
    (BookingRepository.findByIdLean as jest.Mock).mockResolvedValue(booking);

    await expect(BookingService.getBooking(id)).resolves.toEqual(booking);
  });

  it('throws 404 when getting a missing booking', async () => {
    (BookingRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(BookingService.getBooking(id)).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Booking not found',
    });
  });

  it('updates an existing booking', async () => {
    const updated = { ...booking, status: 'completed' as const };
    (BookingRepository.findByIdLean as jest.Mock).mockResolvedValue(booking);
    (BookingRepository.updateById as jest.Mock).mockResolvedValue(updated);

    await expect(
      BookingService.updateBooking(id, { status: 'completed' }),
    ).resolves.toEqual(updated);
    expect(BookingRepository.updateById).toHaveBeenCalledWith(id, {
      status: 'completed',
    });
  });

  it('does not update a missing booking', async () => {
    (BookingRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      BookingService.updateBooking(id, { status: 'cancelled' }),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
    });
    expect(BookingRepository.updateById).not.toHaveBeenCalled();
  });

  it('soft-deletes an existing booking', async () => {
    const softDelete = jest.fn().mockResolvedValue(undefined);
    (BookingRepository.findById as jest.Mock).mockResolvedValue({ softDelete });

    await expect(BookingService.deleteBooking(id)).resolves.toBeUndefined();
    expect(softDelete).toHaveBeenCalledWith();
  });

  it('does not soft-delete a missing booking', async () => {
    (BookingRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(BookingService.deleteBooking(id)).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
    });
  });

  it('permanently deletes a booking using a with-deleted lookup', async () => {
    (BookingRepository.findByIdWithDeleted as jest.Mock).mockResolvedValue(
      booking,
    );

    await expect(
      BookingService.deleteBookingPermanent(id),
    ).resolves.toBeUndefined();
    expect(BookingRepository.hardDeleteById).toHaveBeenCalledWith(id);
    // The bell notifications for this booking must go with it.
    expect(deleteSystemNotificationsByReference).toHaveBeenCalledWith(id);
  });

  it('does not permanently delete a missing booking', async () => {
    (BookingRepository.findByIdWithDeleted as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      BookingService.deleteBookingPermanent(id),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
    });
    expect(BookingRepository.hardDeleteById).not.toHaveBeenCalled();
    expect(deleteSystemNotificationsByReference).not.toHaveBeenCalled();
  });

  it('returns the pending booking count', async () => {
    (BookingRepository.countPending as jest.Mock).mockResolvedValue(7);

    await expect(BookingService.getPendingCount()).resolves.toBe(7);
  });
});
