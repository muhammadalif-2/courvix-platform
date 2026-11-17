import {accountAuth} from "@/lib/account-auth";
import {body,cookieValue,db,hash,json,failure,localPreview,viewer} from "@/lib/v1";
export const dynamic="force-dynamic";
export async function POST(req:Request){try{
 await body(req);let mode="account";try{mode=(await viewer(req)).authMode}catch{}
 const headers=new Headers({"Cache-Control":"no-store"});
 const auth=accountAuth(req);
 if(auth&&req.headers.get("cookie")?.includes("courvix.")){
  const response=await auth.api.signOut({headers:req.headers,asResponse:true});
  if(!response.ok)return response;
  for(const value of response.headers.getSetCookie())headers.append("Set-Cookie",value);
 }
 if(localPreview(req)){const t=cookieValue(req,"courvix_dev_session");if(t)await db().prepare("DELETE FROM cv_dev_sessions WHERE token_hash=?").bind(await hash(t)).run();}
 headers.append("Set-Cookie","courvix_dev_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
 headers.append("Set-Cookie","courvix_club=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
 return Response.json({ok:true,next:mode==="sites"?"/signout-with-chatgpt?return_to=/login":"/login"},{headers});
}catch(e){return failure(e)}}
