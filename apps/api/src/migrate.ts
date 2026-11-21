require('dotenv').config({ path: '../../.env' });
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';
async function main(){const pool=new Pool({connectionString:process.env.DATABASE_URL});try{await pool.query(readFileSync(join(__dirname,'migrations/001-initial.sql'),'utf8'));console.log('Database schema is current.')}finally{await pool.end();}}
main().catch(e=>{console.error(e);process.exit(1)});
