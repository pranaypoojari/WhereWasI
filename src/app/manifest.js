// Served by Next.js at /manifest.webmanifest (a public/manifest.webmanifest file would collide with this route).
export default function manifest() {
  return {
    id: '/',
    name: 'WhereWasI — Zero-Spoiler Recap Engine',
    short_name: 'WhereWasI',
    description:
      'Forgot who died before the new season? Catch up on TV series, anime, and movies without spoilers — and read saved story-books offline.',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone'],
    orientation: 'portrait-primary',
    background_color: '#0b0f17',
    theme_color: '#0b0f17',
    categories: ['entertainment', 'books', 'lifestyle'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      }
    ],
    shortcuts: [
      {
        name: 'Browse shows',
        short_name: 'Browse',
        url: '/browse',
        icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }]
      },
      {
        name: 'Get a story guide',
        short_name: 'Story guide',
        url: '/generate',
        icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }]
      }
    ]
  };
}
