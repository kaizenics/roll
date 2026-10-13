"use client";

import {
  apiErrorSchema,
  createVideoResponseSchema,
  listVideosResponseSchema,
  shareVideoResponseSchema,
  videoDtoSchema,
  type CreateVideoResponse,
  type ShareVideoResponse,
  type VideoDTO,
} from "@roll/shared";

export class ApiClientError extends Error {}

async function request(path: string, init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiClientError("Network error. Check your connection and try again.");
  }
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(await response.json().catch(() => null));
    throw new ApiClientError(parsed.success ? parsed.data.error.message : "Request failed");
  }
  return response;
}

export async function createVideo(): Promise<CreateVideoResponse> {
  const response = await request("/api/videos", { method: "POST", body: "{}" });
  return createVideoResponseSchema.parse(await response.json());
}

export async function fetchVideos(): Promise<VideoDTO[]> {
  const response = await request("/api/videos", { cache: "no-store" });
  return listVideosResponseSchema.parse(await response.json()).videos;
}

export async function renameVideo(id: string, title: string): Promise<VideoDTO> {
  const response = await request(`/api/videos/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
  return videoDtoSchema.parse(await response.json());
}

export async function deleteVideo(id: string): Promise<void> {
  await request(`/api/videos/${id}`, { method: "DELETE" });
}

export async function shareVideo(id: string): Promise<ShareVideoResponse> {
  const response = await request(`/api/videos/${id}/share`, { method: "POST" });
  return shareVideoResponseSchema.parse(await response.json());
}

export async function revokeShare(id: string): Promise<ShareVideoResponse> {
  const response = await request(`/api/videos/${id}/share`, { method: "DELETE" });
  return shareVideoResponseSchema.parse(await response.json());
}

export async function trimVideo(id: string, startSeconds: number, endSeconds: number) {
  await request(`/api/videos/${id}/trim`, {
    method: "POST",
    body: JSON.stringify({ startSeconds, endSeconds }),
  });
}

export async function recordView(id: string): Promise<void> {
  await request(`/api/videos/${id}/view`, { method: "POST" });
}
