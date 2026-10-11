import type { z } from "zod";
import type {
  apiErrorCodeSchema,
  apiErrorSchema,
  authBridgeExtensionMessageSchema,
  authBridgeWebMessageSchema,
  createVideoRequestSchema,
  createVideoResponseSchema,
  extensionSessionSchema,
  listVideosResponseSchema,
  refreshSessionRequestSchema,
  sessionUserSchema,
  updateVideoRequestSchema,
  videoDtoSchema,
  videoStatusSchema,
} from "./schemas";

export type VideoStatus = z.infer<typeof videoStatusSchema>;
export type VideoDTO = z.infer<typeof videoDtoSchema>;
export type CreateVideoRequest = z.infer<typeof createVideoRequestSchema>;
export type CreateVideoResponse = z.infer<typeof createVideoResponseSchema>;
export type UpdateVideoRequest = z.infer<typeof updateVideoRequestSchema>;
export type ListVideosResponse = z.infer<typeof listVideosResponseSchema>;
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type SessionUser = z.infer<typeof sessionUserSchema>;
export type ExtensionSession = z.infer<typeof extensionSessionSchema>;
export type RefreshSessionRequest = z.infer<typeof refreshSessionRequestSchema>;
export type AuthBridgeWebMessage = z.infer<typeof authBridgeWebMessageSchema>;
export type AuthBridgeExtensionMessage = z.infer<typeof authBridgeExtensionMessageSchema>;

/** Public, non-sensitive view of a video for the share page. */
export interface PublicVideo {
  id: string;
  shortId: string;
  title: string;
  status: VideoStatus;
  playbackId: string | null;
  durationSeconds: number | null;
  aspectRatio: string | null;
  viewCount: number;
  createdAt: string;
  owner: { name: string | null; avatarUrl: string | null };
}
