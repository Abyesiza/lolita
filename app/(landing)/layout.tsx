import type { Metadata } from "next";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { MobileMenu } from "../components/layout/MobileMenu";

export const metadata: Metadata = {
  title: "Lolita - Premium Financial Management",
  description: "Track your finances and expenses effortlessly with Lolita's premium financial management tools",
};

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-background/95 backdrop-blur-sm shadow-md border-b border-gray sticky top-0 z-20 transition-all duration-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 z-10 group">
              <div className="relative w-9 h-9 md:w-10 md:h-10 transition-all duration-300 group-hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="Lolita Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-playfair font-semibold text-primary text-2xl tracking-tight group-hover:text-primary-dark transition-colors duration-300">Lolita</span>
            </Link>
            
            <SignedOut>
              <div className="flex items-center gap-4">
                <nav className="hidden md:flex items-center space-x-8 mr-6">
                  <Link href="/#features" className="text-foreground hover:text-primary transition-colors relative nav-link">
                    Features
                  </Link>
                  <Link href="/#transactions" className="text-foreground hover:text-primary transition-colors relative nav-link">
                    Transactions
                  </Link>
                  <Link href="/#budgeting" className="text-foreground hover:text-primary transition-colors relative nav-link">
                    Budgeting
                  </Link>
                  <Link href="/#about" className="text-foreground hover:text-primary transition-colors relative nav-link">
                    About
                  </Link>
                  <Link href="/#contact" className="text-foreground hover:text-primary transition-colors relative nav-link">
                    Contact
                  </Link>
                </nav>
                <div className="hidden md:flex items-center gap-4">
                  <SignInButton mode="modal">
                    <button className="border border-primary text-primary px-5 py-2 rounded-lg hover:bg-primary/5 transition font-medium">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="btn-primary px-5 py-2 rounded-lg shadow-sm hover:shadow-md transition-all">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
                <MobileMenu />
              </div>
            </SignedOut>
            
            <SignedIn>
              <div className="flex items-center gap-6">
                <nav className="hidden md:flex items-center space-x-8">
                  <Link 
                    href="/dashboard" 
                    className="text-foreground hover:text-primary transition-colors flex items-center gap-2 font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                    Go to Dashboard
                  </Link>
                </nav>
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "border-2 border-primary-light hover:border-primary transition-colors",
                      userButtonTrigger: "hover:opacity-80 transition-opacity"
                    }
                  }}
                />
                <MobileMenu />
              </div>
            </SignedIn>
          </div>
        </div>
      </header>
      
      <div className="flex-grow">
        {children}
      </div>
      
      <footer className="border-t border-gray py-8 relative">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-16 h-1 bg-gradient-to-r from-primary-light via-accent to-primary-light rounded"></div>
        </div>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="Lolita Logo"
                  width={28}
                  height={28}
                />
                <span className="font-playfair font-semibold text-primary text-xl">Lolita</span>
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-6 mb-4 md:mb-0">
              <SignedOut>
                <Link href="/#features" className="text-foreground hover:text-primary transition-colors font-montserrat">
                  Features
                </Link>
                <Link href="/#transactions" className="text-foreground hover:text-primary transition-colors font-montserrat">
                  Transactions
                </Link>
                <Link href="/#budgeting" className="text-foreground hover:text-primary transition-colors font-montserrat">
                  Budgeting
                </Link>
                <Link href="/#about" className="text-foreground hover:text-primary transition-colors font-montserrat">
                  About
                </Link>
                <Link href="/#contact" className="text-foreground hover:text-primary transition-colors font-montserrat">
                  Contact
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard" className="text-foreground hover:text-primary transition-colors font-montserrat">
                  Dashboard
                </Link>
                <Link href="/dashboard/transactions" className="text-foreground hover:text-primary transition-colors font-montserrat">
                  Transactions
                </Link>
                <Link href="/dashboard/budgeting" className="text-foreground hover:text-primary transition-colors font-montserrat">
                  Budgeting
                </Link>
              </SignedIn>
            </div>
            <div className="font-montserrat text-gray-dark text-sm">
              © {new Date().getFullYear()} Lolita Finance
            </div>
          </div>
          <div className="text-center mt-6 text-primary font-montserrat">
            Made with <span className="text-error">❤️</span> in Uganda
          </div>
        </div>
      </footer>
    </div>
  );
}
