import { NextRequest, NextResponse } from 'next/server';
import { supaAdmin } from '../../../../../lib/db';
import { yesterdayRange, toYYYYMMDD } from '../../../../../lib/time';
import { DateTime } from 'luxon';

async function fetchDigestText() {
  const supa = supaAdmin();
  const day = toYYYYMMDD(yesterdayRange().start);
  const { data, error } = await supa
    .from('articles')
    .select('title, url, published_at, sources(name)')
    .eq('digest_date', day)
    .order('published_at', { ascending: false })
    .limit(30);
  if (error) throw error;

  const lines = (data || []).slice(0, 30).map((r: any, i: number) => {
    const idx = (i + 1).toString().padStart(2, '0');
    return `${idx} · ${r.title}\n${r.url}\n`;
  });
  return lines.join('\n');
}

async function sendTemplate(phone: string, dateStr: string, body: string) {
  const token = process.env.WHATSAPP_TOKEN!;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const template = process.env.WHATSAPP_TEMPLATE_NAME!;
  const lang = process.env.WHATSAPP_TEMPLATE_LANG || 'en_US';

  const payload = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: template,
      language: { code: lang },
      components: [
        { type: 'body', parameters: [
          { type: 'text', text: dateStr },
          { type: 'text', text: body.substring(0, 3500) }
        ]}
      ]
    }
  };

  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const j = await res.json();
  if (!res.ok) throw new Error('WA send failed: ' + JSON.stringify(j));
  return j;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  try {
    const supa = supaAdmin();
    const { data: subs } = await supa.from('subscribers').select('*').eq('is_active', true);
    const dateStr = DateTime.now().setZone(process.env.APP_TIMEZONE || 'Asia/Kolkata').minus({ days: 1 }).toFormat('dd LLL yyyy');
    const body = await fetchDigestText();

    const results: any[] = [];
    for (const s of subs || []) {
      try {
        const r = await sendTemplate(s.phone_e164, dateStr, body);
        results.push({ phone: s.phone_e164, ok: true, id: r.messages?.[0]?.id });
      } catch (e: any) {
        results.push({ phone: s.phone_e164, ok: false, error: String(e) });
      }
    }
    return NextResponse.json({ ok: true, sent: results });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
