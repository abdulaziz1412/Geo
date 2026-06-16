// scripts/test-audit.ts
// Quick pipeline test. Run from the project root:
//   npx tsx --env-file=.env.local scripts/test-audit.ts
import { runAudit } from "../lib/geo/runAudit";

const projectId = process.argv[2] ?? "<project-id>";
runAudit(projectId).then(console.log).catch(console.error);
