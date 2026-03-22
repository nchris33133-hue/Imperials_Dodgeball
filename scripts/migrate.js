const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!databaseUrl) {
    console.error('Missing DATABASE_URL or POSTGRES_URL environment variable');
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  // Remove comment-only lines, then split by semicolons
  const cleaned = schema.replace(/^--.*$/gm, '');
  const statements = cleaned
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  let failed = 0;
  for (const statement of statements) {
    const preview = statement.replace(/\s+/g, ' ').substring(0, 70);
    try {
      await sql.query(statement);
      console.log('OK:', preview);
    } catch (err) {
      failed++;
      console.error('FAIL:', preview);
      console.error('  ', err.message);
    }
  }

  if (failed > 0) {
    console.error(`\nMigration finished with ${failed} error(s).`);
    process.exit(1);
  }
  console.log('\nMigration complete.');
}

migrate();
