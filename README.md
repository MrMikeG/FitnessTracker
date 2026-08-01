# Pulse Training

A mobile-first strength and half-marathon training dashboard built with Next.js.

## Run locally

```bash
pnpm install
pnpm dev
```

## Deploy on Vercel

1. Push this project to your GitHub repository.
2. In Vercel, select **Add New → Project**, then import the repository.
3. Leave the framework preset as **Next.js** and select **Deploy**.

Add the following environment variables in Vercel before deploying:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Run [`supabase/schema.sql`](./supabase/schema.sql) once in the Supabase SQL Editor before using the app. Progress is then securely synced to the signed-in user's account.
# FitnessTracker
