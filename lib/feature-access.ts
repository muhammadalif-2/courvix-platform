export type AccessLevel="none"|"view"|"edit";
export type FeaturePermissions=Record<string,AccessLevel>;
export const FEATURE_CATALOG=[
 ["Members","People & profiles"],["Teams","Teams & groups"],["Coaches","Coaches & trainers"],["Schedule","Club schedule"],["Attendance","Attendance"],["Training","Training programs"],["Competitions","Competitions"],["Membership","Membership plans"],["Invoices","Dues & invoices"],["Payments","Payment records"],["Expenses","Expenses"],["Announcements","Announcements"],["Documents","Documents"],["Support","Support"],["PTPlans","Training offers"],["PTOrders","Training purchases & payments"],["PTSessions","Appointments & progress"],["PTClasses","Training classes"],["PTCredits","Credit records"],["PTSettings","Training policies"],["Access","Invitations & access requests"],["Reports","Reports & exports"],["Reminders","Payment follow-ups"],
] as const;
export const levelValue=(v:AccessLevel)=>({none:0,view:1,edit:2})[v];
const catalog=new Set(FEATURE_CATALOG.map(([key])=>key));
export function roleCeiling(role:string):FeaturePermissions {
 const p:FeaturePermissions=Object.fromEntries(FEATURE_CATALOG.map(([key])=>[key,"none"]));
 const set=(keys:string[],level:AccessLevel)=>keys.forEach(k=>p[k]=level);
 if(role==="Owner"||role==="Administrator"||role==="Admin"){
  set(FEATURE_CATALOG.map(([k])=>k),"edit");set(["Payments","PTCredits","Reports"],"view");return p;
 }
 if(role==="Coach"){
  set(["Members","Teams","Coaches","Schedule","Competitions","Announcements","Documents","PTClasses","Reports"],"view");set(["Attendance","Training","Support","PTSessions"],"edit");return p;
 }
 if(role==="Member"){
  set(["Members","Teams","Coaches","Schedule","Attendance","Training","Competitions","Membership","Invoices","Payments","Announcements","Documents","PTPlans","PTClasses","PTCredits","Reminders","Reports"],"view");set(["Support","PTOrders","PTSessions"],"edit");return p;
 }
 return p;
}
export function parsePermissions(raw:unknown):FeaturePermissions {
 if(typeof raw==="string"){try{return parsePermissions(JSON.parse(raw))}catch{return {}}}
 return raw&&typeof raw==="object"&&!Array.isArray(raw)?raw as FeaturePermissions:{};
}
export function normalizePermissions(role:string,raw:unknown):FeaturePermissions {
 const input=parsePermissions(raw),ceiling=roleCeiling(role),out:FeaturePermissions={};
 for(const [key,value]of Object.entries(input)){
  if(!catalog.has(key as any)||!["none","view","edit"].includes(value)||levelValue(value)>levelValue(ceiling[key]))throw Error("Choose access within this role's allowed features.");
  out[key]=value;
 }
 return out;
}
export function effectivePermissions(role:string,defaults:unknown={},overrides:unknown={}):FeaturePermissions {
 return {...roleCeiling(role),...normalizePermissions(role,defaults),...normalizePermissions(role,overrides)};
}
export function featureKey(module:string):string {
 return ({"Audit logs":"Reports",PTOffers:"PTPlans",PTPayments:"PTOrders",PTBookings:"PTSessions",Clients:"Members",Trainers:"Coaches",Appointments:"PTSessions",Invitations:"Access",Settings:"Access",Finance:"Expenses"} as Record<string,string>)[module]||module;
}
export function canFeature(a:{role:string;isOwner?:boolean;permissions?:FeaturePermissions},module:string,edit=false):boolean {
 if(a.isOwner||a.role==="Administrator")return true;
 const key=featureKey(module);if(!catalog.has(key as any))return true;
 const value=a.permissions?.[key]??roleCeiling(a.role)[key]??"none";
 return levelValue(value)>=(edit?2:1);
}
export function editableModule(a:{role:string;isOwner?:boolean;permissions?:FeaturePermissions},module:string){return canFeature(a,module,true)}
