# Vitality exercise media Worker

This Cloudflare Worker provides the two media routes used by Vitality Vista:

- `GET /exerciseImage?path=<exercise>/<frame>.jpg` returns a static CC0 reference image.
- `GET /exerciseGif?id=<anatome-ext-id>` returns the animated CC0 movement guide.

The Vitality backend remains the exercise search/detail API. Keeping the media
Worker separate avoids duplicating that API and lets Cloudflare serve the GIF
bundle as static assets.

## Local verification

```sh
npm install
npm run check
npm run deploy:dry-run
```

`prepare:assets` performs a sparse checkout of the pinned Anatome revision and
verifies that all 873 GIFs are present. The generated 161 MB asset directory is
ignored by Git and uploaded by Wrangler as Workers Static Assets.

## Deployment

```sh
npm run deploy
```

After deployment, set the Vitality backend environment variable to the Worker
origin (without a trailing slash), then redeploy the backend:

```text
EXERCISE_MEDIA_BASE_URL=https://vitality-exercise-media.enmasantos.workers.dev
```

The Worker also remains available at
To use `exercise-media.enmasantos.dev` later, first move the domain's DNS zone to
Cloudflare, then configure it as a Worker custom domain.

## Licensing

The exercise records, JPGs, and derived GIFs are CC0-1.0 public-domain
material. Source and attribution details are retained in
`THIRD_PARTY_NOTICES.md`.
