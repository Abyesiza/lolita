import { ReactNode } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navbar from "../components/layout/Navbar";
import Link from "next/link";
import Image from "next/image";

export default async function DashboardLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  const user = await currentUser();
  
  if (!user) {
    redirect("/auth/sign-in");
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-gray py-8 mt-8 relative">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-16 h-1 bg-gradient-to-r from-primary-light via-accent to-primary-light rounded"></div>
        </div>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="Lolita Logo"
                  width={24}
                  height={24}
                />
                <span className="font-playfair font-semibold text-primary text-lg">Lolita</span>
              </Link>
            </div>
            <div className="font-montserrat text-gray-dark mb-4 md:mb-0 text-sm">
              © {new Date().getFullYear()} Lolita Finance. All rights reserved.
            </div>
            <div className="text-primary font-montserrat text-sm">
              All amounts in UGX <span className="mx-2">•</span> Made with <span className="text-error">❤️</span> in Uganda
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 