import { randomUUID } from 'node:crypto';
import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import { SharedSection } from './shared-section.model';
import {
  TOrderedTextItem,
  TOrderedTextItemInput,
  TPublicSharedSection,
  TSharedSection,
  TSharedSectionInput,
  TSharedSectionKey,
  TStatementParagraph,
  TStatementParagraphInput,
  TStatementSegment,
} from './shared-section.type';

const assertUniqueIds = (
  items: { id?: string }[],
  collectionName: string,
): void => {
  const ids = items
    .map((item) => item.id?.trim())
    .filter((id): id is string => Boolean(id));
  if (new Set(ids).size !== ids.length) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `${collectionName} ids must be unique`,
    );
  }
};

const normalizeTextItems = (
  items: TOrderedTextItemInput[],
  collectionName: string,
): TOrderedTextItem[] => {
  assertUniqueIds(items, collectionName);
  return items.map((item, position) => ({
    id: item.id?.trim() || randomUUID(),
    index: String(position + 1).padStart(2, '0'),
    text: item.text,
  }));
};

const normalizeParagraphs = (
  paragraphs: TStatementParagraphInput[],
): TStatementParagraph[] => {
  assertUniqueIds(paragraphs, 'Statement paragraph');
  return paragraphs.map((paragraph, position) => {
    assertUniqueIds(
      paragraph.segments,
      `Statement paragraph ${position + 1} segment`,
    );
    const segments: TStatementSegment[] = paragraph.segments.map(
      (segment, segmentPosition) => ({
        id: segment.id?.trim() || randomUUID(),
        index: String(segmentPosition + 1).padStart(2, '0'),
        text: segment.text,
        highlight: segment.highlight ?? false,
      }),
    );
    return {
      id: paragraph.id?.trim() || randomUUID(),
      index: String(position + 1).padStart(2, '0'),
      segments,
    };
  });
};

export const normalizeSharedSection = (
  payload: TSharedSectionInput,
): TSharedSection => {
  const base = {
    key: payload.key,
    label: payload.label,
    title: payload.title,
    description: payload.description,
    is_active: payload.is_active ?? true,
  };

  switch (payload.key) {
    case 'difference':
      return {
        ...base,
        key: payload.key,
        content: {
          fragmented: {
            title: payload.content.fragmented.title,
            items: normalizeTextItems(
              payload.content.fragmented.items,
              'Fragmented approach item',
            ),
          },
          connected: {
            title: payload.content.connected.title,
            items: normalizeTextItems(
              payload.content.connected.items,
              'Connected system item',
            ),
          },
        },
      };
    case 'why-choose-us':
      assertUniqueIds(payload.content.features, 'Why choose us feature');
      return {
        ...base,
        key: payload.key,
        content: {
          features: payload.content.features.map((feature, position) => ({
            ...feature,
            id: feature.id?.trim() || randomUUID(),
            index: String(position + 1).padStart(2, '0'),
          })),
        },
      };
    case 'growth-system':
      assertUniqueIds(payload.content.steps, 'Growth system step');
      return {
        ...base,
        key: payload.key,
        content: {
          steps: payload.content.steps.map((step, position) => ({
            ...step,
            id: step.id?.trim() || randomUUID(),
            index: String(position + 1).padStart(2, '0'),
            items: normalizeTextItems(
              step.items,
              `Growth system step ${position + 1} item`,
            ),
          })),
        },
      };
    case 'scroll-statement':
      return {
        ...base,
        key: payload.key,
        content: {
          paragraphs: normalizeParagraphs(payload.content.paragraphs),
        },
      };
    case 'work-with-us':
      assertUniqueIds(payload.content.cards, 'Work with us card');
      return {
        ...base,
        key: payload.key,
        content: {
          cards: payload.content.cards.map((card, position) => ({
            ...card,
            id: card.id?.trim() || randomUUID(),
            index: String(position + 1).padStart(2, '0'),
          })),
        },
      };
    default:
      return { ...base, key: payload.key, content: {} };
  }
};

export const getPublicSharedSection = async (
  key: TSharedSectionKey,
): Promise<TPublicSharedSection | null> => {
  const section = await SharedSection.findOne({ key, is_active: true }).lean();
  if (!section) return null;
  return {
    key: section.key,
    label: section.label,
    title: section.title,
    description: section.description,
    content: section.content,
  } as TPublicSharedSection;
};

export const getSharedSections = async (): Promise<TSharedSection[]> =>
  await SharedSection.find().sort({ key: 1 }).lean();

export const getSharedSection = async (
  key: TSharedSectionKey,
): Promise<TSharedSection | null> =>
  await SharedSection.findOne({ key }).lean();

export const updateSharedSection = async (
  key: TSharedSectionKey,
  payload: TSharedSectionInput,
): Promise<TSharedSection> => {
  if (key !== payload.key) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Route key must match the shared section payload key',
    );
  }

  const normalized = normalizeSharedSection(payload);
  const updated = await SharedSection.findOneAndUpdate(
    { key },
    { $set: normalized },
    {
      upsert: true,
      new: true,
      lean: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );
  return updated!;
};
