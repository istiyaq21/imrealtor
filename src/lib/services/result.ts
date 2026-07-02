// Shared result shape for service-layer mutations, so every caller can
// handle "Supabase isn't configured yet" the same way instead of each
// service inventing its own error shape.

export type ServiceResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export const SUPABASE_NOT_CONFIGURED_RESULT: ServiceResult<never> = {
  ok: false,
  message: "Supabase is not configured yet.",
};
