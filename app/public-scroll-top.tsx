"use client";
import {useEffect,useRef,useState} from "react";
import {ArrowUp} from "lucide-react";
export default function PublicScrollTop(){
 const ref=useRef<HTMLAnchorElement>(null),[visible,setVisible]=useState(false);
 useEffect(()=>{
  let frame=0;
  const update=()=>{frame=0;const top=window.scrollY,total=document.documentElement.scrollHeight-window.innerHeight;setVisible(v=>v===(top>500)?v:top>500);ref.current?.style.setProperty("--page-progress",(total>0?Math.max(0,Math.min(100,top/total*100)):0)+"%")};
  const onScroll=()=>{if(!frame)frame=requestAnimationFrame(update)};update();window.addEventListener("scroll",onScroll,{passive:true});window.addEventListener("resize",onScroll);
  return()=>{window.removeEventListener("scroll",onScroll);window.removeEventListener("resize",onScroll);if(frame)cancelAnimationFrame(frame)};
 },[]);
 return <a ref={ref} href="#courvix-top" className="public-scroll-top" data-visible={visible} aria-label="Back to top" aria-hidden={!visible} tabIndex={visible?0:-1}><ArrowUp size={19}/></a>
}
