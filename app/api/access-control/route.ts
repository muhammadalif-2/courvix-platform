import { context,db,body,uid,now,token,hash,clean,writable,ownerOnly,audit,ApiError,failure,json,limit } from "@/lib/v1";
import { FEATURE_CATALOG,roleCeiling,parsePermissions } from "@/lib/feature-access";
import { requireFeature,requireInviteRole,grantable,permitted,validateInviteTeam,membershipStatements,inheritedPermissions } from "@/lib/access-control-server";
export const dynamic="force-dynamic";
export async function GET(req:Request){try{
 const s=await context(req);requireFeature(s.identity,"Access");if(s.identity.role!=="Admin")throw new ApiError(403,"Workspace staff access is required.");
 const defaults=(await db().prepare("SELECT role,permissions FROM cv_role_defaults WHERE club=?").bind(s.club.id).all<any>()).results;
 const links=(await db().prepare("SELECT id,name,role,team,permissions,expires,max_uses,uses,revoked_at,created_at FROM cv_join_links WHERE club=? ORDER BY created_at DESC LIMIT 100").bind(s.club.id).all<any>()).results;
 const requests=(await db().prepare("SELECT r.*,u.email,COALESCE(NULLIF(p.display_name,''),u.name) as name,l.role,l.team,l.name as link_name FROM cv_join_requests r JOIN cv_users u ON u.id=r.user_id JOIN cv_join_links l ON l.id=r.link_id LEFT JOIN cv_user_profiles p ON p.user_id=u.id WHERE r.club=? ORDER BY r.created_at DESC LIMIT 100").bind(s.club.id).all<any>()).results;
 const people=(await db().prepare("SELECT m.id,m.role,m.team,m.active,m.permissions,m.can_invite_admin,u.name,u.email FROM cv_memberships m JOIN cv_users u ON u.id=m.user_id WHERE m.club=? ORDER BY m.role,u.name").bind(s.club.id).all<any>()).results;
 return json({session:s.identity,club:{id:s.club.id,name:s.club.name,product:s.club.workspace_type},features:FEATURE_CATALOG,defaults:Object.fromEntries(["Admin","Coach","Member"].map(role=>[role,{...roleCeiling(role),...parsePermissions(defaults.find(d=>d.role===role)?.permissions)}])),links,requests,people,teams:(await db().prepare("SELECT payload FROM cv_records WHERE club=? AND module='Teams'").bind(s.club.id).all<any>()).results.map(r=>JSON.parse(r.payload))});
}catch(e){return failure(e)}}
export async function POST(req:Request){try{
 const b=await body(req,20000);await limit(req,"access-control",45);const s=await context(req),a=s.identity;
 requireFeature(a,"Access",true);if(a.role!=="Admin")throw new ApiError(403,"Only authorized administrators can manage access.");writable(s.club);
 if(b.action==="defaults"){
  ownerOnly(a);if(!["Admin","Coach","Member"].includes(b.role))throw new ApiError(422,"Invalid default role.");const permissions=permitted(b.role,b.permissions);
  await db().prepare("INSERT INTO cv_role_defaults(club,role,permissions,updated_by,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(club,role) DO UPDATE SET permissions=excluded.permissions,updated_by=excluded.updated_by,updated_at=excluded.updated_at").bind(s.club.id,b.role,JSON.stringify(permissions),s.who.id,now()).run();
  await audit(s.club.id,s.who.email,"Role defaults updated",b.role);return json({ok:true});
 }
 if(b.action==="person"){
  const person=await db().prepare("SELECT * FROM cv_memberships WHERE id=? AND club=? AND active=1").bind(clean(b.id),s.club.id).first<any>();
  if(!person||person.role==="Owner"||person.user_id===s.who.id)throw new ApiError(403,"Owner and self access cannot be changed here.");
  if(person.role==="Admin")ownerOnly(a);
  const permissions=await grantable(a,person.role,b.permissions);
  if(b.canInviteAdmin!==undefined)ownerOnly(a);
  const delegate=b.canInviteAdmin===undefined?person.can_invite_admin:b.canInviteAdmin===true&&person.role==="Admin"?1:0;
  await db().prepare("UPDATE cv_memberships SET permissions=?,can_invite_admin=? WHERE id=? AND club=?").bind(JSON.stringify(permissions),delegate,person.id,s.club.id).run();
  await audit(s.club.id,s.who.email,"Individual feature access updated",person.id);return json({ok:true});
 }
 if(b.action==="create-link"){
  const role=clean(b.role);requireInviteRole(a,role);const team=await validateInviteTeam(s.club,role,b.team),permissions=await grantable(a,role,b.permissions||{});
  const days=Number(b.days??7),maxUses=Number(b.maxUses??25);if(!Number.isInteger(days)||days<1||days>30||!Number.isInteger(maxUses)||maxUses<1||maxUses>500)throw new ApiError(422,"Choose 1–30 days and 1–500 approved uses.");
  const code=token(),id=uid(),expires=Date.now()+days*86400000;
  await db().prepare("INSERT INTO cv_join_links(id,club,role,team,name,token_hash,permissions,expires,max_uses,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").bind(id,s.club.id,role,team,clean(b.name)||role+" invitation",await hash(code),JSON.stringify(permissions),expires,maxUses,s.who.id,now()).run();
  const url=new URL("/join",req.url);url.searchParams.set("link",code);await audit(s.club.id,s.who.email,"Role invitation link created",role);return json({ok:true,url:url.href,id},201);
 }
 if(b.action==="revoke-link"){
  const l=await db().prepare("SELECT role FROM cv_join_links WHERE id=? AND club=?").bind(clean(b.id),s.club.id).first<any>();if(!l)throw new ApiError(404,"Link unavailable.");requireInviteRole(a,l.role);
  await db().batch([db().prepare("UPDATE cv_join_links SET revoked_at=? WHERE id=? AND club=?").bind(now(),b.id,s.club.id),db().prepare("UPDATE cv_join_requests SET status='Declined',note='The invitation link was revoked.',reviewed_by=?,reviewed_at=? WHERE link_id=? AND club=? AND status='Pending'").bind(s.who.id,now(),b.id,s.club.id)]);
  await audit(s.club.id,s.who.email,"Role invitation link revoked",b.id);return json({ok:true});
 }
 if(b.action==="approve"||b.action==="decline"){
  const request=await db().prepare("SELECT r.*,l.role,l.team,l.permissions,l.expires,l.revoked_at,l.max_uses,l.uses,u.email,u.name FROM cv_join_requests r JOIN cv_join_links l ON l.id=r.link_id JOIN cv_users u ON u.id=r.user_id WHERE r.id=? AND r.club=?").bind(clean(b.id),s.club.id).first<any>();
  if(!request||request.status!=="Pending")throw new ApiError(409,"This request has already been handled.");requireInviteRole(a,request.role);
  if(b.action==="decline"){
   await db().prepare("UPDATE cv_join_requests SET status='Declined',note=?,reviewed_by=?,reviewed_at=? WHERE id=? AND status='Pending'").bind(clean(b.note,500)||"Contact the workspace owner for more information.",s.who.id,now(),request.id).run();return json({ok:true});
  }
  if(request.revoked_at||request.expires<Date.now()||request.uses>=request.max_uses)throw new ApiError(410,"This invitation link is inactive. Create a new link.");
  await validateInviteTeam(s.club,request.role,request.team);
  const permissions=await grantable(a,request.role,b.permissions??parsePermissions(request.permissions));
  const queries=[db().prepare("INSERT INTO cv_revision_guard(value) VALUES(COALESCE((SELECT CASE WHEN status='Pending' THEN 1 ELSE 0 END FROM cv_join_requests WHERE id=? AND club=?),0))").bind(request.id,s.club.id),db().prepare("INSERT INTO cv_revision_guard(value) VALUES(COALESCE((SELECT CASE WHEN revoked_at IS NULL AND expires>? AND uses<max_uses THEN 1 ELSE 0 END FROM cv_join_links WHERE id=? AND club=?),0))").bind(Date.now(),request.link_id,s.club.id),...(await membershipStatements(s.club,{id:request.user_id,email:request.email,name:request.name},request.role,request.team,permissions)),db().prepare("UPDATE cv_join_links SET uses=uses+1 WHERE id=?").bind(request.link_id),db().prepare("UPDATE cv_join_requests SET status='Approved',note='',reviewed_by=?,reviewed_at=? WHERE id=?").bind(s.who.id,now(),request.id),db().prepare("UPDATE cv_clubs SET revision=revision+1 WHERE id=?").bind(s.club.id),db().prepare("DELETE FROM cv_revision_guard")];
  await db().batch(queries);await audit(s.club.id,s.who.email,"Access request approved",request.email+" · "+request.role);return json({ok:true});
 }
 throw new ApiError(422,"Unknown access action.");
}catch(e){return failure(e)}}
