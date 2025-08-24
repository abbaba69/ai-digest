# AI Daily Digest — Website + WhatsApp Bot (Beginner Friendly)

This gives you:
- A **website** that shows exactly **yesterday’s** AI news (30 items = 10 from each of 3 sources) in **Asia/Kolkata** time.
- A **WhatsApp bot** that sends the same digest once a day to your subscribers.

---

## What you need (create free accounts)
1. **Vercel** (website hosting) — https://vercel.com
2. **Supabase** (storage) — https://supabase.com
3. **Meta for Developers** (WhatsApp Cloud API) — https://developers.facebook.com

---

## 1) Set up Supabase (storage)
1. Create a new Supabase project.
2. Open **SQL Editor** and paste the SQL from `supabase.sql`, then click **RUN**.
3. Go to **Project Settings → API**. Copy:
   - `Project URL` → use as `SUPABASE_URL`
   - `service_role` key → use as `SUPABASE_SERVICE_ROLE_KEY` (**server-only**)

4. Add your own phone to the subscribers table (SQL or Table Editor):
   - `phone_e164` must be full format, e.g. `+9198xxxxxxxx`

---

## 2) Set up WhatsApp Cloud API (Meta)
1. Create a Meta app → add **WhatsApp** product.
2. Get:
   - `WHATSAPP_TOKEN` (temporary token for testing; later generate a permanent system user token)
   - `WHATSAPP_PHONE_NUMBER_ID` (from the WhatsApp Manager)
3. Create & submit a **message template** for approval.
   - Name: `daily_ai_digest`
   - Language: `en_US`
   - Category: **Marketing**
   - Body:
     ```
     AI Daily Digest for {{1}}

     {{2}}

     Reply STOP to unsubscribe.
     ```

### Test Numbers
- In the WhatsApp testing section, **add recipient phone numbers** (your own) as testers or use your business-approved number to send template messages.

---

## 3) Deploy the website (Vercel)
1. Put these files in a **GitHub repo** (or click “New Project” on Vercel and upload).
2. On Vercel → **Import Project** → select the repo.
3. In **Vercel → Settings → Environment Variables**, add:

```
APP_TIMEZONE=Asia/Kolkata
CRON_SECRET=change-this-to-a-long-random-string

SUPABASE_URL= (from Supabase)
SUPABASE_SERVICE_ROLE_KEY= (from Supabase)

WHATSAPP_TOKEN= (from Meta)
WHATSAPP_PHONE_NUMBER_ID= (from Meta)
WHATSAPP_TEMPLATE_NAME=daily_ai_digest
WHATSAPP_TEMPLATE_LANG=en_US
```

4. Deploy. Your site URL will look like `https://your-project.vercel.app/`

---

## 4) Turn on the Daily Jobs
This repo includes `vercel.json` with two daily schedules (UTC times shown):
- `GET /api/refresh?token=CRON_SECRET` at **18:45 UTC** (≈ 00:15 IST) → collects **yesterday’s** news into Supabase.
- `GET /api/whatsapp/send?token=CRON_SECRET` at **19:15 UTC** (≈ 00:45 IST) → sends the digest to subscribers.

> You can change these times by editing `vercel.json` in the repo.

---

## 5) Manual test (any time)
- Fetch yesterday’s items now:
  - Visit: `https://YOUR-URL/api/refresh?token=CRON_SECRET`
- Send WhatsApp broadcast now:
  - Visit: `https://YOUR-URL/api/whatsapp/send?token=CRON_SECRET`

---

## Add/Change Sources
The default 3 sources are:
- TechCrunch AI — https://techcrunch.com/tag/artificial-intelligence/feed/
- MIT Technology Review — https://www.technologyreview.com/feed/
- VentureBeat AI — https://venturebeat.com/category/ai/feed/

To add more, insert rows in the `sources` table with `name` and `rss_url` (set `is_active = true`).

---

## Files you might edit later
- `src/lib/fetchFeeds.ts` — how we collect and filter **yesterday** (IST) news.
- `src/app/page.tsx` — how the homepage looks.
- `vercel.json` — when the daily jobs run.
- `supabase.sql` — database tables.

That’s it! You don’t need to understand the code yet — just follow the steps above.
