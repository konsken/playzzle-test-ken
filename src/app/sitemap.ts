'use server';

import { getCategories } from '@/app/puzzles/actions';
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002';

  // Get all puzzle categories to generate dynamic URLs
  const categories = await getCategories();
  const categoryUrls = categories.map((category) => ({
    url: `${siteUrl}/category/${category.name}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Define the main static pages of your site
  const staticPages = [
    '/',
    '/puzzles',
    '/membership',
    '/contact',
    '/login',
    '/signup',
    '/terms-of-service',
    '/privacy-policy',
    '/refund-policy',
    '/shipping-policy',
  ];

  const staticUrls = staticPages.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: path === '/' ? 1 : 0.9,
  }));

  return [...staticUrls, ...categoryUrls];
}
