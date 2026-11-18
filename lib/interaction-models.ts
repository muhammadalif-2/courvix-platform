import { PUBLIC_PRICING, type PublicProduct } from "./public-product.ts";
export type CreditExample = { purchased: number; completed: number; reserved: number };
const integer=(value:number,min:number,max:number)=>Number.isFinite(value)?Math.max(min,Math.min(max,Math.trunc(value))):min;
export function creditExample(value:CreditExample){
 const purchased=integer(value.purchased,1,200),completed=integer(value.completed,0,purchased),remaining=purchased-completed,reserved=integer(value.reserved,0,remaining);
 return {purchased,completed,reserved,remaining,available:remaining-reserved};
}
export function changeCreditExample(value:CreditExample,action:"reserve"|"release"|"complete"){
 const s=creditExample(value);
 if(action==="reserve"&&s.available>0)return creditExample({...s,reserved:s.reserved+1});
 if(action==="release"&&s.reserved>0)return creditExample({...s,reserved:s.reserved-1});
 if(action==="complete"&&s.reserved>0)return creditExample({...s,reserved:s.reserved-1,completed:s.completed+1});
 return s;
}
export function workspaceEstimate(clubs:number,training:number,plan:"Starter"|"Pro"){
 const clubCount=integer(clubs,0,25),trainingCount=integer(training,0,25-clubCount),count=clubCount+trainingCount,unit=plan==="Pro"?PUBLIC_PRICING.pro:PUBLIC_PRICING.starter;
 return {clubs:clubCount,training:trainingCount,count,unit,total:count*unit,termDays:PUBLIC_PRICING.termDays};
}
export function productRecommendation(billing:"dues"|"sessions"):PublicProduct{return billing==="sessions"?"training":"club"}
export function setupEnquiry(product:PublicProduct,locations:number,need:string){
 const safeNeed=["Workspace setup","Moving existing records","A custom project"].includes(need)?need:"Workspace setup";
 const count=integer(locations,1,25),name=product==="training"?"Personal Training":"Club Management";
 return {subject:`Courvix enquiry — ${name}`,body:`Product: ${name}\nLocations: ${count}\nHelp needed: ${safeNeed}\n\nBusiness/workspace name:\nWhat we use today:\nWhat we want to improve:\n`};
}
export const accessExamples={
 Owner:{scope:"Owned workspaces & headquarters",people:"Owned workspace records",training:"Owned workspace training",payments:"Business payment review",lead:"Organization oversight"},
 Admin:{scope:"The invited workspace",people:"Permitted workspace records",training:"Permitted workspace training",payments:"When the owner permits it",lead:"No automatic headquarters access"},
 Coach:{scope:"Assigned groups or clients",people:"Assigned participants",training:"Assigned sessions & outcomes",payments:"No financial ledger access",lead:"No other branches by default"},
 Member:{scope:"Personal records",people:"Own profile",training:"Own sessions & activity",payments:"Own invoices or purchases",lead:"Other participants stay outside the view"},
} as const;
