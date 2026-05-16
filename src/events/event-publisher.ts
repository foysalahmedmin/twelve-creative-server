export type TAppEvent =
  | 'news.created'
  | 'news.published'
  | 'news.archived'
  | 'news.deleted'
  | 'comment.created'
  | 'reaction.created'
  | 'user.registered'
  | 'user.verified'
  | 'notification.sent';

type TEventHandler<T = unknown> = (payload: T) => void | Promise<void>;

const handlers: Map<TAppEvent, TEventHandler[]> = new Map();

export const subscribe = <T>(
  event: TAppEvent,
  handler: TEventHandler<T>,
): void => {
  const existing = handlers.get(event) || [];
  handlers.set(event, [...existing, handler as TEventHandler]);
};

export const publish = async <T>(
  event: TAppEvent,
  payload: T,
): Promise<void> => {
  const eventHandlers = handlers.get(event);
  if (!eventHandlers?.length) return;

  await Promise.allSettled(eventHandlers.map((handler) => handler(payload)));
};

export const unsubscribe = (event: TAppEvent, handler: TEventHandler): void => {
  const existing = handlers.get(event) || [];
  handlers.set(
    event,
    existing.filter((h) => h !== handler),
  );
};
