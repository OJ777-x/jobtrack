import type { IndustryTemplate } from "./types";

const repairOverhaulStages = [
  { key: "received", label: "Received" },
  { key: "inspection", label: "Inspection" },
  { key: "quote_approved", label: "Quote approved" },
  { key: "awaiting_parts", label: "Awaiting parts" },
  { key: "in_work", label: "In work" },
  { key: "testing", label: "Testing" },
  { key: "qa_sign_off", label: "QA sign-off" },
  { key: "ready_to_dispatch", label: "Ready to dispatch" },
  { key: "dispatched", label: "Dispatched" },
  { key: "invoiced", label: "Invoiced" },
];

const repairOverhaulTasks: Record<string, string[]> = {
  received: ["Log equipment condition on arrival", "Take arrival photos", "Confirm customer PO number"],
  inspection: ["Full strip & inspect", "Identify parts required", "Raise quote"],
  quote_approved: ["Confirm customer PO received", "Order required parts"],
  awaiting_parts: ["Check supplier ETA", "Update customer if delayed"],
  in_work: ["Carry out repair/overhaul", "Record work done in notes"],
  testing: ["Run test to spec", "Record test results"],
  qa_sign_off: ["QA inspection", "Sign off quality certificate"],
  ready_to_dispatch: ["Clean & pack equipment", "Prepare delivery note"],
  dispatched: ["Confirm courier/collection", "Notify customer of dispatch"],
  invoiced: ["Raise invoice", "Send invoice to customer"],
};

const equipmentFields: IndustryTemplate["config"]["jobTypes"][number]["customFields"] = [
  { key: "equipment_type", label: "Equipment type", type: "select", options: ["Pump", "Motor", "Fan", "Gearbox", "Other"], required: true },
  { key: "serial_number", label: "Equipment serial number", type: "text", required: true },
  { key: "manufacturer", label: "Manufacturer", type: "text" },
  { key: "condition_on_arrival", label: "Condition on arrival", type: "text" },
];

export const engineeringTemplate: IndustryTemplate = {
  key: "engineering",
  name: "Engineering",
  config: {
    labels: {
      job: "Job",
      jobs: "Jobs",
      customer: "Customer",
      customers: "Customers",
      worker: "Engineer",
      workers: "Engineers",
      manager: "Workshop Manager",
      enquiry: "Enquiry",
      enquiries: "Enquiries",
      quote: "Quote",
      site: "Site",
    },
    branding: {
      primaryColor: "#2563eb",
      secondaryColor: "#1e293b",
    },
    jobTypes: [
      {
        key: "repair",
        label: "Repair",
        stages: repairOverhaulStages,
        customFields: equipmentFields,
        defaultTasks: repairOverhaulTasks,
      },
      {
        key: "overhaul",
        label: "Overhaul",
        stages: repairOverhaulStages,
        customFields: equipmentFields,
        defaultTasks: repairOverhaulTasks,
      },
      {
        key: "fabrication",
        label: "Fabrication",
        stages: [
          { key: "enquiry_received", label: "Enquiry received" },
          { key: "drawing_approved", label: "Drawing approved" },
          { key: "materials_ordered", label: "Materials ordered" },
          { key: "in_fabrication", label: "In fabrication" },
          { key: "welding_assembly", label: "Welding & assembly" },
          { key: "qa_inspection", label: "QA inspection" },
          { key: "ready_to_dispatch", label: "Ready to dispatch" },
          { key: "dispatched", label: "Dispatched" },
          { key: "invoiced", label: "Invoiced" },
        ],
        customFields: [
          { key: "drawing_reference", label: "Drawing reference", type: "text" },
          { key: "material_spec", label: "Material specification", type: "text" },
          { key: "quantity", label: "Quantity", type: "number" },
        ],
        defaultTasks: {
          enquiry_received: ["Log enquiry details", "Request drawings if not supplied"],
          drawing_approved: ["Confirm drawing sign-off", "Raise quote"],
          materials_ordered: ["Order materials", "Check supplier ETA"],
          in_fabrication: ["Cut & prepare materials", "Record progress in notes"],
          welding_assembly: ["Complete welding/assembly", "Visual inspection"],
          qa_inspection: ["QA inspection", "Sign off quality certificate"],
          ready_to_dispatch: ["Clean & pack", "Prepare delivery note"],
          dispatched: ["Confirm courier/collection", "Notify customer of dispatch"],
          invoiced: ["Raise invoice", "Send invoice to customer"],
        },
      },
    ],
    aiTone: {
      style:
        "Plain, factual UK English. Keep it concise and technical where useful (equipment type, serial number). No marketing language, no exclamation marks. State facts and next steps clearly.",
      signOff: "Kind regards,\nThe Northfield Engineering team",
    },
    demoData: {
      orgName: "Northfield Engineering Services Ltd",
      staffCount: 30,
      staff: [
        { displayName: "Sarah Hughes", role: "manager", email: "manager@northfield.demo" },
        { displayName: "Dave Patterson", role: "worker", email: "worker@northfield.demo" },
      ],
      customers: [
        { name: "Severn Trent Pumping Station", email: "contact@severntrent.demo", phone: "01902 555 0101" },
        { name: "Acme Fabrication Ltd", email: "accounts@acmefab.demo", phone: "0121 555 0102" },
        { name: "Midlands Water Treatment", email: "ops@midlandswater.demo", phone: "01743 555 0103" },
      ],
    },
    demoScript: [
      {
        title: "1. Start as the Workshop Manager",
        detail:
          "Log in as Manager (Sarah Hughes). Point out the dashboard: open jobs, value of open work, work-in-progress by stage — all real numbers, not mock-ups.",
      },
      {
        title: "2. Raise a real job, live",
        detail:
          "Go to Enquiries → New enquiry → pick \"Severn Trent Pumping Station\" and job type \"Repair\". Add a quote, mark it sent, mark it approved, then Convert to job — fill in equipment type, serial number. Point out these fields are specific to engineering; a plumber's version asks about boiler make/model instead.",
      },
      {
        title: "3. Show the job board",
        detail:
          "Open the Job board. Drag the new job into \"Inspection\" — the checklist for that stage appears automatically, and the move is timestamped on the job's timeline. This is the whiteboard they're replacing.",
      },
      {
        title: "4. Switch to the engineer's phone view",
        detail:
          "Sign out, log in as Worker (Dave Patterson) — ideally on a phone or narrow browser window. Tap the job, tick off a task, then tap \"Flag a problem\" and type something short. ",
      },
      {
        title: "5. Show the manager sees it instantly",
        detail:
          "Sign back in as Manager — the job is now marked urgent on the Jobs list, and the flagged note is on its timeline. No phone call needed.",
      },
      {
        title: "6. Show the customer's view",
        detail:
          "Sign in as Customer. They see only their own job, a plain progress stepper, and any update you've chosen to share — never your internal notes or pricing.",
      },
      {
        title: "7. The AI features",
        detail:
          "Back as Manager, open the AI tab: Risk flags (jobs likely to run late, with a plain reason), Ask a question (\"what's waiting on parts?\"), Paste-in updates (paste a rough email, review what it proposes, confirm), and Customer progress updates (draft → you edit → you publish — never sent automatically).",
      },
      {
        title: "8. The closer: this isn't engineering-only software",
        detail:
          "Mention that every label, job type, stage and field you've just seen comes from one template file — the same app can be relabelled for plumbers, electricians, or estate agents with zero code changes. Offer to show /admin switching it live to the Plumbing & Heating demo if they want proof.",
      },
    ],
  },
};
