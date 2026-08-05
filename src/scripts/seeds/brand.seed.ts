/**
 * Brand seed data for a fresh install.
 *
 * Consumed by seeds/initial.seed.ts — kept here so the runner stays readable
 * and each module's demo content can be edited on its own.
 */

const brandLogo = (name: string) =>
  `/brand-logos/${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}.svg`;

export const BRAND_SEED = [
  'Casa del Mar',
  'Hudson Hospitality',
  'Meridian Properties',
  'Atlas Developments',
  'Velocity Aviation',
  'Skyline Charter',
  'Forge Advisors',
  'Brightline Partners',
  'Vesta Group',
  'Obsidian Real Estate',
  'Northstar Aviation',
  'Monarch Consulting',
].map((name, index) => ({
  name,
  logo: brandLogo(name),
  order: index + 1,
  is_active: true,
}));
