import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Planning Bac',
    short_name: 'Planning Bac',
    description: 'Organisation simple des revisions du baccalaureat.',
    start_url: '/accueil',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f6efe5',
    theme_color: '#f6efe5',
    lang: 'fr-FR',
    categories: ['education', 'productivity'],
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
