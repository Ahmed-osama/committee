import { defineCollection, z } from 'astro:content';

const architecture = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    order: z.number(),
  }),
});

const journal = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.enum(['js', 'frontend', 'ai', 'node', 'testing', 'architecture'])),
    entryId: z.string(),
  }),
});

export const collections = { architecture, journal };
