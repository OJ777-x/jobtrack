import { config } from "dotenv";
config({ path: ".env.local" });

import { seedDemoOrganisation } from "../src/lib/seed-demo";
import { DEMO_PASSWORD, DEMO_ACCOUNTS } from "../src/lib/demo-accounts";

const templateKey = process.argv[2] || "engineering";

seedDemoOrganisation(templateKey)
  .then(({ log }) => {
    log.forEach((line) => console.log(line));
    console.log("\nDemo logins (same password for all):");
    console.log(`  Manager:  ${DEMO_ACCOUNTS.manager}`);
    console.log(`  Worker:   ${DEMO_ACCOUNTS.worker}`);
    console.log(`  Customer: ${DEMO_ACCOUNTS.customer}`);
    console.log(`  Password: ${DEMO_PASSWORD}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
