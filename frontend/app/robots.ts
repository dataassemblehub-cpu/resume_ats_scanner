import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://resume-ats-scanner.vercel.ai'; // Update this to production URL if different

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/export/', '/dashboard/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
