import assert from "node:assert/strict";
const base=process.env.COURVIX_TEST_URL||"http://localhost:8788";
const routes=[
 ["/",["ONE WORKDAY, DIFFERENT VIEWS","Less admin.","FROM SCATTERED TO CONNECTED","Data &amp; trust"]],
 ["/pricing",["PLAN YOUR WORKSPACES","250,000","500,000","30-day paid term","WHAT’S INCLUDED","Separate tools &amp; manual handoffs"]],
 ["/pricing/club",["Club Management","Member profiles &amp; groups","Scheduled onboarding support"]],
 ["/pricing/personal-training",["Personal Training","Per-visit &amp; session-pack offers","Session ledger &amp; progress"]],
 ["/products",["FIND YOUR FIT"]],
 ["/platform",["FOLLOW AN INVITATION"]],
 ["/clubs",["TRY A TRAINING DAY"]],
 ["/personal-training",["EXPLORE SESSION CREDITS"]],
 ["/sports",["EXPLORE YOUR SPORT"]],
 ["/contact",["PLAN YOUR FIRST CONVERSATION"]],
 ["/custom",["SHAPE YOUR PROJECT"]],
 ["/club-life",["A SMALL TRAINING-DAY HABIT"]],
 ["/compare",["Compare the workflow","Pause animation","No third-party prices or savings are assumed."]],
 ["/help",["FIND THE NEXT STEP","THE COURVIX HELP CENTER","Browser/mobile push is not implemented","Can I sell visits"]],
 ["/trust",["EXPLORE THE ACCESS BOUNDARIES","Muhammad Alif","16112","Browser/phone push","Not implemented"]],
 ["/policies",["UNDERSTAND THE RESPONSIBILITY","Service terms","Privacy notice","Indonesian review companion"]],
 ["/terms",["UNDERSTAND THE RESPONSIBILITY","Pre-launch review version.","Muhammad Alif","There is no blanket","Mandatory rights"]],
 ["/privacy",["UNDERSTAND A DATA REQUEST","parent/guardian consent","three-times-24-hour","server-side role/feature checks"]],
 ["/legal/id",["PENDAMPING PENINJAUAN HUKUM","Muhammad Alif","Versi peninjauan sebelum peluncuran."]],
 ["/login",["Good to have you back."]],
 ["/register",["Your next chapter starts here."]],
];
const allAssets=new Set();
for(const [path,expected] of routes){
 const r=await fetch(base+path,{signal:AbortSignal.timeout(30000)}),html=await r.text();assert.equal(r.status,200,path+" "+html.slice(0,200));assert.ok(!html.includes("Internal Server Error"),path);for(const value of expected)assert.ok(html.includes(value),path+": missing "+value);
 for(const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)){const target=match[1].replaceAll('&amp;','&');if(target.startsWith('/_next/')||target.endsWith('.webp')||target.endsWith('.woff'))allAssets.add(target)}
 console.log("PASS public route",path);
}
for(const asset of allAssets){const r=await fetch(base+asset,{signal:AbortSignal.timeout(15000)});assert.equal(r.status,200,"Missing published asset "+asset);await r.arrayBuffer()}
assert.equal((await fetch(base+"/pricing/unknown",{signal:AbortSignal.timeout(15000)})).status,404);
console.log("PASS public smoke: rendered 21 public/account routes and topic-specific guides, original account routes, invalid product 404, and "+allAssets.size+" referenced assets. Browser interactions remain a separate acceptance check.");
