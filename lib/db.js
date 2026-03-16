const { neon } = require('@neondatabase/serverless');

let _sql;

function getDb() {
  if (!_sql) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error('Missing DATABASE_URL environment variable');
    _sql = neon(url);
  }
  return _sql;
}

module.exports = { getDb };
