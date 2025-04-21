"use client";

import { ReactNode } from "react";
import { useStoreUserEffect } from "../hooks/useStoreUserEffect";

export function UserSyncProvider({ children }: { children: ReactNode }) {
  // This will automatically sync the user's info to the Convex database
  useStoreUserEffect();
  
  return <>{children}</>;
} 