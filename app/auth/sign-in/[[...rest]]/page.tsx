"use client";

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="container mx-auto p-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Lolita Logo"
            width={32}
            height={32}
            priority
          />
          <span className="text-xl font-semibold text-primary-dark">Lolita</span>
        </Link>
      </header>

      <main className="flex-grow flex items-center justify-center p-6">
        <div className="card max-w-md w-full mx-auto p-8">
          <div className="text-center mb-8">
            <Image
              src="/logo.png"
              alt="Lolita Logo"
              width={64}
              height={64}
              className="mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold">Sign in to Lolita</h1>
            <p className="text-gray-dark mt-2">
              Track your finances with ease
            </p>
          </div>
          <div className="flex justify-center">
            <SignIn 
              appearance={{
                elements: {
                  formButtonPrimary: 
                    "bg-primary hover:bg-primary-dark text-foreground",
                  footerActionLink: 
                    "text-primary hover:text-primary-dark",
                  card: "shadow-none",
                }
              }}
              routing="path"
              path="/auth/sign-in"
              signUpUrl="/auth/sign-up"
              redirectUrl="/dashboard"
            />
          </div>
        </div>
      </main>
    </div>
  );
} 