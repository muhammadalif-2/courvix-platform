import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { authUser,authSession,authAccount,authVerification,authRateLimit } from "@/db/auth-schema";
const values=()=>env as unknown as Record<string,string>;
export function isLocalAuth(req:Request){return values().COURVIX_LOCAL_AUTH==="1"&&["localhost","127.0.0.1","terminal.local"].includes(new URL(req.url).hostname)}
export function authAvailability(req:Request){
 const e=values(),ready=!!e.COURVIX_AUTH_SECRET&&e.COURVIX_AUTH_SECRET.length>=32&&(isLocalAuth(req)||!!(e.COURVIX_AUTH_URL||e.COURVIX_APP_URL));
 const mail=isLocalAuth(req)||!!(e.RESEND_API_KEY&&e.COURVIX_FROM_EMAIL);
 return {ready,email:ready&&mail,google:ready&&!!(e.GOOGLE_CLIENT_ID&&e.GOOGLE_CLIENT_SECRET),microsoft:ready&&!!(e.MICROSOFT_CLIENT_ID&&e.MICROSOFT_CLIENT_SECRET),chatgpt:e.COURVIX_SITES_AUTH==="1",local:isLocalAuth(req)};
}
async function authMail(req:Request,address:string,url:string,kind:string){
 const e=values();
 if(isLocalAuth(req)){
  await (env as any).DB.prepare("INSERT INTO cv_auth_test_mail(id,email,kind,url,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),address,kind,url,new Date().toISOString()).run();return;
 }
 if(!e.RESEND_API_KEY||!e.COURVIX_FROM_EMAIL)throw Error("Account email delivery is not available.");
 const safe=(s:string)=>s.replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;");
 const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+e.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:e.COURVIX_FROM_EMAIL,to:[address],subject:kind==="verify"?"Verify your Courvix email":"Reset your Courvix password",html:`<h1>COURVIX</h1><p>${kind==="verify"?"Confirm your email to open your Courvix account.":"Use this link to choose a new password."}</p><p><a href="${safe(url)}">${kind==="verify"?"Verify email":"Reset password"}</a></p><p>If you did not request this, you can ignore this email.</p>`}),signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error("Account email delivery failed. Please retry shortly.");
}
export function accountAuth(req:Request){
 const e=values(),available=authAvailability(req);
 if(!available.ready)return null;
 const baseURL=isLocalAuth(req)?new URL(req.url).origin:e.COURVIX_AUTH_URL||e.COURVIX_APP_URL;
 if(!baseURL)return null;
 return betterAuth({
  appName:"Courvix",baseURL,basePath:"/api/auth",secret:e.COURVIX_AUTH_SECRET,
  database:drizzleAdapter(drizzle((env as any).DB),{provider:"sqlite",schema:{user:authUser,session:authSession,account:authAccount,verification:authVerification,rateLimit:authRateLimit},transaction:false}),
  trustedOrigins:[new URL(baseURL).origin],
  emailAndPassword:{enabled:available.email,requireEmailVerification:true,minPasswordLength:12,maxPasswordLength:128,sendResetPassword:async({user,url})=>authMail(req,user.email,url,"reset"),revokeSessionsOnPasswordReset:true},
  emailVerification:{sendOnSignUp:true,sendOnSignIn:true,autoSignInAfterVerification:true,expiresIn:3600,sendVerificationEmail:async({user,url})=>authMail(req,user.email,url,"verify")},
  socialProviders:{...(available.google?{google:{clientId:e.GOOGLE_CLIENT_ID,clientSecret:e.GOOGLE_CLIENT_SECRET}}:{}),...(available.microsoft?{microsoft:{clientId:e.MICROSOFT_CLIENT_ID,clientSecret:e.MICROSOFT_CLIENT_SECRET,tenantId:"common"}}:{})},
  account:{accountLinking:{enabled:false}},
  session:{expiresIn:7*86400,updateAge:86400,cookieCache:{enabled:false}},
  advanced:{ipAddress:{ipAddressHeaders:["cf-connecting-ip"]},cookiePrefix:"courvix",useSecureCookies:new URL(baseURL).protocol==="https:",database:{generateId:()=>crypto.randomUUID()}},
  rateLimit:{enabled:true,storage:"database",window:60,max:30},
  logger:{disabled:true},
 });
}
export async function accountIdentity(req:Request){
 if(!req.headers.get("cookie")?.includes("courvix."))return null;
 const auth=accountAuth(req);if(!auth)return null;
 const session=await auth.api.getSession({headers:req.headers});
 if(!session?.user?.emailVerified)return null;
 return {id:"account:"+session.user.id,email:session.user.email.toLowerCase(),name:session.user.name};
}
export function safeReturn(value:unknown,fallback="/waiting-room"){
 if(typeof value!=="string"||!value.startsWith("/")||value.startsWith("//")||value.includes("\\")||/[\r\n]/.test(value))return fallback;
 return value;
}
