# Image Atelier — AI Image Generator MVP

A premium, private-first image generation studio built with Next.js, TypeScript, Tailwind CSS, and Hugging Face Inference.

## Important reality check

The website code can be run without paying, but AI generation is only free while the chosen provider/model offers free access and quota. Hugging Face free inference credits/availability can change. This project intentionally has **no automatic paid fallback**. If a model is unavailable or free quota is exhausted, the request fails with an explanatory message rather than switching to a paid provider.

The default model is `black-forest-labs/FLUX.1-schnell`. Confirm current provider availability and account permissions before relying on it.

## Requirements

- Node.js 20.9+ recommended
- A Hugging Face access token with appropriate inference permissions: https://huggingface.co/settings/tokens
- An account/model/provider combination that can actually run the selected model

## Run locally

1. Extract this project.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` and add your token:

   ```bash
   cp .env.example .env.local
   ```

   On Windows, create `.env.local` manually and copy the values from `.env.example`.

4. Start the dev server:

   ```bash
   npm run dev
   ```

5. Visit http://localhost:3000

Do not commit `.env.local`. Never put `HF_TOKEN` in a `NEXT_PUBLIC_` variable or in client-side code.

## What is included

- Premium responsive image studio interface
- Prompt field with length validation
- Four aspect ratio presets
- Real server-side text-to-image request
- Download for generated output
- Browser-local recent history (not cloud persistence)
- Clear provider/quota error handling
- Best-effort per-instance rate limit
- No automatic paid fallback
- `robots` metadata disables search indexing

## Free inference setup

Free hosted inference is not guaranteed to be unlimited or available for every model. If generation fails with model/provider/quota errors:

1. Check the server terminal logs.
2. Check the Hugging Face token permissions and account usage.
3. Verify whether the selected model is currently supported by a provider available to your account.
4. If necessary, change `HF_IMAGE_MODEL` only after checking model/provider availability.

This MVP deliberately does not silently try a paid provider.

## Deploying to Vercel

1. Push this project to a **new, private GitHub repository**.
2. Import it in Vercel.
3. Add `HF_TOKEN` as a server-side environment variable for Preview/Development as needed. Add it to Production only when ready.
4. Optionally add `HF_IMAGE_MODEL` and `GENERATION_RATE_LIMIT`.
5. Deploy a private preview first and test generation, errors, and limits.

Do not put secrets in the repository. A public Vercel URL is not a private app merely because search indexing is disabled. Before sharing it, add real authentication or keep the deployment access-protected.

## MVP limitations to fix before public launch

- The in-memory rate limiter is per server instance and is not sufficient for public abuse prevention.
- There is no user authentication or server-side user quota yet.
- Browser-local history uses temporary object URLs and is not a durable archive after the page/browser session ends. Download images you want to keep.
- Image editing, reference uploads, cloud storage, queueing, moderation, billing, analytics, and admin controls are not implemented yet.
- Provider output, response time, usage terms, and free quota depend on the chosen model/provider.

## Next milestones

1. Verify one model/provider works on a free account.
2. Run a production build and test on mobile.
3. Add authentication before any public sharing.
4. Add shared rate limiting, per-user quotas, moderation, and request timeouts.
5. Add durable private storage only after deciding a storage provider and its free-tier limits.
6. Evaluate local ComfyUI/open-weight inference on available hardware as an alternative, recognizing that compute is not free in the general case.
