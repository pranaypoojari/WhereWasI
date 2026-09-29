export default function manifest() {
  return {
    name: 'WhereWasI — Zero-Spoiler Recap Engine',
    short_name: 'WhereWasI',
    description:
      'Forgot who died before the new season? Catch up on TV series, anime, and movies without spoilers.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#f43f5e',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
