import { defineCollection, z } from "astro:content";

const pages = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string()
  })
});

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    status: z.enum(["ongoing", "completed"]).default("ongoing"),
    startDate: z.string(),
    endDate: z.string().optional(),
    links: z
      .object({
        paper: z.string().url().optional(),
        code: z.string().url().optional(),
        website: z.string().url().optional()
      })
      .optional()
  })
});

export const collections = {
  pages,
  projects
};
