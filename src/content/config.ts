import { defineCollection, z } from "astro:content";

const home = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    items: z.array(z.string()).optional()
  })
});

const research = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional()
  })
});

export const collections = {
  home,
  research
};
