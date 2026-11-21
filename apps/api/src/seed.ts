require('dotenv').config({ path: '../../.env' });
import { pool } from './db';

async function main() {
  const zone = process.env.PILOT_ZONE || 'central';
  await pool.query(
    "INSERT INTO entities(id,kind,owner_id,zone,status,data) VALUES($1,'driver',$2,$3,'approved',$4) ON CONFLICT(id) DO NOTHING",
    ['driver-ravi', 'driver-ravi', zone, {
      name: 'Ravi',
      documents: { identity: { status: 'approved' }, vehicle: { status: 'approved' }, license: { status: 'approved' } },
      vehicle: { make: 'Honda', model: 'City', plate: 'MH 12 AB 1234', color: 'White' },
      photoUrl: '',
    }],
  );
  await pool.query(
    "INSERT INTO entities(id,kind,owner_id,zone,status,data) VALUES($1,'availability',$2,$3,'offline',$4) ON CONFLICT(id) DO NOTHING",
    ['availability:driver-ravi', 'driver-ravi', zone, { online: false, available: false }],
  );
  console.log('Seeded demo driver Ravi. Demo verification code: 424242.');
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
