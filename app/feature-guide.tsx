"use client";
import { useState } from "react";
import { ArrowRight, Compass, ChevronDown, Eye, PencilLine } from "lucide-react";
import { clubFeatureHelp, trainingFeatureHelp, platformFeatureHelp } from "@/lib/workspace-guidance";
export function FeatureGuide({page,training=false,platform=false,readOnly=false,canEdit=false}:{page:string;training?:boolean;platform?:boolean;readOnly?:boolean;canEdit?:boolean}) {
 const [expanded,setExpanded]=useState(false);
 const help=(platform?platformFeatureHelp:training?trainingFeatureHelp:clubFeatureHelp)[page];
 if(!help)return null;
 return <section className="wg-feature" aria-label="How to use this feature"><div className="wg-feature-line"><span className="wg-feature-icon"><Compass size={20}/></span><p>{help.purpose}</p><span className="wg-access">{readOnly||!canEdit?<Eye size={13}/>:<PencilLine size={13}/>} {readOnly?"Read-only workspace":canEdit?"Changes allowed":"Your permitted view"}</span></div><button className="wg-feature-toggle" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}>How to use this page <ChevronDown size={15} style={{transform:expanded?"rotate(180deg)":undefined}}/></button>{expanded?<div className="wg-feature-expanded"><ol>{help.steps.map((step,i)=><li key={step}><span>{i+1}</span><p>{step}</p>{i<help.steps.length-1?<ArrowRight size={15}/>:null}</li>)}</ol><p>{help.outcome}</p></div>:null}</section>;
}
