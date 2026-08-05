import express from 'express';
import aboutPageRoutes from '../modules/about-page/about-page.route';
import authRoutes from '../modules/auth/auth.route';
import bookingRoutes from '../modules/booking/booking.route';
import brandRoutes from '../modules/brand/brand.route';
import contactMessageRoutes from '../modules/contact-message/contact-message.route';
import faqRoutes from '../modules/faq/faq.route';
import featuredProjectRoutes from '../modules/featured-project/featured-project.route';
import fileRoutes from '../modules/file/file.route';
import industryRoutes from '../modules/industry/industry.route';
import legalPageRoutes from '../modules/legal-page/legal-page.route';
import pageCtaRoutes from '../modules/page-cta/page-cta.route';
import pageHeroRoutes from '../modules/page-hero/page-hero.route';
import bookingSettingRoutes from '../modules/booking-setting/booking-setting.route';
import processSectionRoutes from '../modules/process-section/process-section.route';
import ticketRoutes from '../modules/ticket/ticket.route';
import taskRoutes from '../modules/task/task.route';
import systemLogRoutes from '../modules/system-log/system-log.route';
import insightRoutes from '../modules/insight/insight.route';
import serviceRoutes from '../modules/service/service.route';
import NotificationRecipientRoutes from '../modules/notification-recipient/notification-recipient.route';
import notificationRoutes from '../modules/notification/notification.route';
import showcaseVideoRoutes from '../modules/showcase-video/showcase-video.route';
import siteSettingRoutes from '../modules/site-setting/site-setting.route';
import sharedSectionRoutes from '../modules/shared-section/shared-section.route';
import teamMemberRoutes from '../modules/team-member/team-member.route';
import testimonialRoutes from '../modules/testimonial/testimonial.route';
import userRoutes from '../modules/user/user.route';
import workRoutes from '../modules/work/work.route';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: authRoutes,
  },
  {
    path: '/user',
    route: userRoutes,
  },
  {
    path: '/notification',
    route: notificationRoutes,
  },
  {
    path: '/notification-recipient',
    route: NotificationRecipientRoutes,
  },
  {
    path: '/file',
    route: fileRoutes,
  },
  {
    path: '/testimonial',
    route: testimonialRoutes,
  },
  {
    path: '/showcase-video',
    route: showcaseVideoRoutes,
  },
  {
    path: '/booking',
    route: bookingRoutes,
  },
  {
    path: '/contact-message',
    route: contactMessageRoutes,
  },
  {
    path: '/brand',
    route: brandRoutes,
  },
  {
    path: '/site-setting',
    route: siteSettingRoutes,
  },
  {
    path: '/work',
    route: workRoutes,
  },
  {
    path: '/faq',
    route: faqRoutes,
  },
  {
    path: '/team-member',
    route: teamMemberRoutes,
  },
  {
    path: '/insight',
    route: insightRoutes,
  },
  {
    path: '/featured-project',
    route: featuredProjectRoutes,
  },
  {
    path: '/service',
    route: serviceRoutes,
  },
  {
    path: '/industry',
    route: industryRoutes,
  },
  {
    path: '/page-hero',
    route: pageHeroRoutes,
  },
  {
    path: '/page-ctas',
    route: pageCtaRoutes,
  },
  {
    path: '/shared-sections',
    route: sharedSectionRoutes,
  },
  {
    path: '/about-page',
    route: aboutPageRoutes,
  },
  {
    path: '/legal-pages',
    route: legalPageRoutes,
  },
  {
    path: '/booking-setting',
    route: bookingSettingRoutes,
  },
  {
    path: '/process-section',
    route: processSectionRoutes,
  },
  {
    path: '/ticket',
    route: ticketRoutes,
  },
  {
    path: '/task',
    route: taskRoutes,
  },
  {
    path: '/system-log',
    route: systemLogRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
