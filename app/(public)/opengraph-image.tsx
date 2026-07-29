import { ImageResponse } from 'next/og'
import { getProfile } from '@/lib/content'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Hadi Ghaddar — portfolio'

const BOND = '#f6f7f5'
const INK = '#1c2024'
const REDLINE = '#d93a2b'
const SLATE = '#5b6572'
const LINE = '#cbd0cb'

/** Social card drawn as a sheet: border, title block, redline accent. */
export default async function OpengraphImage() {
  let name = 'Portfolio'
  let headline = ''
  let location = ''
  try {
    const p = await getProfile()
    name = p?.full_name ?? name
    headline = p?.headline ?? ''
    location = p?.location ?? ''
  } catch {
    /* build-time without a database: fall back to defaults */
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: BOND,
          padding: 36,
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: `2px solid ${INK}`,
            padding: 44,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 3, background: REDLINE }} />
            <div
              style={{
                fontSize: 20,
                letterSpacing: 6,
                color: REDLINE,
                textTransform: 'uppercase',
              }}
            >
              {location || 'Portfolio'}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 92,
                fontWeight: 900,
                letterSpacing: -2,
                color: INK,
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              {name}
            </div>
            {headline ? (
              <div style={{ marginTop: 20, fontSize: 30, color: SLATE, maxWidth: 900 }}>
                {headline}
              </div>
            ) : null}
          </div>

          {/* title block strip */}
          <div style={{ display: 'flex', borderTop: `1px solid ${LINE}`, paddingTop: 16 }}>
            {[
              ['Discipline', 'Utility Distribution · Software'],
              ['Scale', '1:1'],
              ['Rev', 'A'],
              ['Sheet', '1 / 1'],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  marginRight: 56,
                }}
              >
                <div style={{ fontSize: 14, letterSpacing: 3, color: SLATE, textTransform: 'uppercase' }}>
                  {label}
                </div>
                <div style={{ fontSize: 20, color: INK, marginTop: 4 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
