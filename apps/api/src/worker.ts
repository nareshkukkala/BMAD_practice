require('dotenv').config({ path: '../../.env' });
import { randomUUID } from 'node:crypto';
import { pool } from './db';
import { demoPaymentOutcome } from './providers';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const stamp = () => new Date().toISOString();

async function expireSearches() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const rows = await client.query(
      "SELECT id, zone, data, version FROM entities WHERE kind='trip' AND status='Searching' AND data->>'paymentStatus'='Authorised' AND (data->>'searchDeadline')::timestamptz < now() FOR UPDATE SKIP LOCKED LIMIT 100",
    );
    for (const row of rows.rows) {
      const data = {
        ...row.data,
        version: Number(row.version) + 1,
        paymentStatus: row.data.paymentStatus === 'Authorised' ? 'Release requested' : row.data.paymentStatus,
        timeline: [...(row.data.timeline || []), { state: 'No driver found', at: stamp(), actor: 'system' }],
      };
      await client.query("UPDATE entities SET status='No driver found', data=$2, version=version+1, updated_at=now() WHERE id=$1", [row.id, data]);
      if (row.data.paymentStatus === 'Authorised') {
        await client.query(
          "INSERT INTO work_items(id,kind,aggregate_id,operation_key,data) VALUES($1,'release',$2,$3,$4) ON CONFLICT(operation_key) DO NOTHING",
          [randomUUID(), row.id, `release:${row.id}`, { amountMinor: 0, currency: row.data.currency }],
        );
      }
      await client.query(
        "INSERT INTO events(id,event_type,aggregate_id,zone,payload) VALUES($1,'dispatch_failed',$2,$3,'{}') ON CONFLICT DO NOTHING",
        [randomUUID(), row.id, row.zone],
      );
    }
    await client.query('COMMIT');
    return rows.rowCount || 0;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function runPayoutCadence() {
  const parsedCadence = Number(process.env.PAYOUT_CADENCE_SECONDS);
  const cadenceSeconds = Number.isFinite(parsedCadence) && parsedCadence >= 0 ? parsedCadence : 86400;
  const drivers = await pool.query(
    "SELECT DISTINCT owner_id FROM entities WHERE kind='earning' AND status='available' AND created_at <= now() - ($1::int * interval '1 second') LIMIT 100",
    [cadenceSeconds],
  );
  for (const row of drivers.rows) {
    const driverId = row.owner_id;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const earnings = await client.query(
        "SELECT id, data FROM entities WHERE kind='earning' AND owner_id=$1 AND status='available' AND created_at <= now() - ($2::int * interval '1 second') ORDER BY created_at FOR UPDATE",
        [driverId, cadenceSeconds],
      );
      if (!earnings.rowCount) {
        await client.query('COMMIT');
        continue;
      }
      const ids = earnings.rows.map((e: any) => e.id);
      const amount = earnings.rows.reduce((s: number, e: any) => s + Number(e.data.netMinor || 0), 0);
      const currency = process.env.PILOT_CURRENCY || 'INR';
      const key = `payout:${driverId}:${ids.join(',')}`;
      const inserted = await client.query(
        "INSERT INTO work_items(id,kind,aggregate_id,operation_key,data) VALUES($1,'payout',$2,$3,$4) ON CONFLICT(operation_key) DO UPDATE SET operation_key=EXCLUDED.operation_key RETURNING *",
        [randomUUID(), driverId, key, { amountMinor: amount, earningIds: ids, currency }],
      );
      const work = inserted.rows[0];
      if (['pending', 'unknown'].includes(work.status)) {
        await client.query(
          "UPDATE entities SET status='payout_pending' WHERE kind='earning' AND id=ANY($1::text[]) AND status='available'",
          [ids],
        );
      }
      const payoutData = { operationId: work.id, earningIds: ids, amountMinor: amount, currency, status: work.status, createdAt: work.created_at };
      await client.query(
        "INSERT INTO entities(id,kind,owner_id,status,data) VALUES($1,'payout',$2,$4,$3) ON CONFLICT(id) DO NOTHING",
        [`payout:${work.id}`, driverId, payoutData, work.status === 'failed' ? 'failed' : 'pending'],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('payout cadence failed for driver', driverId, error);
    } finally {
      client.release();
    }
  }
}

async function processOne() {
  const client = await pool.connect();
  let processingId: string | undefined;
  try {
    await client.query('BEGIN');
    const found = await client.query(
      "SELECT * FROM work_items WHERE status='pending' AND available_at<=now() ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1",
    );
    if (!found.rowCount) {
      await client.query('COMMIT');
      return false;
    }
    const work = found.rows[0];
    processingId = work.id;
    const outcome = demoPaymentOutcome(work.kind);
    if (outcome === 'unknown' || outcome === 'failed') {
      await client.query('UPDATE work_items SET status=$2, attempts=attempts+1, last_error=$3 WHERE id=$1', [
        work.id,
        outcome,
        outcome === 'unknown' ? 'Simulated uncertain provider response' : 'Simulated provider decline',
      ]);
      if (work.kind === 'capture' && outcome === 'failed') {
        await client.query("UPDATE entities SET data=jsonb_set(data,'{paymentStatus}','\"Failed\"'::jsonb) WHERE id=$1", [work.aggregate_id]);
      }
      if (work.kind === 'authorize' && outcome === 'failed') {
        const trip = await client.query("SELECT status,data FROM entities WHERE id=$1 FOR UPDATE", [work.aggregate_id]);
        if (trip.rowCount && ['Searching','Cancelled'].includes(trip.rows[0].status)) {
          const searching = trip.rows[0].status === 'Searching';
          const data = { ...trip.rows[0].data, paymentStatus: 'Failed', authorizationFailure: 'The demo payment authorization was declined.', timeline: searching ? [...(trip.rows[0].data.timeline || []), { state: 'Cancelled', at: stamp(), actor: 'payment-provider', reason: 'Authorization failed' }] : trip.rows[0].data.timeline };
          await client.query("UPDATE entities SET status='Cancelled',data=$2,version=version+1,updated_at=now() WHERE id=$1", [work.aggregate_id, data]);
        }
      }
      if (work.kind === 'release' && outcome === 'failed') {
        await client.query("UPDATE entities SET data=jsonb_set(data,'{paymentStatus}','\"Release failed\"'::jsonb) WHERE id=$1", [work.aggregate_id]);
      }
      if (work.kind === 'refund' && outcome === 'failed') {
        await client.query("UPDATE entities SET data=jsonb_set(data,'{paymentStatus}','\"Refund failed\"'::jsonb) WHERE id=$1", [work.aggregate_id]);
      }
      if (work.kind === 'payout' && outcome === 'failed') {
        await client.query(
          "INSERT INTO entities(id,kind,owner_id,status,data) VALUES($1,'payout',$2,'failed',$3) ON CONFLICT(id) DO UPDATE SET status='failed',data=EXCLUDED.data,updated_at=now()",
          [`payout:${work.id}`, work.aggregate_id, { operationId: work.id, earningIds: work.data.earningIds || [], amountMinor: work.data.amountMinor, currency: work.data.currency || process.env.PILOT_CURRENCY || 'INR', failedAt: stamp(), error: 'Demo transfer failed' }],
        );
        await client.query("UPDATE entities SET status='available' WHERE kind='earning' AND id=ANY($1::text[]) AND status='payout_pending'", [work.data.earningIds || []]);
      }
      await client.query('COMMIT');
      return true;
    }

    await client.query("UPDATE work_items SET status='paid', attempts=attempts+1 WHERE id=$1", [work.id]);
    if (work.kind === 'capture') {
      await client.query("UPDATE entities SET data=jsonb_set(jsonb_set(data,'{paymentStatus}','\"Paid\"'::jsonb),'{paymentCapturedAt}',to_jsonb(now())) WHERE id=$1", [work.aggregate_id]);
      const trip = await client.query('SELECT owner_id, zone, data FROM entities WHERE id=$1', [work.aggregate_id]);
      if (trip.rowCount && trip.rows[0].data.driverId) {
        const data = trip.rows[0].data;
        await client.query(
          "INSERT INTO entities(id,kind,owner_id,zone,status,data) VALUES($1,'earning',$2,$3,'available',$4) ON CONFLICT(id) DO NOTHING",
          [`earning:${work.aggregate_id}`, data.driverId, trip.rows[0].zone, {
            tripId: work.aggregate_id,
            grossMinor: data.finalMinor,
            feesMinor: 0,
            adjustmentMinor: 0,
            netMinor: data.finalMinor,
            currency: data.currency,
          }],
        );
      }
    }
    if (work.kind === 'authorize') {
      const trip = await client.query("SELECT status,data FROM entities WHERE id=$1 FOR UPDATE", [work.aggregate_id]);
      if (trip.rowCount && trip.rows[0].status === 'Searching') {
        const data = { ...trip.rows[0].data, paymentStatus: 'Authorised', searchDeadline: new Date(Date.now() + Number(process.env.DISPATCH_TIMEOUT_SECONDS || 45) * 1000).toISOString() };
        await client.query('UPDATE entities SET data=$2,updated_at=now() WHERE id=$1', [work.aggregate_id, data]);
      } else if (trip.rowCount && trip.rows[0].status === 'Cancelled') {
        const data = { ...trip.rows[0].data, paymentStatus: 'Release requested' };
        await client.query('UPDATE entities SET data=$2,updated_at=now() WHERE id=$1', [work.aggregate_id, data]);
        await client.query("INSERT INTO work_items(id,kind,aggregate_id,operation_key,data) VALUES($1,'release',$2,$3,$4) ON CONFLICT(operation_key) DO NOTHING", [randomUUID(), work.aggregate_id, `release:${work.aggregate_id}`, { amountMinor: 0, currency: data.currency }]);
      }
    }
    if (work.kind === 'refund') {
      const trip = await client.query('SELECT data FROM entities WHERE id=$1', [work.aggregate_id]);
      if (trip.rowCount) {
        const refunded = Number(trip.rows[0].data.refundedMinor || 0) + Number(work.data.amountMinor || 0);
        const isFull = refunded >= Number(trip.rows[0].data.finalMinor || 0);
        const updated = { ...trip.rows[0].data, refundedMinor: refunded, paymentStatus: isFull ? 'Refunded' : 'Partially refunded' };
        await client.query('UPDATE entities SET data=$2,updated_at=now() WHERE id=$1', [work.aggregate_id, updated]);
      }
    }
    if (work.kind === 'release') {
      await client.query("UPDATE entities SET data=jsonb_set(data,'{paymentStatus}','\"Released\"'::jsonb) WHERE id=$1", [work.aggregate_id]);
    }
    if (work.kind === 'payout') {
      const earningIds = work.data.earningIds || [];
      if (earningIds.length) {
        await client.query("UPDATE entities SET status='paid' WHERE kind='earning' AND id=ANY($1::text[])", [earningIds]);
      }
      await client.query(
        "INSERT INTO entities(id,kind,owner_id,status,data) VALUES($1,'payout',$2,'paid',$3) ON CONFLICT(id) DO UPDATE SET status='paid',data=EXCLUDED.data,updated_at=now()",
        [`payout:${work.id}`, work.aggregate_id, {
          operationId: work.id,
          earningIds,
          amountMinor: work.data.amountMinor,
          currency: work.data.currency || process.env.PILOT_CURRENCY || 'INR',
          paidAt: stamp(),
        }],
      );
    }
    await client.query(
      'INSERT INTO events(id,event_type,aggregate_id,payload) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',
      [randomUUID(), `${work.kind}_confirmed`, work.aggregate_id, { workId: work.id }],
    );
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    if (processingId) {
      await client.query(
        `UPDATE work_items
         SET attempts=attempts+1,
             status=CASE WHEN attempts+1>=8 THEN 'dead' ELSE 'pending' END,
             available_at=now()+make_interval(secs=>LEAST(300,(2^LEAST(attempts+1,8))::int)),
             last_error=$2
         WHERE id=$1 AND status='pending'`,
        [processingId, error instanceof Error ? error.message.slice(0,500) : 'Unknown worker error'],
      );
    }
    console.error('worker item failed', error);
    return false;
  } finally {
    client.release();
  }
}

async function main() {
  console.log('Ride worker started.');
  for (;;) {
    try {
      await expireSearches();
      await runPayoutCadence();
      if (!(await processOne())) await sleep(1500);
    } catch (error) {
      console.error('worker loop failed', error);
      await sleep(3000);
    }
  }
}

main();
