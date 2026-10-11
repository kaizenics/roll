export function buildShareUrl(appUrl: string, shortId: string): string {
  return `${appUrl.replace(/\/+$/, "")}/v/${shortId}`;
}

export function muxThumbnailUrl(playbackId: string, time = 1): string {
  return `https://image.mux.com/${playbackId}/thumbnail.webp?time=${time}`;
}

export function muxPosterJpgUrl(playbackId: string, width = 1200): string {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=1&width=${width}`;
}

export function muxAnimatedGifUrl(playbackId: string): string {
  return `https://image.mux.com/${playbackId}/animated.gif?width=320`;
}

/** Requires the asset to have a "highest" static rendition (requested at upload time). */
export function muxMp4Url(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}/highest.mp4`;
}
