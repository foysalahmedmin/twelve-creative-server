import httpStatus from 'http-status';

jest.mock('../faq.repository');

import * as FaqRepository from '../faq.repository';
import * as FaqService from '../faq.service';

const FAQ_ID = '507f1f77bcf86cd799439021';
const faq = {
  _id: FAQ_ID,
  question: 'How long does a project take?',
  answer: 'Most projects take between four and eight weeks.',
  group: 'Process',
  order: 1,
  is_active: true,
};

describe('FaqService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates an FAQ through the repository', async () => {
    (FaqRepository.create as jest.Mock).mockResolvedValue(faq);

    await expect(FaqService.createFaq(faq)).resolves.toEqual(faq);

    expect(FaqRepository.create).toHaveBeenCalledWith(faq);
  });

  it('returns the ordered public FAQs in the service data envelope', async () => {
    (FaqRepository.findPublic as jest.Mock).mockResolvedValue([faq]);

    await expect(FaqService.getPublicFaqs()).resolves.toEqual({ data: [faq] });

    expect(FaqRepository.findPublic).toHaveBeenCalledWith();
  });

  it('forwards admin filters and returns the paginated repository result', async () => {
    const query = { filter: 'inactive', search: 'project', page: 3 };
    const page = {
      data: [faq],
      meta: { total: 21, page: 3, limit: 10, total_pages: 3 },
    };
    (FaqRepository.findAdminPaginated as jest.Mock).mockResolvedValue(page);

    await expect(FaqService.getFaqs(query)).resolves.toEqual(page);

    expect(FaqRepository.findAdminPaginated).toHaveBeenCalledWith(query);
  });

  it('returns an FAQ by id', async () => {
    (FaqRepository.findByIdLean as jest.Mock).mockResolvedValue(faq);

    await expect(FaqService.getFaq(FAQ_ID)).resolves.toEqual(faq);

    expect(FaqRepository.findByIdLean).toHaveBeenCalledWith(FAQ_ID);
  });

  it('throws 404 when a requested FAQ does not exist', async () => {
    (FaqRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(FaqService.getFaq(FAQ_ID)).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'FAQ not found',
    });
  });

  it('updates an existing FAQ', async () => {
    const payload = {
      question: 'When can a project start?',
      is_active: false,
    };
    const updated = { ...faq, ...payload };
    (FaqRepository.findByIdLean as jest.Mock).mockResolvedValue(faq);
    (FaqRepository.updateById as jest.Mock).mockResolvedValue(updated);

    await expect(FaqService.updateFaq(FAQ_ID, payload)).resolves.toEqual(
      updated,
    );

    expect(FaqRepository.updateById).toHaveBeenCalledWith(FAQ_ID, payload);
  });

  it('does not update a missing FAQ', async () => {
    (FaqRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      FaqService.updateFaq(FAQ_ID, { question: 'Missing FAQ?' }),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'FAQ not found',
    });

    expect(FaqRepository.updateById).not.toHaveBeenCalled();
  });

  it('forwards the complete reorder payload', async () => {
    const items = [
      { _id: FAQ_ID, order: 2 },
      { _id: '507f1f77bcf86cd799439022', order: 1 },
    ];
    (FaqRepository.updateOrder as jest.Mock).mockResolvedValue(undefined);

    await expect(FaqService.reorderFaqs(items)).resolves.toBeUndefined();

    expect(FaqRepository.updateOrder).toHaveBeenCalledWith(items);
  });

  it('soft deletes an existing FAQ document', async () => {
    const softDelete = jest.fn().mockResolvedValue(undefined);
    (FaqRepository.findById as jest.Mock).mockResolvedValue({
      ...faq,
      softDelete,
    });

    await expect(FaqService.deleteFaq(FAQ_ID)).resolves.toBeUndefined();

    expect(FaqRepository.findById).toHaveBeenCalledWith(FAQ_ID);
    expect(softDelete).toHaveBeenCalledWith();
  });

  it('does not soft delete a missing FAQ', async () => {
    (FaqRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(FaqService.deleteFaq(FAQ_ID)).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'FAQ not found',
    });
  });

  it('permanently deletes an existing FAQ', async () => {
    (FaqRepository.findByIdLean as jest.Mock).mockResolvedValue(faq);
    (FaqRepository.hardDeleteById as jest.Mock).mockResolvedValue(undefined);

    await expect(
      FaqService.deleteFaqPermanent(FAQ_ID),
    ).resolves.toBeUndefined();

    expect(FaqRepository.hardDeleteById).toHaveBeenCalledWith(FAQ_ID);
  });

  it('does not permanently delete a missing FAQ', async () => {
    (FaqRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(FaqService.deleteFaqPermanent(FAQ_ID)).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'FAQ not found',
    });

    expect(FaqRepository.hardDeleteById).not.toHaveBeenCalled();
  });
});

// Restore is the counterpart to the soft delete these modules already had:
// without it a soft-deleted record was unreachable from the API entirely, and
// could only be brought back by editing the database by hand.
describe('FaqService.restoreFaq', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('restores a soft-deleted record and returns the fresh copy', async () => {
    (FaqRepository.findByIdWithDeleted as jest.Mock).mockResolvedValue(faq);
    (FaqRepository.restoreById as jest.Mock).mockResolvedValue(faq);
    (FaqRepository.findByIdLean as jest.Mock).mockResolvedValue(faq);

    await expect(FaqService.restoreFaq(FAQ_ID)).resolves.toEqual(faq);
    expect(FaqRepository.restoreById).toHaveBeenCalledWith(FAQ_ID);
  });

  it('throws 404 without attempting a restore when the id does not exist', async () => {
    (FaqRepository.findByIdWithDeleted as jest.Mock).mockResolvedValue(null);

    await expect(FaqService.restoreFaq(FAQ_ID)).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'FAQ not found',
    });
    expect(FaqRepository.restoreById).not.toHaveBeenCalled();
  });

  it('throws 404 when the record exists but was never deleted', async () => {
    (FaqRepository.findByIdWithDeleted as jest.Mock).mockResolvedValue(faq);
    (FaqRepository.restoreById as jest.Mock).mockResolvedValue(null);

    await expect(FaqService.restoreFaq(FAQ_ID)).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'FAQ not found or not deleted',
    });
  });
});
