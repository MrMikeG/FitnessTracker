import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pulse Training',
    short_name: 'Pulse',
    description: 'Your strength and half-marathon training plan.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f7f3',
    theme_color: '#121212',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }]
  }
}
