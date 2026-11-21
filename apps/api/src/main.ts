require('dotenv').config({ path: '../../.env' });
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Module, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ApiController, guards } from './controller';
import { AuthGuard } from './auth';
import { pool } from './db';
@Module({controllers:[ApiController],providers:[AuthGuard,{provide:APP_GUARD,useClass:AuthGuard}]}) class AppModule{}
async function bootstrap(){const app=await NestFactory.create(AppModule);app.enableCors({origin:true,credentials:false});app.useGlobalPipes(new ValidationPipe({whitelist:false,transform:true}));app.getHttpAdapter().get('/health',async(_req:any,res:any)=>{try{await pool.query('SELECT 1');res.json({status:'ok',database:'ok'})}catch{res.status(503).json({status:'degraded',database:'unavailable'})}});await app.listen(Number(process.env.PORT||3000),'0.0.0.0');console.log(`Ride API listening on ${await app.getUrl()}`)}
bootstrap().catch(e=>{console.error(e);process.exit(1)});
