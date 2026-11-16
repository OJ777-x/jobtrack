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
  },
};
