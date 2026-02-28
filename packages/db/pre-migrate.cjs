// Adds enum values that must be committed BEFORE drizzle-kit migrate runs,
// because PostgreSQL does not allow new enum values to be used in the
// same transaction where they were added (error 55P04).
const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.POSTGRES_URL });
  await client.connect();
  try {
    await client.query(
      "ALTER TYPE \"role\" ADD VALUE IF NOT EXISTS 'leader'"
    );
    console.log("pre-migrate: enum value 'leader' ensured");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  // If the type doesn't exist yet (first deploy), the setup migration will
  // create it. We can safely ignore the error and let drizzle-kit proceed.
  if (err.code === "42704") {
    console.log("pre-migrate: role type does not exist yet, skipping");
    process.exit(0);
  }
  console.error("pre-migrate error:", err);
  process.exit(1);
});
