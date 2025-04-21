"use client";

import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useState } from "react";

export default function Navbar() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/transactions", label: "Transactions" },
    { href: "/dashboard/income", label: "Income" },
    { href: "/dashboard/budget", label: "Budget" },
    { href: "/dashboard/savings", label: "Savings" },
    { href: "/dashboard/planner", label: "Planner" },
    { href: "/dashboard/reports", label: "Reports" },
  ];
  
  return (
    <header className="bg-background border-b border-gray py-4">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Lolita Logo"
              width={32}
              height={32}
            />
            <span className="font-playfair font-semibold text-primary text-xl">Lolita</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6">
            {navLinks.map(link => (
              <Link 
                key={link.href} 
                href={link.href}
                className="nav-link px-1 py-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle mobile menu"
          >
            {showMobileMenu ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="12" x2="20" y2="12"></line>
                <line x1="4" y1="6" x2="20" y2="6"></line>
                <line x1="4" y1="18" x2="20" y2="18"></line>
              </svg>
            )}
          </button>
          
          {/* User Button */}
          <div className="hidden md:block">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="mt-4 md:hidden">
            <nav className="flex flex-col gap-2">
              {navLinks.map(link => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className="px-4 py-2 hover:bg-gray-light rounded-md"
                  onClick={() => setShowMobileMenu(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-4 px-4">
                <UserButton afterSignOutUrl="/" />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
} 