import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://ai-resume-ats-scanner.vercel.app'; // Update this to production URL if different

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/export/', '/dashboard/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
