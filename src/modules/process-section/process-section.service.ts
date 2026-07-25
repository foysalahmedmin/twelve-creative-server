import { randomUUID } from 'node:crypto';
import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import {
  PROCESS_SECTION_SINGLETON_KEY,
  ProcessSection,
} from './process-section.model';
import {
  TProcessSection,
  TProcessSectionInput,
  TProcessStep,
  TPublicProcessSection,
} from './process-section.type';

export const getProcessSection = async (): Promise<TProcessSection | null> => {
  return await ProcessSection.findOne({
    singleton_key: PROCESS_SECTION_SINGLETON_KEY,
  }).lean();
};

export const getPublicProcessSection =
  async (): Promise<TPublicProcessSection | null> => {
    const section = await getProcessSection();
    if (!section) return null;

    // Explicit allowlist keeps singleton metadata, database ids, and timestamps
    // out of the public response even if the persistence schema grows later.
    return {
      label: section.label,
      title: section.title,
      description: section.description,
      thumbnail: section.thumbnail,
      process_steps: section.process_steps,
    };
  };

const normalizeProcessSteps = (
  steps: TProcessSectionInput['process_steps'],
): TProcessStep[] => {
  const suppliedIds = steps
    .map((step) => step.id?.trim())
    .filter((id): id is string => Boolean(id));

  if (new Set(suppliedIds).size !== suppliedIds.length) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Process step ids must be unique',
    );
  }

  return steps.map((step, position) => ({
    id: step.id?.trim() || randomUUID(),
    index: String(position + 1).padStart(2, '0'),
    icon: step.icon,
    title: step.title,
    description: step.description,
    image: step.image,
  }));
};

export const updateProcessSection = async (
  payload: TProcessSectionInput,
): Promise<TProcessSection> => {
  const normalized = {
    label: payload.label,
    title: payload.title,
    description: payload.description,
    thumbnail: payload.thumbnail,
    process_steps: normalizeProcessSteps(payload.process_steps),
  };

  const updated = await ProcessSection.findOneAndUpdate(
    { singleton_key: PROCESS_SECTION_SINGLETON_KEY },
    {
      $set: normalized,
      $setOnInsert: { singleton_key: PROCESS_SECTION_SINGLETON_KEY },
    },
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
