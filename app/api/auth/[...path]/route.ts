import { accountAuth } from "@/lib/account-auth";
export const dynamic="force-dynamic";
async function handler(req:Request){
 const auth=accountAuth(req);
 if(!auth)return Response.json({message:"Account sign-in is temporarily unavailable. Please contact support."},{status:503,headers:{"Cache-Control":"no-store"}});
 return auth.handler(req);
}
export const GET=handler;
export const POST=handler;
