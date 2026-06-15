import { defineCollection, z } from 'astro:content';

const tutorials = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    toolId: z.string(),
    category: z.string(),
    description: z.string(),
    keywords: z.array(z.string()),
    author: z.string().default('开发工具箱'),
    date: z.date(),
    updated: z.date().optional(),
    phase: z.number().min(1).max(3).default(1),
    relatedTools: z.array(z.string()).optional(),
    relatedTutorials: z.array(z.string()).optional(),
  }),
});

export const collections = { tutorials };
