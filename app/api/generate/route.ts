import { NextRequest, NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";

export const runtime = "nodejs";
export const maxDuration = 60;

type AspectRatio = "square" | "portrait" | "landscape" | "tall";

const dimensions: Record<AspectRatio, { width: number; height: number }> = {
  square: { width: 1024, height: 1024 },
  portrait: { width: 832, height: 1216 },
  landscape: { width: 1216, height: 832 },
  tall: { width: 768, height: 1344 },
};

// Best-effort per-instance limiter. For a public launch, replace with a shared
// store (e.g. Redis/Upstash) and authenticated per-user quotas.
const hits = new Map<string, number[]>();
function isRateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < 60_000);
  const limit = Math.max(1, Math.min(10, Number(process.env.GENERATION_RATE_LIMIT) || 3));
  if (recent.length >= limit) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 500) {
    for (const [k, values] of hits) {
      if (values.every((time) => now - time >= 60_000)) hits.delete(k);
    }
  }
  return false;
}

export async function POST(request: NextRequest) {
  const token = process.env.HF_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Image generation is not configured yet. Add HF_TOKEN to your local .env.local file or deployment environment." },
      { status: 503 },
    );
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = forwarded || "local";
  if (isRateLimited(key)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute before generating again." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Please send a valid request." }, { status: 400 });
  }

  const data = body as { prompt?: unknown; aspectRatio?: unknown };
  const prompt = typeof data.prompt === "string" ? data.prompt.trim() : "";
  const aspectRatio = typeof data.aspectRatio === "string" ? data.aspectRatio as AspectRatio : "square";

  if (!prompt) return NextResponse.json({ error: "Describe the image you want to create." }, { status: 400 });
  if (prompt.length > 1200) {
    return NextResponse.json({ error: "Keep your prompt under 1,200 characters." }, { status: 400 });
  }
  if (!(aspectRatio in dimensions)) {
    return NextResponse.json({ error: "Choose a supported aspect ratio." }, { status: 400 });
  }

  try {
    const client = new InferenceClient(token);
    const model = process.env.HF_IMAGE_MODEL || "black-forest-labs/FLUX.1-schnell";
    const imageBlob = await client.textToImage({
      model,
      inputs: prompt,
      parameters: {
        ...dimensions[aspectRatio],
        num_inference_steps: 4,
      },
    }, { outputType: "blob" });

    if (!(imageBlob instanceof Blob) || imageBlob.size === 0) {
      throw new Error("The provider returned an empty image.");
    }
    if (imageBlob.size > 12 * 1024 * 1024) {
      throw new Error("The generated image exceeded the response size limit.");
    }

    const buffer = Buffer.from(await imageBlob.arrayBuffer());
    const contentType = imageBlob.type.startsWith("image/") ? imageBlob.type : "image/png";
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown provider error";
    const lower = message.toLowerCase();
    const outOfCredits = lower.includes("no remaining credits") || lower.includes("purchase pre-paid credits") || lower.includes("insufficient credits");
    const rateLimited = lower.includes("rate") || lower.includes("quota") || lower.includes("429");
    const status = outOfCredits ? 402 : rateLimited ? 429 : 502;
    const safeMessage = outOfCredits
      ? "Hugging Face image-generation credits are exhausted. No image was generated and no paid fallback was used. Connect a provider with a free allowance or add credits to your Hugging Face account."
      : rateLimited
        ? "The image provider rate limit or free quota has been reached. No paid fallback is configured. Please wait and try again later."
        : "The image provider couldn't complete this request. Check provider availability, token permissions, and server logs.";
    console.error("Image generation provider error:", message);
    return NextResponse.json({ error: safeMessage }, { status });
  }
}
