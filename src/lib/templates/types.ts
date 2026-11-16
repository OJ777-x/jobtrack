// Shape of an industry template's `config` column (see supabase/schema.sql).
// This is the ONE place that defines everything niche-specific. The app reads
// these types at runtime instead of ever hard-coding a word, stage or field.

export type CustomFieldType = "text" | "number" | "date" | "boolean" | "select";

export type CustomFieldDef = {
  key: string;
  label: string;
  type: CustomFieldType;
  options?: string[]; // only for type: "select"
  required?: boolean;
};

export type StageDef = {
  key: string;
  label: string;
};

export type JobTypeDef = {
  key: string;
  label: string;
  stages: StageDef[];
  customFields: CustomFieldDef[];
  // Default checklist titles seeded onto a job when it enters each stage.
  defaultTasks: Record<string, string[]>; // stage key -> list of task titles
};

export type TemplateLabels = {
  job: string;
  jobs: string;
  customer: string;
  customers: string;
  worker: string;
  workers: string;
  manager: string;
  enquiry: string;
  enquiries: string;
  quote: string;
  site: string;
};

export type DemoStaff = {
  displayName: string;
  role: "manager" | "worker";
  email: string;
};

export type DemoCustomer = {
  name: string;
  email: string;
  phone: string;
};

export type DemoData = {
  orgName: string;
  staffCount: number; // for display only, e.g. "30 staff" — not all are seeded as logins
  staff: DemoStaff[]; // logins actually created for the demo
  customers: DemoCustomer[];
};

export type AiTone = {
  // Plain-English style guidance dropped into AI prompts so updates sound
  // right for this niche — never hard-coded to engineering elsewhere.
  style: string;
  signOff: string;
};

export type TemplateConfig = {
  labels: TemplateLabels;
  branding: {
    primaryColor: string;
    secondaryColor: string;
  };
  jobTypes: JobTypeDef[];
  aiTone: AiTone;
  demoData: DemoData;
};

export type IndustryTemplate = {
  key: string;
  name: string;
  config: TemplateConfig;
};
