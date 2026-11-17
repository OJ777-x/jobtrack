import type { IndustryTemplate } from "./types";

const propertyFields: IndustryTemplate["config"]["jobTypes"][number]["customFields"] = [
  { key: "property_type", label: "Property type", type: "select", options: ["Domestic", "Commercial"], required: true },
  { key: "boiler_make_model", label: "Boiler make/model", type: "text" },
  { key: "gas_safe_cert_required", label: "Gas Safe certificate required", type: "boolean" },
];

export const plumbingTemplate: IndustryTemplate = {
  key: "plumbing_heating",
  name: "Plumbing & Heating",
  config: {
    labels: {
      job: "Job",
      jobs: "Jobs",
      customer: "Customer",
      customers: "Customers",
      worker: "Engineer",
      workers: "Engineers",
      manager: "Office Manager",
      enquiry: "Enquiry",
      enquiries: "Enquiries",
      quote: "Quote",
      site: "Site",
    },
    branding: {
      primaryColor: "#0891b2",
      secondaryColor: "#0f172a",
    },
    jobTypes: [
      {
        key: "emergency_callout",
        label: "Emergency call-out",
        stages: [
          { key: "reported", label: "Reported" },
          { key: "engineer_assigned", label: "Engineer assigned" },
          { key: "on_site", label: "On site" },
          { key: "resolved", label: "Resolved" },
          { key: "invoiced", label: "Invoiced" },
        ],
        customFields: propertyFields,
        defaultTasks: {
          reported: ["Confirm issue & address", "Assess urgency"],
          engineer_assigned: ["Notify engineer", "Give customer ETA"],
          on_site: ["Diagnose issue", "Carry out emergency fix"],
          resolved: ["Confirm issue resolved with customer", "Record parts used"],
          invoiced: ["Raise invoice", "Send invoice to customer"],
        },
      },
      {
        key: "boiler_install",
        label: "Boiler install",
        stages: [
          { key: "enquiry", label: "Enquiry" },
          { key: "survey_booked", label: "Survey booked" },
          { key: "quote_sent", label: "Quote sent" },
          { key: "quote_accepted", label: "Quote accepted" },
          { key: "parts_ordered", label: "Parts ordered" },
          { key: "install_booked", label: "Install booked" },
          { key: "installed", label: "Installed" },
          { key: "certificates_issued", label: "Certificates issued" },
          { key: "invoiced", label: "Invoiced" },
          { key: "paid", label: "Paid" },
        ],
        customFields: propertyFields,
        defaultTasks: {
          enquiry: ["Log enquiry details", "Book survey"],
          survey_booked: ["Carry out site survey", "Confirm boiler make/model"],
          quote_sent: ["Send quote to customer"],
          quote_accepted: ["Confirm customer PO/acceptance", "Schedule install"],
          parts_ordered: ["Order boiler & parts", "Check supplier ETA"],
          install_booked: ["Confirm install date with customer"],
          installed: ["Complete installation", "Test system"],
          certificates_issued: ["Issue Gas Safe certificate", "Issue benchmark/warranty paperwork"],
          invoiced: ["Raise invoice", "Send invoice to customer"],
          paid: ["Confirm payment received"],
        },
      },
      {
        key: "repair",
        label: "Repair",
        stages: [
          { key: "reported", label: "Reported" },
          { key: "booked", label: "Booked" },
          { key: "on_site", label: "On site" },
          { key: "parts_awaited", label: "Parts awaited" },
          { key: "completed", label: "Completed" },
          { key: "invoiced", label: "Invoiced" },
        ],
        customFields: propertyFields,
        defaultTasks: {
          reported: ["Log fault description"],
          booked: ["Confirm appointment with customer"],
          on_site: ["Diagnose fault", "Attempt repair"],
          parts_awaited: ["Order required part", "Update customer on ETA"],
          completed: ["Confirm repair complete", "Test system"],
          invoiced: ["Raise invoice", "Send invoice to customer"],
        },
      },
      {
        key: "service",
        label: "Service",
        stages: [
          { key: "booked", label: "Booked" },
          { key: "on_site", label: "On site" },
          { key: "completed", label: "Completed" },
          { key: "invoiced", label: "Invoiced" },
        ],
        customFields: propertyFields,
        defaultTasks: {
          booked: ["Confirm appointment with customer"],
          on_site: ["Carry out annual service", "Check for faults"],
          completed: ["Issue service record"],
          invoiced: ["Raise invoice", "Send invoice to customer"],
        },
      },
      {
        key: "bathroom_fit",
        label: "Bathroom fit",
        stages: [
          { key: "enquiry", label: "Enquiry" },
          { key: "survey_booked", label: "Survey booked" },
          { key: "quote_sent", label: "Quote sent" },
          { key: "quote_accepted", label: "Quote accepted" },
          { key: "materials_ordered", label: "Materials ordered" },
          { key: "install_booked", label: "Install booked" },
          { key: "in_progress", label: "In progress" },
          { key: "completed", label: "Completed" },
          { key: "invoiced", label: "Invoiced" },
          { key: "paid", label: "Paid" },
        ],
        customFields: [...propertyFields, { key: "fittings_spec", label: "Fittings specification", type: "text" }],
        defaultTasks: {
          enquiry: ["Log enquiry details", "Book survey"],
          survey_booked: ["Carry out site survey", "Take measurements"],
          quote_sent: ["Send quote to customer"],
          quote_accepted: ["Confirm customer PO/acceptance", "Schedule install"],
          materials_ordered: ["Order fittings & materials", "Check supplier ETA"],
          install_booked: ["Confirm install date with customer"],
          in_progress: ["Carry out installation", "Record daily progress"],
          completed: ["Final inspection with customer"],
          invoiced: ["Raise invoice", "Send invoice to customer"],
          paid: ["Confirm payment received"],
        },
      },
    ],
    aiTone: {
      style:
        "Warm, reassuring, plain UK English for homeowners. Avoid technical jargon; explain anything necessary in simple terms. Mention safety/certificates where relevant. Friendly but professional, no exclamation marks.",
      signOff: "Many thanks,\nThe Clearflow Plumbing & Heating team",
    },
    demoData: {
      orgName: "Clearflow Plumbing & Heating Ltd",
      staffCount: 10,
      staff: [
        { displayName: "Karen Ellis", role: "manager", email: "manager@clearflow.demo" },
        { displayName: "Tom Brennan", role: "worker", email: "worker@clearflow.demo" },
      ],
      customers: [
        { name: "Mrs. Patricia Allen", email: "p.allen@example.demo", phone: "0117 555 0201" },
        { name: "The Old Vicarage B&B", email: "bookings@oldvicarage.demo", phone: "01225 555 0202" },
        { name: "Riverside Housing Association", email: "maintenance@riverside.demo", phone: "0117 555 0203" },
      ],
    },
    demoScript: [
      {
        title: "1. Start as the Office Manager",
        detail:
          "Log in as Manager (Karen Ellis). Point out the dashboard: open jobs, value of open work, work-in-progress by stage — all real numbers, not mock-ups.",
      },
      {
        title: "2. Raise a real job, live",
        detail:
          "Go to Enquiries → New enquiry → pick \"Mrs. Patricia Allen\" and job type \"Boiler install\". Add a quote, mark it sent, mark it approved, then Convert to job — fill in property type and boiler make/model. Point out these fields are specific to plumbing; an engineering firm's version asks about equipment serial numbers instead.",
      },
      {
        title: "3. Show the job board",
        detail:
          "Open the Job board. Drag the new job into \"Survey booked\" — the checklist for that stage appears automatically, and the move is timestamped on the job's timeline. This is the whiteboard/wall-planner they're replacing.",
      },
      {
        title: "4. Switch to the engineer's phone view",
        detail:
          "Sign out, log in as Worker (Tom Brennan) — ideally on a phone or narrow browser window. Tap the job, tick off a task, then tap \"Flag a problem\" and type something short, e.g. a part that hasn't arrived.",
      },
      {
        title: "5. Show the manager sees it instantly",
        detail:
          "Sign back in as Manager — the job is now marked urgent on the Jobs list, and the flagged note is on its timeline. No phone call needed.",
      },
      {
        title: "6. Show the customer's view",
        detail:
          "Sign in as Customer. They see only their own job, a plain progress stepper, and any update you've chosen to share — never your internal notes or pricing. Reassuring for homeowners who keep chasing for updates.",
      },
      {
        title: "7. The AI features",
        detail:
          "Back as Manager, open the AI tab: Risk flags (jobs likely to run late, with a plain reason), Ask a question (\"what's waiting on parts?\"), Paste-in updates (paste a rough email from a customer, review what it proposes, confirm), and Customer progress updates (draft → you edit → you publish — never sent automatically, in a warm homeowner-friendly tone).",
      },
      {
        title: "8. The closer: this isn't plumbing-only software",
        detail:
          "Mention that every label, job type, stage and field you've just seen comes from one template file — the same app can be relabelled for engineering firms, electricians, or estate agents with zero code changes. Offer to show /admin switching it live to the Engineering demo if they want proof.",
      },
    ],
  },
};
