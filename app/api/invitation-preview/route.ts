import { db,hash,ApiError,failure,json,clean,limit } from "@/lib/v1";
export const dynamic="force-dynamic";
export async function GET(req:Request){try{
 await limit(req,"invitation-preview",60);const p=new URL(req.url).searchParams,shared=!!p.get("link"),code=clean(p.get("link")||p.get("code"),200);
 const row=await db().prepare(shared?"SELECT l.role,l.expires,l.revoked_at,l.uses,l.max_uses,c.name,c.workspace_type FROM cv_join_links l JOIN cv_clubs c ON c.id=l.club WHERE l.token_hash=?":"SELECT i.role,i.expires,i.revoked_at,i.used_at,c.name,c.workspace_type FROM cv_invites i JOIN cv_clubs c ON c.id=i.club WHERE i.token_hash=?").bind(await hash(code)).first<any>();
 if(!row||row.revoked_at||row.used_at||row.expires<Date.now()||(shared&&row.uses>=row.max_uses))throw new ApiError(410,"This invitation is inactive. Request a new link from the owner.");
 return json({clubName:row.name,product:row.workspace_type,role:row.role,approvalRequired:shared,expires:row.expires});
}catch(e){return failure(e)}}
