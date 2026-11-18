"use client";
import {useEffect,useRef,useState} from "react";
/** Timers run only for visible scenes on a visible document, and never under reduced motion. */
export function useScene(count:number,delay=6500){
 const ref=useRef<HTMLDivElement>(null),[step,setStep]=useState(0),[visible,setVisible]=useState(false),[reduce,setReduce]=useState(true),[manual,setManual]=useState(false),[awake,setAwake]=useState(true);
 useEffect(()=>{const media=matchMedia("(prefers-reduced-motion: reduce)"),sync=()=>setReduce(media.matches),visibility=()=>setAwake(!document.hidden);sync();visibility();media.addEventListener("change",sync);document.addEventListener("visibilitychange",visibility);const observer=new IntersectionObserver(entries=>setVisible(entries.some(e=>e.isIntersecting)),{threshold:.15});if(ref.current)observer.observe(ref.current);return()=>{observer.disconnect();media.removeEventListener("change",sync);document.removeEventListener("visibilitychange",visibility)}},[]);
 useEffect(()=>{if(!visible||reduce||manual||!awake)return;const timer=setInterval(()=>setStep(s=>(s+1)%count),delay);return()=>clearInterval(timer)},[visible,reduce,manual,awake,count,delay]);
 return {ref,step,animated:visible&&!reduce&&awake,choose:(n:number)=>{setStep(Math.max(0,Math.min(count-1,n)));setManual(true)}};
}
export function AnimatedNumber({value,animate}:{value:number;animate:boolean}){const [shown,setShown]=useState(value);useEffect(()=>{if(!animate){setShown(value);return}let frame=0;const start=performance.now(),render=(now:number)=>{const p=Math.min(1,(now-start)/850);setShown(Math.round(value*(1-Math.pow(1-p,3))));if(p<1)frame=requestAnimationFrame(render)};frame=requestAnimationFrame(render);return()=>cancelAnimationFrame(frame)},[value,animate]);return <span aria-label={String(value)}>{shown.toLocaleString("en-US")}</span>}
