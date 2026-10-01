import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Factumation',
    short_name: 'Factumation',
    description: 'Créez et gérez vos factures et devis.',
    start_url: '/fr',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#101b30',
    orientation: 'any',
    icons: [
      {
        src: '/brand/factumation-symbol.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      { src: '/icons/maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
