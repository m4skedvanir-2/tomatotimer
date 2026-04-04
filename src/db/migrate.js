const pool = require('./index');
const fs = require('fs');
const path = require('path');

async function migrate() {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(sql);
    console.log('Complete migration!');
    await pool.end();
}

migrate().catch(console.error);