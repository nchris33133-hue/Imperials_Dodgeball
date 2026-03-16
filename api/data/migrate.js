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

  // Split by semicolons and run each statement
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      await sql.query(statement);
      console.log('OK:', statement.substring(0, 60) + '...');
    } catch (err) {
      console.error('FAIL:', statement.substring(0, 60) + '...');
      console.error(err.message);
      process.exit(1);
    }
  }

  console.log('\nMigration complete.');
}

migrate();
