import { env } from "cloudflare:workers";
import { isLocalAuth } from "@/lib/account-auth";
export const dynamic="force-dynamic";
export async function GET(req:Request){
 if(!isLocalAuth(req))return new Response(null,{status:404});
 const address=new URL(req.url).searchParams.get("email")||"";
 if(!address.endsWith(".test"))return new Response(null,{status:404});
 const rows=await (env as any).DB.prepare("SELECT kind,url FROM cv_auth_test_mail WHERE email=? ORDER BY rowid DESC LIMIT 5").bind(address).all();
 return Response.json(rows.results,{headers:{"Cache-Control":"no-store"}});
}
