import { supaAdmin } from '../lib/db';
import { yesterdayRange, toYYYYMMDD } from '../lib/time';
import { DateTime } from 'luxon';

async function getRows() {
  const supa = supaAdmin();
  const day = toYYYYMMDD(yesterdayRange().start);
  const { data, error } = await supa
    .from('articles')
    .select('title, url, published_at, sources(name)')
    .eq('digest_date', day)
    .order('published_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return data || [];
}

function Card({ idx, title, url, source, time }: any) {
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        border: '1px solid #eee', borderRadius: 16, padding: 16,
        display: 'flex', flexDirection: 'column', gap: 8, height: '100%',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
      }}>
        <div style={{ fontSize: 12, color: '#666' }}>{String(idx).padStart(2, '0')} · {source} · {time}</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 13, color: '#666' }}>{new URL(url).hostname}</div>
      </div>
    </a>
  );
}

export default async function Page() {
  const rows = await getRows();
  const zone = process.env.APP_TIMEZONE || 'Asia/Kolkata';
  const y = DateTime.now().setZone(zone).minus({ days: 1 }).toFormat('ccc, dd LLL yyyy');

  return (
    <main style={{ maxWidth: 1100, margin: '32px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>AI Daily Digest</h1>
      <div style={{ color: '#666', marginBottom: 24 }}>Yesterday's picks · {y} · Timezone: {zone}</div>
      {rows.length === 0 ? (
        <div style={{ padding: 16, border: '1px dashed #ccc', borderRadius: 12 }}>
          No items yet. The daily job may not have run. Trigger <code>/api/refresh?token=CRON_SECRET</code> to fetch.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16
        }}>
          {rows.map((r: any, i: number) => (
            <Card
              key={i}
              idx={i + 1}
              title={r.title}
              url={r.url}
              source={r.sources?.name || 'Unknown'}
              time={new Date(r.published_at).toLocaleTimeString()}
            />
          ))}
        </div>
      )}
    </main>
  );
}
