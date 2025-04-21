"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * This hook automatically stores the user in the Convex database
 * when they log in with Clerk
 */
export function useStoreUserEffect() {
  const { user, isSignedIn } = useUser();
  const convex = useConvex();

  useEffect(() => {
    // If the user is logged in, store their information in Convex
    if (isSignedIn && user) {
      // Get the user's information from Clerk
      const userData = {
        userId: user.id,
        name: user.fullName || undefined,
        email: user.primaryEmailAddress?.emailAddress || "",
        image: user.imageUrl,
      };

      // Store the user in the Convex database
      convex.mutation(api.users.createOrUpdate, userData).catch((error) => {
        console.error("Failed to store user:", error);
      });
    }
  }, [isSignedIn, user, convex]);
} 