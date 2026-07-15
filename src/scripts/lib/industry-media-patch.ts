import type {
  TIndustryVideoRef,
  TIndustryVideoSource,
} from '../../modules/industry/industry.type';

const VIDEO_SOURCES: TIndustryVideoSource[] = ['youtube', 'url', 'upload'];

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export const hasValidVideoSource = (
  source: unknown,
): source is TIndustryVideoSource =>
  typeof source === 'string' &&
  VIDEO_SOURCES.includes(source as TIndustryVideoSource);

/** A video reference is complete only when both atomic parts are valid. */
export const hasCompleteVideoRef = (
  current: Partial<TIndustryVideoRef> | null | undefined,
): current is TIndustryVideoRef =>
  hasValidVideoSource(current?.source) && isNonEmptyString(current?.value);
