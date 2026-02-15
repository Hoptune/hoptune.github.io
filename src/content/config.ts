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

const researchTabs = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    order: z.number().optional()
  })
});

const researchProjects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    category: z.string(),
    summary: z.string().optional(),
    figure: z.string().optional(),
    figureAlt: z.string().optional(),
    figureCaption: z.string().optional(),
    figureMaxWidth: z.string().optional(),
    order: z.number().optional()
  })
});

export const collections = {
  home,
  research,
  researchTabs,
  researchProjects
};
