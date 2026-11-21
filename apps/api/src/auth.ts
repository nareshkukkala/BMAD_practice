import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { fail } from './errors';
export type Principal={id:string;role:'rider'|'driver'|'ops'|'responder'|'analyst';name:string};
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (req.path === '/api/auth/demo' || req.path === '/health' || req.path === '/api/health' || req.path.startsWith('/api/shared/')) return true;

    const secret = process.env.JWT_SECRET;
    if (process.env.NODE_ENV === 'production' && !secret) fail(503, 'AUTH_NOT_CONFIGURED', 'Authentication is not configured.');
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (typeof token !== 'string') return fail(401, 'AUTH_REQUIRED', 'Sign in to continue.');

    let decoded: string | jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, secret || 'local-development-secret');
    } catch {
      return fail(401, 'INVALID_SESSION', 'Your session expired. Sign in again.');
    }
    if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object') fail(401, 'INVALID_SESSION', 'Your session is invalid. Sign in again.');
    (req as any).principal = decoded as unknown as Principal;
    return true;
  }
}
export function principal(req:Request):Principal{return (req as any).principal}
export function allow(actor:Principal,...roles:Principal['role'][]){if(!roles.includes(actor.role))fail(403,'FORBIDDEN','Your account cannot perform this action.')}
