import { ImageResponse } from 'next/og';

// Twitter uses the same 1200×630 surface as OpenGraph. Reuse the OG image
// design so social previews stay consistent.

export const alt = 'SkillGig.id — Belajar skill digital & cari freelance di Indonesia';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background:
            'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #d946ef 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              fontWeight: 800,
            }}
          >
            S
          </div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>SkillGig.id</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.05,
              maxWidth: 1000,
            }}
          >
            <div>Belajar skill digital,</div>
            <div>raup cuan dari karya kamu.</div>
          </div>
          <div style={{ fontSize: 28, opacity: 0.92, maxWidth: 900 }}>
            Platform Indonesia untuk belajar, membangun portofolio, dan
            menemukan peluang freelance.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 16,
            fontSize: 22,
            opacity: 0.9,
          }}
        >
          <span>📚 Learn</span>
          <span>🛠️ Build</span>
          <span>🔍 Discover</span>
          <span>✉️ Apply</span>
          <span>💰 Earn</span>
        </div>
      </div>
    ),
    size,
  );
}