import { viewer,memberships,db,json,failure,ApiError,body,limit,hash,clean,uid,now } from "@/lib/v1";
export const dynamic="force-dynamic";
export async function GET(req:Request){try{
 const who=await viewer(req);
 const invitations=(await db().prepare("SELECT i.id,i.role,i.team,i.expires,c.name as club_name,c.workspace_type FROM cv_invites i JOIN cv_clubs c ON c.id=i.club WHERE i.email=? AND i.used_at IS NULL AND i.revoked_at IS NULL AND i.expires>? ORDER BY i.created_at DESC").bind(who.email,Date.now()).all()).results;
 const requests=(await db().prepare("SELECT r.id,r.status,r.note,r.created_at,l.role,c.name as club_name,c.workspace_type FROM cv_join_requests r JOIN cv_join_links l ON l.id=r.link_id JOIN cv_clubs c ON c.id=r.club WHERE r.user_id=? ORDER BY r.created_at DESC LIMIT 50").bind(who.id).all()).results;
 return json({viewer:who,clubs:await memberships(who.id),invitations,requests});
}catch(e){return failure(e)}}
export async function POST(req:Request){try{
 const b=await body(req);await limit(req,"join-request",20,3600);const who=await viewer(req);
 if(b.action!=="request")throw new ApiError(422,"Invalid waiting-room action.");
 const link=await db().prepare("SELECT l.*,c.status,c.trial_ends,c.renew_at FROM cv_join_links l JOIN cv_clubs c ON c.id=l.club WHERE token_hash=?").bind(await hash(clean(b.code,200))).first<any>();
 if(!link||link.revoked_at||link.expires<Date.now()||link.uses>=link.max_uses)throw new ApiError(410,"The invitation link is inactive. Ask the club owner for a new link.");
 if((await memberships(who.id)).some(m=>m.club===link.club))throw new ApiError(409,"You already have access to this workspace.");
 const prior=await db().prepare("SELECT status FROM cv_join_requests WHERE link_id=? AND user_id=?").bind(link.id,who.id).first<any>();
 if(prior)throw new ApiError(409,prior.status==="Pending"?"Your access request is already waiting for review.":"This request was already reviewed. Ask the owner for a new invitation.");
 await db().prepare("INSERT INTO cv_join_requests(id,link_id,club,user_id,status,note,created_at) VALUES(?,?,?,?,'Pending',?,?)").bind(uid(),link.id,link.club,who.id,clean(b.note,500),now()).run();return json({ok:true},201);
}catch(e){return failure(e)}}
