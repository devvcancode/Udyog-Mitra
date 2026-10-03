import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/en',
    name: 'Udyog Mitra | Industry Portal Prototype',
    short_name: 'Udyog Mitra',
    description: 'A multilingual prototype for Maharashtra enterprise guidance and approvals.',
    start_url: '/en',
    scope: '/',
    display: 'standalone',
    background_color: '#f6f8f7',
    theme_color: '#0b315d',
    icons: [
      { src: '/udyog-mitra-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/udyog-mitra-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
    categories: ['business', 'productivity'],
  };
}