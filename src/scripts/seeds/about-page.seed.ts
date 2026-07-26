import {
  ABOUT_PAGE_SINGLETON_KEY,
  AboutPage,
} from '../../modules/about-page/about-page.model';
import { TAboutPageInput } from '../../modules/about-page/about-page.type';

export const ABOUT_PAGE_SEED: TAboutPageInput = {
  mission_section: {
    label: 'Our Mission',
    title: 'Built for Strategic Execution',
    description:
      'We build the structure that helps businesses become understood, trusted, and easier to buy from.',
    is_visible: true,
  },
  mission: {
    title: 'The Mission',
    description:
      'To close the gaps between positioning, creative, distribution, and conversion — so businesses have one connected structure that turns attention into revenue.',
    is_visible: true,
  },
  vision: {
    title: 'The Vision',
    description:
      'To be the operating partner businesses turn to when they need strategy and execution in the same room — clearer message, sharper creative, and the backend systems that actually move the metric.',
    is_visible: true,
  },
  story_section: {
    label: 'Our Story',
    title: 'Merging Art and Science',
    description:
      'Our journey of combining creative excellence with backend growth infrastructure.',
    is_visible: true,
  },
  story_cards: [
    {
      id: 'where-it-started',
      title: 'Where it started',
      description:
        'Twelve Creative was built from the belief that creative work should be connected to the business it serves. Most companies hire one person for content, another for ads, another for websites, another for email, another for systems. The result is scattered — and the business owner is left managing the gaps.',
      media: {
        type: 'image',
        image:
          'https://images.unsplash.com/photo-1552664730-d307ca884978?w=768&h=768&fit=crop&auto=format',
      },
      is_visible: true,
    },
    {
      id: 'business-logic',
      title: 'Creative built around business logic',
      description:
        'Carlos founded Twelve Creative after 15+ years in video production and a background in film and business at NYU. The work spans hospitality, real estate, aviation, and professional services — sectors where credibility, taste, and follow-up directly impact revenue.',
      media: {
        type: 'image',
        image:
          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=768&h=768&fit=crop&auto=format',
      },
      is_visible: true,
    },
    {
      id: 'assets-to-systems',
      title: 'From assets to systems',
      description:
        "A beautiful video without a clear offer doesn't move the business. A landing page without follow-up loses the lead. We connect positioning, content, ads, websites, CRM, and automation so the work compounds instead of leaking out.",
      media: {
        type: 'image',
        image:
          'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=768&h=768&fit=crop&auto=format',
      },
      is_visible: true,
    },
    {
      id: 'today',
      title: 'How we operate today',
      description:
        "Twelve Creative exists to close the gap between strategy and execution. We work as the structure behind marketing — not a vendor at arm's length — for companies that need clarity, momentum, and a clearer path from attention to revenue.",
      media: {
        type: 'image',
        image:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=768&h=768&fit=crop&auto=format',
      },
      is_visible: true,
    },
  ],
  founder: {
    first_name: 'Carlos',
    last_name: 'Doce',
    title: 'Owner — Twelve Creative',
    biography: [
      "Carlos built Twelve Creative from the belief that most businesses don't have a creative problem — they have a strategy problem disguised as one. He combines the analytical rigor of growth systems with the visual instincts of a creative director.",
      'Every project at Twelve Creative reflects his core conviction: that positioning, creative, and execution must exist in the same room — not across three different agencies.',
    ],
    media: {
      type: 'image',
      image:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=600&fit=crop&auto=format',
    },
    is_visible: true,
  },
  gallery_section: {
    label: 'Behind the Scenes',
    title: 'Inside Twelve Creative',
    description:
      'A look at the people, places, and production behind the work.',
    is_visible: true,
  },
  gallery: [
    {
      id: 'hospitality-production',
      alt: 'Hospitality production by Twelve Creative',
      media: {
        type: 'image',
        image:
          'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop&auto=format',
      },
      is_visible: true,
    },
    {
      id: 'property-production',
      alt: 'Property production by Twelve Creative',
      media: {
        type: 'image',
        image:
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop&auto=format',
      },
      is_visible: true,
    },
    {
      id: 'aviation-production',
      alt: 'Aviation production by Twelve Creative',
      media: {
        type: 'image',
        image:
          'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&h=400&fit=crop&auto=format',
      },
      is_visible: true,
    },
    {
      id: 'strategy-session',
      alt: 'Twelve Creative strategy session',
      media: {
        type: 'image',
        image:
          'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=400&fit=crop&auto=format',
      },
      is_visible: true,
    },
    {
      id: 'camera-production',
      alt: 'Twelve Creative camera production',
      media: {
        type: 'image',
        image:
          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&h=400&fit=crop&auto=format',
      },
      is_visible: true,
    },
    {
      id: 'restaurant-production',
      alt: 'Restaurant production by Twelve Creative',
      media: {
        type: 'image',
        image:
          'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&fit=crop&auto=format',
      },
      is_visible: true,
    },
  ],
  is_active: true,
};

export type TAboutPageSeedReport = {
  module: 'about-page';
  action: 'inserted' | 'skipped' | 'replaced';
  count: 1;
};

const withDerivedOrder = (seed: TAboutPageInput) => ({
  ...seed,
  story_cards: seed.story_cards.map((item, position) => ({
    ...item,
    index: String(position + 1).padStart(2, '0'),
  })),
  gallery: seed.gallery.map((item, position) => ({
    ...item,
    index: String(position + 1).padStart(2, '0'),
  })),
});

export async function seedAboutPage(
  force: boolean,
): Promise<TAboutPageSeedReport> {
  const existing = await AboutPage.findOne({
    singleton_key: ABOUT_PAGE_SINGLETON_KEY,
  });
  if (existing && !force) {
    return { module: 'about-page', action: 'skipped', count: 1 };
  }

  if (force) await AboutPage.deleteMany({});
  await AboutPage.findOneAndUpdate(
    { singleton_key: ABOUT_PAGE_SINGLETON_KEY },
    {
      $set: withDerivedOrder(ABOUT_PAGE_SEED),
      $setOnInsert: { singleton_key: ABOUT_PAGE_SINGLETON_KEY },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  return {
    module: 'about-page',
    action: existing ? 'replaced' : 'inserted',
    count: 1,
  };
}
