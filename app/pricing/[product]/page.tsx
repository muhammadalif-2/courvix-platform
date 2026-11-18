import {notFound} from "next/navigation";
import {PublicHeader,PublicFooter} from "../../marketing";
import PricingExperience from "../../pricing-experience";
export async function generateMetadata({params}:{params:Promise<{product:string}>}){const {product}=await params;return {title:(product==="club"?"Club Management":product==="personal-training"?"Personal Training":"Pricing")+" plans & pricing — Courvix"}}
export default async function Page({params}:{params:Promise<{product:string}>}){const {product}=await params;if(!["club","personal-training"].includes(product))notFound();return <PricingExperience initialProduct={product==="personal-training"?"training":"club"} header={<PublicHeader active="pricing"/>} footer={<PublicFooter/>}/>}
