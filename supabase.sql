create table if not exists sources (
  id serial primary key,
  name text not null,
  rss_url text not null,
  is_active boolean default true
);

insert into sources (name, rss_url) values
  ('TechCrunch AI', 'https://techcrunch.com/tag/artificial-intelligence/feed/'),
  ('MIT Technology Review', 'https://www.technologyreview.com/feed/'),
  ('VentureBeat AI', 'https://venturebeat.com/category/ai/feed/')
  on conflict do nothing;

create table if not exists articles (
  id bigserial primary key,
  source_id int references sources(id) on delete cascade,
  title text not null,
  url text not null,
  published_at timestamptz not null,
  summary text,
  digest_date date not null,
  unique (url)
);

create index if not exists idx_articles_digest_date on articles(digest_date);

create table if not exists subscribers (
  id bigserial primary key,
  phone_e164 text not null unique,
  is_active boolean default true,
  created_at timestamptz default now()
);
