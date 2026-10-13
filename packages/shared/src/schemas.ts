import { z } from "zod";
import {
  AUTH_BRIDGE_SOURCE_EXTENSION,
  AUTH_BRIDGE_SOURCE_WEB,
  SHORT_ID_ALPHABET,
  SHORT_ID_LENGTH,
  TITLE_MAX_LENGTH,
  VIDEO_STATUSES,
} from "./constants";

export const shortIdSchema = z
  .string()
  .regex(new RegExp(`^[${SHORT_ID_ALPHABET}]{${SHORT_ID_LENGTH}}$`), "Invalid short id");

export const videoIdSchema = z.uuid();

export const videoStatusSchema = z.enum(VIDEO_STATUSES);

const titleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(TITLE_MAX_LENGTH, `Title must be at most ${TITLE_MAX_LENGTH} characters`);

/** Video as returned to its owner. */
export const videoDtoSchema = z.object({
  id: videoIdSchema,
  shortId: z.string(),
  title: z.string(),
  status: videoStatusSchema,
  playbackId: z.string().nullable(),
  durationSeconds: z.number().nullable(),
  aspectRatio: z.string().nullable(),
  viewCount: z.number().int().nonnegative(),
  isShared: z.boolean(),
  shareUrl: z.url(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createVideoRequestSchema = z.object({
  title: titleSchema.optional(),
});

export const createVideoResponseSchema = z.object({
  id: videoIdSchema,
  shortId: z.string(),
  uploadUrl: z.url(),
  shareUrl: z.url(),
});

export const shareVideoResponseSchema = z.object({
  shortId: z.string(),
  shareUrl: z.url(),
  isShared: z.boolean(),
});

/** Trim window in seconds, applied to the current asset. */
export const trimVideoRequestSchema = z
  .object({
    startSeconds: z.number().min(0),
    endSeconds: z.number().positive(),
  })
  .refine((v) => v.endSeconds - v.startSeconds >= 1, {
    message: "The trimmed video must be at least 1 second long",
  });

export const updateVideoRequestSchema = z.object({
  title: titleSchema,
});

export const listVideosResponseSchema = z.object({
  videos: z.array(videoDtoSchema),
});

export const apiErrorCodeSchema = z.enum([
  "bad_request",
  "unauthorized",
  "forbidden",
  "not_found",
  "rate_limited",
  "upstream_error",
  "internal_error",
]);

export const apiErrorSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
  }),
});

export const sessionUserSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  name: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});

/** Supabase session as handed to the extension. */
export const extensionSessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  /** Unix seconds. */
  expiresAt: z.number().int(),
  user: sessionUserSchema,
});

export const refreshSessionRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export const authBridgeWebMessageSchema = z.object({
  source: z.literal(AUTH_BRIDGE_SOURCE_WEB),
  type: z.literal("session"),
  session: extensionSessionSchema,
});

export const authBridgeExtensionMessageSchema = z.object({
  source: z.literal(AUTH_BRIDGE_SOURCE_EXTENSION),
  type: z.literal("session-received"),
});
