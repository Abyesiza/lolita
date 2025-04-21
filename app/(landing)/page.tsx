import Image from "next/image";
import Link from "next/link";
import { SignUpButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import ShoppingListPreview from "../components/landing/ShoppingListPreview";

export default async function Home() {
  const user = await currentUser();
  
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-6 md:py-10 premium-gradient relative">
          {/* Decorative elements - smaller and more subtle */}
          <div className="absolute top-16 left-8 opacity-10">
            <div className="h-24 w-24 border-2 border-accent rounded-full"></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="md:w-1/2 space-y-3">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight hero-title">
                  <span className="title-highlight">Premium</span> <span className="title-highlight">Financial</span>
                  <div className="w-24 md:w-48 h-1 bg-accent my-2 md:my-3"></div>
                  <span className="title-highlight">Management</span> <span className="in-text">in</span>
                  <div className="w-24 md:w-48 h-1 bg-accent my-2 md:my-3"></div>
                  <span className="uganda-text">Uganda</span>
                </h1>
                
                <p className="text-base md:text-lg text-white/90 max-w-lg font-montserrat mt-2 md:mt-4">
                  Track your finances and plan your future with Uganda&apos;s premium finance tracking solution. Take control of your money, one transaction at a time.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <SignUpButton mode="modal">
                    <button className="btn-primary px-5 py-2 rounded-lg font-montserrat shadow-lg hover:shadow-xl transition text-white">
                      Start Managing Now
                    </button>
                  </SignUpButton>
                  <Link 
                    href="#features" 
                    className="px-5 py-2 rounded-lg border border-gray/30 text-white hover:border-accent hover:text-accent transition font-montserrat"
                  >
                    Discover Features
                  </Link>
                </div>
              </div>
              <div className="md:w-1/2 flex justify-center mt-4 md:mt-0">
                <div className="relative w-56 h-56 md:w-72 md:h-72 hero-image-wrapper">
                  <Image
                    src="/logo.png"
                    alt="Lolita Finance App"
                    fill
                    className="object-contain z-10"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 relative inline-block">
                  Premium Features
                  <span className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-primary-light via-accent to-primary-light rounded"></span>
                </h2>
                <p className="text-gray-dark max-w-2xl mx-auto font-montserrat mt-6">
                  Everything you need to take control of your finances with elegance and precision.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="card p-8 hover:-translate-y-1 transition-transform">
                  <div className="mb-6 text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Track Expenses in UGX</h3>
                  <p className="text-gray-dark font-montserrat">
                    Easily log daily expenses in Ugandan Shillings (UGX), categorize transactions, and understand your spending habits with detailed insights.
                  </p>
                </div>
                <div className="card p-8 hover:-translate-y-1 transition-transform">
                  <div className="mb-6 text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Financial Insights</h3>
                  <p className="text-gray-dark font-montserrat">
                    Get detailed reports and analytics specifically designed for the Ugandan market, helping you make smarter financial decisions.
                  </p>
                </div>
                <div className="card p-8 hover:-translate-y-1 transition-transform">
                  <div className="mb-6 text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Savings Goals</h3>
                  <p className="text-gray-dark font-montserrat">
                    Define your targets, track progress, and watch your savings grow. Whether it&apos;s a vacation, a home, or retirement, we&apos;ll help you get there.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Shopping Lists Preview (Logged in users only) */}
        {user && (
          <section className="py-16 md:py-20 bg-gray-light/50">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <ShoppingListPreview />
              </div>
            </div>
          </section>
        )}

        {/* Transactions Section - NEW */}
        <section id="transactions" className="py-16 md:py-20 bg-gray-light">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 relative inline-block">
                  Smart Transaction Management
                  <span className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-primary-light via-accent to-primary-light rounded"></span>
                </h2>
                <p className="text-gray-dark max-w-2xl mx-auto font-montserrat mt-6">
                  Effortlessly record, track, and analyze your financial transactions with our powerful tools.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="card p-8 overflow-hidden bg-background">
                  <div className="rounded-lg overflow-hidden shadow-md mb-4 border border-gray">
                    <div className="bg-primary/10 p-4 border-b border-gray">
                      <h3 className="text-lg font-bold font-playfair">Recent Transactions</h3>
                    </div>
                    <div className="divide-y divide-gray">
                      <div className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center text-success">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium">Salary Deposit</p>
                            <p className="text-xs text-gray-dark">Today</p>
                          </div>
                        </div>
                        <span className="text-success font-medium">+UGX 850,000</span>
                      </div>
                      <div className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-error/20 flex items-center justify-center text-error">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium">Grocery Shopping</p>
                            <p className="text-xs text-gray-dark">Yesterday</p>
                          </div>
                        </div>
                        <span className="text-error font-medium">-UGX 75,000</span>
                      </div>
                      <div className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-error/20 flex items-center justify-center text-error">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium">Transport</p>
                            <p className="text-xs text-gray-dark">3 days ago</p>
                          </div>
                        </div>
                        <span className="text-error font-medium">-UGX 15,000</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center mt-4">
                    <SignUpButton mode="modal">
                      <button className="btn-primary px-4 py-2 rounded-lg font-montserrat shadow-sm hover:shadow-md transition text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add Your First Transaction
                      </button>
                    </SignUpButton>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-primary/10 p-2 rounded-full text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2 font-playfair">Add Transactions Instantly</h3>
                      <p className="text-gray-dark">Record income and expenses in seconds with our streamlined form. Categorize and tag transactions for better tracking.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-primary/10 p-2 rounded-full text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2 font-playfair">Comprehensive History</h3>
                      <p className="text-gray-dark">View your complete transaction history with powerful filtering and sorting options. Export data for your records.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-primary/10 p-2 rounded-full text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2 font-playfair">Smart Insights</h3>
                      <p className="text-gray-dark">Get personalized analysis of your spending patterns and recommendations to optimize your financial habits.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Budgeting Section - NEW */}
        <section id="budgeting" className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 relative inline-block">
                  Interactive Budgeting
                  <span className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-primary-light via-accent to-primary-light rounded"></span>
                </h2>
                <p className="text-gray-dark max-w-2xl mx-auto font-montserrat mt-6">
                  Take control of your spending with our smart shopping list and budget planner.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-12 items-start">
                <div className="space-y-6 order-2 md:order-1">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-primary/10 p-2 rounded-full text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2 font-playfair">Smart Shopping Lists</h3>
                      <p className="text-gray-dark">Create shopping lists with budgets for each trip. Check off items as you buy them and track your spending in real-time.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-primary/10 p-2 rounded-full text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2 font-playfair">Auto-Deduction</h3>
                      <p className="text-gray-dark">Completed purchases are automatically deducted from your income balance, giving you a real-time view of your remaining funds.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-primary/10 p-2 rounded-full text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2 font-playfair">Customizable Categories</h3>
                      <p className="text-gray-dark">Organize your budget with custom categories and allocate funds according to your priorities and spending habits.</p>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <SignUpButton mode="modal">
                      <button className="btn-primary px-5 py-2 rounded-lg font-montserrat shadow-lg hover:shadow-xl transition text-white">
                        Start Budgeting Today
                      </button>
                    </SignUpButton>
                  </div>
                </div>
                
                <div className="order-1 md:order-2">
                  <div className="card bg-background p-6 shadow-md">
                    <h3 className="text-xl font-bold mb-4 font-playfair">Weekly Shopping Budget</h3>
                    
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Budget: UGX 150,000</span>
                        <span className="text-sm text-success">Remaining: UGX 52,000</span>
                      </div>
                      <div className="w-full bg-gray h-2 rounded-full overflow-hidden">
                        <div className="bg-success h-full rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center p-3 bg-gray-light rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="w-5 h-5 rounded border border-primary mr-3 flex items-center justify-center bg-primary/10">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-primary">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            </div>
                            <span className="font-medium">Rice (5kg)</span>
                          </div>
                        </div>
                        <span className="text-error font-medium">UGX 25,000</span>
                      </div>
                      
                      <div className="flex items-center p-3 bg-gray-light rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="w-5 h-5 rounded border border-primary mr-3 flex items-center justify-center bg-primary/10">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-primary">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            </div>
                            <span className="font-medium">Vegetables</span>
                          </div>
                        </div>
                        <span className="text-error font-medium">UGX 18,000</span>
                      </div>
                      
                      <div className="flex items-center p-3 bg-gray-light rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="w-5 h-5 rounded border border-gray mr-3"></div>
                            <span className="font-medium">Chicken</span>
                          </div>
                        </div>
                        <span className="text-gray-dark font-medium">UGX 35,000</span>
                      </div>
                      
                      <div className="flex items-center p-3 bg-gray-light rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="w-5 h-5 rounded border border-gray mr-3"></div>
                            <span className="font-medium">Household items</span>
                          </div>
                        </div>
                        <span className="text-gray-dark font-medium">UGX 20,000</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray flex justify-between">
                      <button className="text-primary flex items-center gap-1 hover:text-primary-dark transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add Item
                      </button>
                      <span className="text-sm font-medium">4 items • 2 completed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-16 md:py-24 bg-gray-light">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">Made for Ugandans</h2>
                  <p className="text-gray-dark mb-4 font-montserrat">
                    Lolita is designed specifically for the Ugandan market, with features tailored to local financial needs and practices.
                  </p>
                  <p className="text-gray-dark mb-4 font-montserrat">
                    Our premium financial management tools help you track your income and expenses in UGX, set realistic savings goals, and gain insights into your financial health.
                  </p>
                  <p className="text-gray-dark font-montserrat">
                    Whether you&apos;re saving for a new home, planning for education, or simply wanting to better manage your day-to-day finances, Lolita provides the tools you need.
                  </p>
                </div>
                <div className="card p-4 overflow-hidden">
                  <div className="h-64 md:h-80 relative">
                    <Image
                      src="/logo.png"
                      alt="Lolita Features"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="card p-10 bg-gradient-to-r from-primary-dark to-primary">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Finances?</h2>
                  <p className="text-white/90 max-w-2xl mx-auto mb-8 font-montserrat">
                    Join thousands of Ugandans who have already taken control of their finances with Lolita&apos;s premium management tools.
                  </p>
                  <SignUpButton mode="modal">
                    <button className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-light transition-colors font-montserrat">
                      Create Free Account
                    </button>
                  </SignUpButton>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
