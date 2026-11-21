import { All, Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard, allow, principal } from './auth';
import { Marketplace } from './service';
import { pool } from './db';
import { fail } from './errors';
import { driverIsEligible } from './driver-eligibility';
const service=new Marketplace();
@Controller('api') export class ApiController {
 @Post('auth/demo') async auth(@Body() body:any){return service.authDemo(body)}
 @Post(':domain/:action') async command(@Param('action') action:string,@Body() body:any,@Req() req:Request){return service.command(action,principal(req),body||{})}
 @Get('shared/:token') async shared(@Param('token') token:string){const r=await pool.query("SELECT data FROM entities WHERE kind='share' AND status='active' AND data->>'token'=$1",[token]);if(!r.rowCount||Date.parse(r.rows[0].data.expiresAt)<Date.now())return {status:'Tracking ended'};const tid=r.rows[0].data.tripId;const t=await pool.query("SELECT status,data FROM entities WHERE kind='trip' AND id=$1",[tid]);if(!t.rowCount||['Completed','Cancelled','No driver found'].includes(t.rows[0].status))return {status:'Tracking ended'};const loc=await pool.query('SELECT lat,lng,received_at FROM locations WHERE assignment_id=$1 AND epoch=$2',[tid,t.rows[0].data.trackingEpoch]);const age=loc.rowCount?Math.max(0,Math.floor((Date.now()-Date.parse(loc.rows[0].received_at))/1000)):null;return {tripId:tid,status:t.rows[0].status,pickup:t.rows[0].data.pickup,destination:t.rows[0].data.destination,driverLocation:loc.rowCount?{lat:loc.rows[0].lat,lng:loc.rows[0].lng,ageSeconds:age,stale:(age||0)>30}:null,expiresAt:r.rows[0].data.expiresAt}}
 @Get('health') health(){return {status:'ok',time:new Date().toISOString()}}
 @Get('offers') async offers(@Req() req:Request){
  const actor=principal(req);allow(actor,'driver');
  const availability=await pool.query("SELECT status,data,zone FROM entities WHERE kind='availability' AND owner_id=$1 ORDER BY updated_at DESC LIMIT 1",[actor.id]);
  if(!availability.rowCount||availability.rows[0].status!=='online'||!availability.rows[0].data.available)return [];
  const eligible=await pool.query("SELECT status,data FROM entities WHERE kind='driver' AND owner_id=$1 ORDER BY created_at DESC LIMIT 1",[actor.id]);
  if(!eligible.rowCount||!driverIsEligible(eligible.rows[0].status,eligible.rows[0].data))return [];
  await pool.query("UPDATE entities SET status='expired' WHERE kind='offer' AND owner_id=$1 AND status='live' AND (data->>'expiresAt')::timestamptz<=now()",[actor.id]);
  const trips=await pool.query("SELECT * FROM entities WHERE kind='trip' AND status='Searching' AND data->>'paymentStatus'='Authorised' AND zone=$1 ORDER BY COALESCE((data->>'etaMinutes')::int,999),created_at LIMIT 30",[availability.rows[0].zone]);
  const offers=[];
  for(const trip of trips.rows){
   let offer=await pool.query("SELECT id,data FROM entities WHERE kind='offer' AND owner_id=$1 AND status='live' AND data->>'tripId'=$2 ORDER BY created_at DESC LIMIT 1",[actor.id,trip.id]);
   if(!offer.rowCount){
    const detail={tripId:trip.id,driverId:actor.id,expiresAt:new Date(Date.now()+30000).toISOString(),etaMinutes:trip.data.etaMinutes||4};
    const inserted=await pool.query("INSERT INTO entities(id,kind,owner_id,zone,status,data) VALUES(gen_random_uuid()::text,'offer',$1,$2,'live',$3) ON CONFLICT DO NOTHING RETURNING id,data",[actor.id,trip.zone,detail]);
    offer=inserted.rowCount?inserted:await pool.query("SELECT id,data FROM entities WHERE kind='offer' AND owner_id=$1 AND status='live' AND data->>'tripId'=$2 ORDER BY created_at DESC LIMIT 1",[actor.id,trip.id]);
    if(inserted.rowCount)await pool.query("INSERT INTO events(id,event_type,aggregate_id,zone,payload) VALUES(gen_random_uuid()::text,'driver_offer_created',$1,$2,$3) ON CONFLICT DO NOTHING",[trip.id,trip.zone,{offerId:inserted.rows[0].id,driverId:actor.id}]);
   }
   if(offer.rowCount&&Date.parse(offer.rows[0].data.expiresAt)>Date.now())offers.push({...trip.data,id:trip.id,status:trip.status,version:trip.version,offerExpiresAt:offer.rows[0].data.expiresAt,etaMinutes:offer.rows[0].data.etaMinutes});
  }
  return offers;
 }
 @Get('reports/:name') async report(@Param('name') name:string,@Query('zone') zone:string,@Req() req:Request){const a=principal(req);if(name==='pilot'){allow(a,'ops','analyst');return service.command('event',a,{zone});}if(name==='queue'){allow(a,'ops','responder');const sql=a.role==='responder'?"SELECT id,owner_id,status,zone,data,created_at FROM entities WHERE kind='case' AND data->>'urgent'='true' AND data->>'queueStatus'='awaiting_response' ORDER BY created_at DESC LIMIT 100":"SELECT id,owner_id,status,zone,data,created_at FROM entities WHERE kind='case' ORDER BY created_at DESC LIMIT 100";const r=await pool.query(sql);return r.rows.map((x:any)=>({...x.data,id:x.id,status:x.status,zone:x.zone,createdAt:x.created_at}));}if(name==='audit'){allow(a,'ops');const r=await pool.query('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100');return r.rows;}if(name==='reconciliation'){allow(a,'ops');return service.command('reconcile',a,{});}fail(404,'REPORT_NOT_FOUND','Report not found.')}
 @Get(':kind/:id') async one(@Param('kind') kind:string,@Param('id') id:string,@Req() req:Request){
  const actor=principal(req);
  if(kind==='document'){
   allow(actor,'ops');
   const row=await pool.query("SELECT * FROM entities WHERE id=$1 AND kind='driver'",[id]);
   if(!row.rowCount)fail(404,'NOT_FOUND','Document not found.');
   return row.rows[0].data.documents;
  }
  const result=await service.get(kind,actor,{id});
  if(!result.length)fail(404,'NOT_FOUND','Record not found.');
  const item=result[0];
  if(kind==='trip'&&item.driverId){
   const driver=await pool.query("SELECT data FROM entities WHERE kind='driver' AND owner_id=$1 ORDER BY created_at DESC LIMIT 1",[item.driverId]);
   if(driver.rowCount)item.driver={name:driver.rows[0].data.name||'Ravi',photoUrl:driver.rows[0].data.photoUrl||'',plate:driver.rows[0].data.vehicle?.plate||'AB 1234'};
  }
  if(kind==='trip'&&['Assigned','Driver arrived','In progress'].includes(item.status)){
   const loc=await pool.query('SELECT lat,lng,received_at FROM locations WHERE assignment_id=$1 AND epoch=$2',[id,item.trackingEpoch]);
   if(loc.rowCount){const age=Math.max(0,Math.floor((Date.now()-Date.parse(loc.rows[0].received_at))/1000));item.location={lat:loc.rows[0].lat,lng:loc.rows[0].lng,receivedAt:loc.rows[0].received_at,stale:age>30,ageSeconds:age};}
  }
  return item;
 }
 @Get(':kind') async list(@Param('kind') kind:string,@Query() query:any,@Req() req:Request){const a=principal(req);if(kind==='offers'){allow(a,'driver');const r=await pool.query("SELECT * FROM entities WHERE kind='trip' AND status='Searching' AND data->>'paymentStatus'='Authorised' ORDER BY created_at");return r.rows.map((x:any)=>({...x.data,id:x.id,status:x.status,version:x.version}));}if(kind==='zones'){allow(a,'ops');const r=await pool.query("SELECT * FROM entities WHERE kind='zone'");return r.rows.map((x:any)=>({...x.data,id:x.id,status:x.status}));}if(kind==='work'){allow(a,'ops');const r=await pool.query('SELECT * FROM work_items ORDER BY created_at DESC LIMIT 100');return r.rows;}if(kind==='audit'){allow(a,'ops');const r=await pool.query('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100');return r.rows;}return service.get(kind,a,query)}
}
export const guards=[AuthGuard];
