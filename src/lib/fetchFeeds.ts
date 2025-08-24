import Parser from 'rss-parser';
import { DateTime } from 'luxon';
import { tz, yesterdayRange, toYYYYMMDD } from './time';
import { supaAdmin } from './db';

const MAX_PER_SOURCE = 10;

type Source = { id: number; name: string; rss_url: string; is_active: boolean };

function normalize(str?: string) {
  return (str || '').replace(/\s+/g, ' ').trim();
}

function withinYesterday(pubDate?: string | Date | undefined) {
  const { start, end } = yesterdayRange();
  if (!pubDate) return false;
  const dt = typeof pubDate === 'string' ? DateTime.fromJSDate(new Date(pubDate)) : DateTime.fromJSDate(pubDate as Date);
  const zoned = dt.setZone(tz().zone);
  return zoned >= start && zoned <= end;
}

function oneLineFallback(title: string, summary?: string) {
  const base = normalize(summary) || title;
  if (!base) return '';
  return base.length > 180 ? base.slice(0, 177) + '…' : base;
}

export async function fetchAndStoreYesterday() {
  const supa = supaAdmin();
  const { data: sources, error } = await supa.from('sources').select('*').eq('is_active', true);
  if (error) throw error;

  const parser = new Parser({ timeout: 15000 });
  const results: any[] = [];
  const yyyymmdd = toYYYYMMDD(yesterdayRange().start);

  for (const s of (sources as Source[] | null) || []) {
    try {
      const feed = await parser.parseURL(s.rss_url);
      const items = (feed.items || [])
        .filter((it: any) => withinYesterday(it.isoDate || it.pubDate as any))
        .slice(0, MAX_PER_SOURCE);

      for (const it of items) {
        const title = normalize(it.title);
        const link = normalize(it.link);
        const pub = it.isoDate || it.pubDate || new Date().toISOString();
        const summary = oneLineFallback(title!, it.contentSnippet || it.content || it.summary);

        if (!title || !link) continue;

        results.push({
          source_id: s.id,
          title,
          url: link,
          published_at: new Date(pub).toISOString(),
          summary,
          digest_date: yyyymmdd,
        });
      }
    } catch (e) {
      console.error('feed error', s.name, e);
      continue;
    }
  }

  // dedupe by URL
  const uniqueByUrl = new Map<string, any>();
  for (const r of results) {
    if (!uniqueByUrl.has(r.url)) uniqueByUrl.set(r.url, r);
  }
  const unique = Array.from(uniqueByUrl.values());

  for (const row of unique) {
    await supa.from('articles').upsert({ ...row }, { onConflict: 'url' });
  }

  return unique;
}
