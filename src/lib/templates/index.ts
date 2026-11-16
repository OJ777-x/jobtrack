import { engineeringTemplate } from "./engineering";
import { plumbingTemplate } from "./plumbing";
import type { IndustryTemplate } from "./types";

export * from "./types";

// This array is the one place new niches get registered for seeding.
// See README.md "Adding a new industry template" for how to add one.
export const allTemplates: IndustryTemplate[] = [engineeringTemplate, plumbingTemplate];

export function getTemplateByKey(key: string): IndustryTemplate | undefined {
  return allTemplates.find((t) => t.key === key);
}
