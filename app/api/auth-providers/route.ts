import { authAvailability } from "@/lib/account-auth";
export const dynamic="force-dynamic";
export const GET=(req:Request)=>Response.json(authAvailability(req),{headers:{"Cache-Control":"no-store"}});
