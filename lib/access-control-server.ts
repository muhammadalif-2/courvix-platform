import { ApiError,db,admin,ownerOnly,uid,now } from "./v1";
import { canFeature,effectivePermissions,normalizePermissions,levelValue,type FeaturePermissions } from "./feature-access";
import type { Identity } from "./access-policy";
export function requireFeature(a:Identity,key:string,edit=false){if(!canFeature(a,key,edit))throw new ApiError(403,"Your workspace access does not include this feature.")}
export function permitted(role:string,value:unknown){if(value!==undefined&&(!value||typeof value!=="object"||Array.isArray(value)))throw new ApiError(422,"Send feature access as a set of feature names and levels.");try{return normalizePermissions(role,value)}catch(e){throw new ApiError(422,(e as Error).message)}}
export function requireInviteRole(a:Identity,role:string){
 admin(a);requireFeature(a,"Access",true);
 if(!["Admin","Coach","Member"].includes(role))throw new ApiError(422,"Choose Admin, Coach or Member.");
 if(role==="Admin"&&!a.isOwner&&!a.canInviteAdmin)throw new ApiError(403,"The owner has not enabled administrator invitations for your account.");
}
export async function inheritedPermissions(club:string,role:string,overrides:unknown={}){
 const row=await db().prepare("SELECT permissions FROM cv_role_defaults WHERE club=? AND role=?").bind(club,role).first<any>();
 return effectivePermissions(role,row?.permissions,overrides);
}
export async function grantable(a:Identity,role:string,raw:unknown):Promise<FeaturePermissions>{
 requireInviteRole(a,role);const overrides=permitted(role,raw),effective=await inheritedPermissions(a.club,role,overrides);
 if(!a.isOwner){
  const own=a.permissions||{};
  for(const [key,value]of Object.entries(effective))if(levelValue(value)>levelValue(own[key]||"none"))overrides[key]=own[key]||"none";
 }
 return overrides;
}
export async function validateInviteTeam(club:any,role:string,value:unknown){
 if(role==="Admin"||club.workspace_type==="Trainer")return null;
 const team=typeof value==="string"?value:"";
 if(!await db().prepare("SELECT id FROM cv_records WHERE club=? AND module='Teams' AND id=?").bind(club.id,team).first())throw new ApiError(422,"Choose an existing group for this invitation link.");
 return team;
}
export async function membershipStatements(club:any,person:any,role:string,team:string|null,permissions:FeaturePermissions){
 const prior=await db().prepare("SELECT id FROM cv_memberships WHERE club=? AND user_id=? AND active=1").bind(club.id,person.id).first();
 if(prior)throw new ApiError(409,"This person already has access. Edit their existing access instead.");
 let subject:string|null=null;const statements:D1PreparedStatement[]=[db().prepare("INSERT INTO cv_revision_guard(value) VALUES(CASE WHEN EXISTS(SELECT 1 FROM cv_memberships WHERE club=? AND user_id=? AND active=1) THEN 0 ELSE 1 END)").bind(club.id,person.id)];
 if(role!=="Admin"){
  const module=role==="Coach"?"Coaches":"Members";
  const existing=await db().prepare("SELECT id,payload FROM cv_records WHERE club=? AND module=? AND LOWER(json_extract(payload,'$.email'))=?").bind(club.id,module,person.email).first<any>();
  if(existing){const row=JSON.parse(existing.payload);if(row.status!=="Active"||(team&&row.team&&row.team!==team))throw new ApiError(409,"The existing profile is inactive or belongs to another group.");subject=existing.id;}
  else{subject=uid();const row={id:subject,club:club.id,name:person.name,email:person.email,team,status:"Active",date:now().slice(0,10)};statements.push(db().prepare("INSERT INTO cv_records(club,module,id,payload) VALUES(?,?,?,?)").bind(club.id,module,subject,JSON.stringify(row)));}
 }
 statements.push(db().prepare("INSERT INTO cv_memberships(id,club,user_id,role,team,subject,active,permissions) VALUES(?,?,?,?,?,?,1,?) ON CONFLICT(club,user_id) DO UPDATE SET role=excluded.role,team=excluded.team,subject=excluded.subject,active=1,permissions=excluded.permissions,can_invite_admin=0").bind(uid(),club.id,person.id,role,team,subject,JSON.stringify(permissions)));
 return statements;
}
