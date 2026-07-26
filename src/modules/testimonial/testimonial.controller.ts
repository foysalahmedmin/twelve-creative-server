import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as TestimonialServices from './testimonial.service';

export const createTestimonial = catchAsync(async (req, res) => {
  const result = await TestimonialServices.createTestimonial(req.body);
  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Testimonial created successfully',
    data: result,
  });
});

export const getPublicTestimonials = catchAsync(async (req, res) => {
  const industrySlug =
    typeof req.query.industry_slug === 'string'
      ? req.query.industry_slug.trim().toLowerCase()
      : undefined;
  const result = await TestimonialServices.getPublicTestimonials({
    industry_slug: industrySlug,
  });
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Testimonials retrieved successfully',
    data: result.data,
  });
});

export const getTestimonials = catchAsync(async (req, res) => {
  const result = await TestimonialServices.getTestimonials(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Testimonials retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getTestimonial = catchAsync(async (req, res) => {
  const result = await TestimonialServices.getTestimonial(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Testimonial retrieved successfully',
    data: result,
  });
});

export const updateTestimonial = catchAsync(async (req, res) => {
  const result = await TestimonialServices.updateTestimonial(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Testimonial updated successfully',
    data: result,
  });
});

export const reorderTestimonials = catchAsync(async (req, res) => {
  await TestimonialServices.reorderTestimonials(req.body.items);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Testimonials reordered successfully',
    data: null,
  });
});

export const deleteTestimonial = catchAsync(async (req, res) => {
  await TestimonialServices.deleteTestimonial(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Testimonial deleted successfully',
    data: null,
  });
});

export const deleteTestimonialPermanent = catchAsync(async (req, res) => {
  await TestimonialServices.deleteTestimonialPermanent(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Testimonial permanently deleted',
    data: null,
  });
});

export const restoreTestimonial = catchAsync(async (req, res) => {
  const result = await TestimonialServices.restoreTestimonial(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Testimonial restored successfully',
    data: result,
  });
});
