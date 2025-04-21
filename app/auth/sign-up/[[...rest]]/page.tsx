"use client";

import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export default function SignUpPage() {
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
            <h1 className="text-2xl font-bold">Create your Lolita account</h1>
            <p className="text-gray-dark mt-2">
              Start tracking your finances today
            </p>
          </div>
          <div className="flex justify-center">
            <SignUp 
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
              path="/auth/sign-up"
              signInUrl="/auth/sign-in"
              redirectUrl="/dashboard"
              afterSignUpUrl="/dashboard"
            />
          </div>
        </div>
      </main>
    </div>
  );
} 