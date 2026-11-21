import { Pool, PoolClient, QueryResultRow } from 'pg';
// Load project configuration before constructing the pool. Workspace scripts run
// with apps/api as cwd, so ../../.env resolves to the repository root.
require('dotenv').config({ path: process.env.ENV_FILE || '../../.env' });
export const pool=new Pool({connectionString:process.env.DATABASE_URL||'postgres://ride:ride@localhost:5432/ride_hailing'});
export async function transaction<T>(fn:(client:PoolClient)=>Promise<T>):Promise<T>{const client=await pool.connect();try{await client.query('BEGIN');await client.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');await client.query('SELECT pg_advisory_xact_lock(7132841)');const value=await fn(client);await client.query('COMMIT');return value}catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}}
export async function entity<T extends QueryResultRow=any>(id:string,client:any=pool):Promise<T|null>{const r=await client.query('SELECT * FROM entities WHERE id=$1',[id]);return r.rows[0]||null}
