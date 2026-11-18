import {scoped,type Identity} from "./access-policy.ts";
import {canFeature} from "./feature-access.ts";
import type {DB,Row} from "./courvix.ts";
const number=(v:unknown)=>Number.isFinite(Number(v))?Number(v):0;
const amount=(rows:Row[])=>rows.reduce((sum,row)=>sum+number(row.amount),0);
const status=(s:unknown)=>({Hadir:"Present",Terlambat:"Late",Absen:"Absent",Izin:"Excused"} as Record<string,string>)[String(s)]||String(s||"Unknown");
const countBy=(rows:Row[],labels:readonly string[])=>labels.map(label=>({label,value:rows.filter(r=>status(r.status)===label).length}));
const distribution=(rows:Row[],preferred:readonly string[])=>countBy(rows,[...preferred,...Array.from(new Set(rows.map(r=>status(r.status)))).filter(s=>!preferred.includes(s))]);
export function clubInsights(data:DB,identity:Identity,period:string,today:string){
 const visible=scoped(data,identity).records,get=(module:string)=>(visible[module]||[]).filter(r=>r.club===identity.club),sessions=get("Schedule"),members=get("Members"),attendance=get("Attendance").filter(r=>(r.date||sessions.find(s=>s.id===(r.session||r.schedule))?.date||"").startsWith(period));
 const attendanceSplit=countBy(attendance,["Present","Late","Absent","Excused"]),recorded=attendanceSplit.reduce((n,x)=>n+x.value,0),attended=attendanceSplit.slice(0,2).reduce((n,x)=>n+x.value,0);
 const days=Array.from({length:7},(_,i)=>{const date=new Date(today+"T12:00:00Z");date.setUTCDate(date.getUTCDate()+i);const day=date.toISOString().slice(0,10);return {day,label:day.slice(8),value:sessions.filter(s=>s.date===day&&!['Cancelled','Completed','No-show'].includes(s.status)).length}});
 const groups=get("Teams").map(t=>({id:t.id,label:t.name||"Group",value:members.filter(m=>m.team===t.id).length})).sort((a,b)=>b.value-a.value).slice(0,6);
 const history=attendance.slice().sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))).slice(0,5).map(r=>({id:r.id,label:sessions.find(s=>s.id===(r.session||r.schedule))?.name||r.name||"Recorded session",date:r.date||"",status:status(r.status)}));
 const financial=identity.role!=="Coach"&&canFeature(identity,"Invoices");
 const invoices=financial?get("Invoices").filter(r=>(r.period||r.date||"").startsWith(period)):[];
 return {recorded,attended,rate:recorded?Math.round(attended/recorded*100):null,attendance:attendanceSplit,days,groups,history,role:identity.role,financial:financial?{status:distribution(invoices,["Paid","Pending","Review","Expired","Rejected","Cancelled","Refunded"]),total:invoices.length,review:invoices.filter(i=>i.status==="Review").length,overdue:invoices.filter(i=>i.due&&i.due<today&&!["Paid","Cancelled","Refunded"].includes(i.status)).length,outstanding:amount(invoices.filter(i=>!["Paid","Cancelled","Refunded"].includes(i.status)))}:null,programs:get("Training").length,announcements:get("Announcements").length};
}
export function trainingInsights(view:any){
 const actor=view.session,can=(module:string)=>canFeature(actor,module),local=(r:Row)=>r.club===view.club.id;
 const appointments:Row[]=can("PTSessions")?(view.appointments||[]).filter((r:Row)=>local(r)&&(actor.role==="Admin"||actor.role==="Member"&&r.client===actor.member||actor.role==="Coach"&&r.coachId===actor.coach)):[];
 const orders:Row[]=actor.role!=="Coach"&&can("PTOrders")?(view.orders||[]).filter((r:Row)=>local(r)&&(actor.role==="Admin"||r.client===actor.member)):[];
 const states=distribution(appointments,["Requested","Scheduled","Completed","Cancelled","No-show"]),done=appointments.filter(s=>s.status==="Completed");
 const clients:Row[]=can("Members")?(view.clients||[]).filter((r:Row)=>local(r)&&(actor.role==="Admin"||actor.role==="Member"&&r.id===actor.member||actor.role==="Coach"&&(r.coachId===actor.coach||appointments.some(a=>a.client===r.id)))):[];
 const trainers:Row[]=can("Coaches")?(view.coaches||[]):[];
 const coaching=clients.slice(0,6).map(c=>({id:c.id,label:c.name||"Client",value:appointments.filter(s=>s.client===c.id&&s.status==="Completed").length}));
 return {states,total:appointments.length,completed:done.length,coaching,upcoming:appointments.filter(s=>["Requested","Scheduled"].includes(s.status)&&s.date>=view.today).length,assigned:clients.length,trainers:trainers.length,financial:view.session.role!=="Coach"&&can("PTOrders")?{status:distribution(orders,["Paid","Pending","Review","Rejected","Cancelled"]),total:orders.length,available:orders.reduce((n,o)=>n+Math.max(0,number(o.balance?.available)),0),reserved:orders.reduce((n,o)=>n+Math.max(0,number(o.balance?.reserved)),0)}:null};
}
