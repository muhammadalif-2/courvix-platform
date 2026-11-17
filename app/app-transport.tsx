"use client";
import { createContext, useContext, type ReactNode } from "react";
export type AppRequest = (
  path: string,
  options?: RequestInit,
) => Promise<Response>;
const Transport = createContext<AppRequest | null>(null);
export function AppTransportProvider({
  request,
  children,
}: {
  request: AppRequest;
  children: ReactNode;
}) {
  return <Transport.Provider value={request}>{children}</Transport.Provider>;
}
export function useAppRequest(): AppRequest {
  return useContext(Transport) || ((path, options) => fetch(path, options));
}
