import { HttpException } from '@nestjs/common';
export const fail=(status:number,code:string,message:string,details?:unknown):never=>{throw new HttpException({statusCode:status,code,message,details},status)};
