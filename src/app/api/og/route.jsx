import { ImageResponse } from 'next/og';
import { getShowBySlug } from '@/lib/dataService';
import { formatEpisodeCode } from '@/lib/storyBookUtils';

// Node runtime (not Edge): show data lives in local seed JSON / generated cache read via fs.
export const runtime = 'nodejs';

const WIDTH = 1200;
const HEIGHT = 630;
const MAX_POSTER_BYTES = 4 * 1024 * 1024;

function toBoundedInt(value, max) {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, max) : null;
}

/**
 * Fetch the poster ourselves so a slow or broken image host can never fail the whole card.
 * Only JPEG/PNG are inlined (the formats satori decodes reliably); anything else falls back.
 */
async function loadPosterDataUri(url) {
  if (!url || !/^https:\/\//i.test(url)) return null;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'image/jpeg,image/png;q=0.9' },
      signal: AbortSignal.timeout(3500)
    });
    if (!res.ok) return null;
    const type = (res.headers.get('content-type') || '').split(';')[0].trim();
    if (type !== 'image/jpeg' && type !== 'image/png') return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength > MAX_POSTER_BYTES) return null;
    return `data:${type};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

function titleFontSize(title) {
  if (title.length > 40) return 52;
  if (title.length > 24) return 64;
  return 80;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = (searchParams.get('slug') || '').slice(0, 120);
  const season = toBoundedInt(searchParams.get('s'), 99);
  const episode = toBoundedInt(searchParams.get('e'), 2000);
  const isBookMode = searchParams.get('mode') === 'book';

  const show = slug ? await getShowBySlug(slug) : null;
  const title = show?.title || 'WhereWasI';
  const isMovie = show?.type === 'movie';
  const poster = await loadPosterDataUri(show?.posterUrl);

  const badge = isBookMode
    ? 'Full Story-Book • No Fillers'
    : season || episode
    ? isMovie
      ? `Recap up to Act ${Math.min(episode || 1, 3)}`
      : `Recap up to ${formatEpisodeCode(season || 1, episode || 1)}`
    : show
    ? 'Pick your episode • Catch up instantly'
    : 'Zero-Spoiler Catch-Up Engine';

  const metaLine = show
    ? [show.platform, ...(Array.isArray(show.genre) ? show.genre.slice(0, 2) : [])].filter(Boolean).join('  •  ')
    : 'TV Series  •  Anime  •  Movies';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: '#0b0f17',
          backgroundImage: 'linear-gradient(135deg, #0b0f17 0%, #111827 55%, #3f0d1c 100%)',
          color: '#f8fafc',
          fontFamily: 'sans-serif'
        }}
      >
        {/* Poster column */}
        <div
          style={{
            width: 420,
            height: '100%',
            display: 'flex',
            position: 'relative',
            backgroundImage: 'linear-gradient(160deg, #4c0519 0%, #111827 100%)'
          }}
        >
          {poster ? (
            <img
              src={poster}
              width={420}
              height={HEIGHT}
              style={{ width: 420, height: HEIGHT, objectFit: 'cover' }}
              alt=""
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 160,
                fontWeight: 800,
                color: 'rgba(251, 113, 133, 0.85)'
              }}
            >
              {title.charAt(0).toUpperCase()}
            </div>
          )}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 120,
              height: '100%',
              display: 'flex',
              backgroundImage: 'linear-gradient(90deg, rgba(11,15,23,0) 0%, rgba(11,15,23,1) 100%)'
            }}
          />
        </div>

        {/* Text column */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '56px 64px 52px 40px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f43f5e',
                fontSize: 26,
                fontWeight: 800,
                color: '#ffffff'
              }}
            >
              W
            </div>
            <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, letterSpacing: 1 }}>WhereWasI</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div
              style={{
                display: 'flex',
                alignSelf: 'flex-start',
                padding: '10px 22px',
                borderRadius: 999,
                backgroundColor: 'rgba(244, 63, 94, 0.18)',
                border: '2px solid rgba(244, 63, 94, 0.6)',
                color: '#fecdd3',
                fontSize: 30,
                fontWeight: 700
              }}
            >
              {badge}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: titleFontSize(title),
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: -1
              }}
            >
              {title.length > 60 ? `${title.slice(0, 59)}…` : title}
            </div>
            <div style={{ display: 'flex', fontSize: 26, color: '#94a3b8' }}>{metaLine}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 22px',
                borderRadius: 16,
                backgroundColor: 'rgba(16, 185, 129, 0.14)',
                border: '2px solid rgba(16, 185, 129, 0.55)',
                color: '#6ee7b7',
                fontSize: 26,
                fontWeight: 700
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  display: 'flex',
                  backgroundColor: '#10b981'
                }}
              />
              Zero Spoilers Guaranteed
            </div>
            <div style={{ display: 'flex', fontSize: 24, color: '#64748b' }}>wherewasi.vercel.app</div>
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
      }
    }
  );
}
