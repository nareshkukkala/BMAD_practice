import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { fail } from './errors';
export type Principal={id:string;role:'rider'|'driver'|'ops'|'responder'|'analyst';name:string};
@Injectable() export class AuthGuard implements CanActivate { canActivate(ctx:ExecutionContext){const req=ctx.switchToHttp().getRequest<Request>();if(req.path==='/api/auth/demo'||req.path==='/health'||req.path==='/api/health'||req.path.startsWith('/api/shared/'))return true;const token=req.headers.authorization?.replace(/^Bearer\s+/i,'');if(!token)fail(401,'AUTH_REQUIRED','Sign in to continue.');try{(req as any).principal=jwt.verify(token,process.env.JWT_SECRET||'local-development-secret') as Principal;return true}catch{fail(401,'INVALID_SESSION','Your session expired. Sign in again.')}} }
export function principal(req:Request):Principal{return (req as any).principal}
export function allow(actor:Principal,...roles:Principal['role'][]){if(!roles.includes(actor.role))fail(403,'FORBIDDEN','Your account cannot perform this action.')}
