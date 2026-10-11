import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { handleMuxWebhook } from "@/lib/mux-webhook";
import { createWebhookRepo } from "@/lib/webhook-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // The signature covers the exact bytes, so read the raw body before parsing.
  const rawBody = await request.text();
  try {
    const result = await handleMuxWebhook({
      rawBody,
      signatureHeader: request.headers.get("mux-signature"),
      secret: getServerEnv("MUX_WEBHOOK_SECRET"),
      repo: createWebhookRepo(),
    });
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    // 500 makes Mux retry the delivery; the handler is idempotent.
    console.error("Mux webhook processing failed", error);
    return NextResponse.json(
      { error: { code: "internal_error", message: "Webhook processing failed" } },
      { status: 500 },
    );
  }
}
