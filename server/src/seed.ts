import { hashPassword } from "./auth.js";
import { config } from "./config.js";
import { bootstrapDatabase } from "./db.js";

async function main() {
  const passwordHash = await hashPassword(config.adminPassword);
  bootstrapDatabase(config.adminEmail.toLowerCase(), passwordHash);
  console.log("Database initialized.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
