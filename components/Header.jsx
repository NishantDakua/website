"use client"

import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, User, LogOut, ChevronDown, ShoppingCart, Package, Star } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function Header() {
 const router = useRouter()
 const [isOpen, setIsOpen] = useState(false)
 const [user, setUser] = useState(null)
 const [cartItemCount, setCartItemCount] = useState(0)
 const [isLoading, setIsLoading] = useState(true)
 const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
 const profileMenuRef = useRef(null)
 
 const closeMenu = () => setIsOpen(false)
 
 useEffect(() => {
   const checkAuth = async () => {
     try {
       const response = await fetch('/api/auth/user')
       if (response.ok) {
         const data = await response.json()
         setUser(data.user)
       }
     } catch (error) {
       console.error('Auth check failed:', error)
     } finally {
       setIsLoading(false)
     }
   }
   
   // Always fetch cart count regardless of authentication status
   const fetchCartCount = async () => {
     try {
       const response = await fetch('/api/cart')
       if (response.ok) {
         const data = await response.json()
         
         // Calculate total number of items (considering quantities)
         let totalItems = 0
         if (data.cart && data.cart.items) {
           data.cart.items.forEach(item => {
             totalItems += item.quantity
           })
         }
         
         setCartItemCount(totalItems)
       }
     } catch (error) {
       console.error('Fetch cart count failed:', error)
       // If cart fetch fails, set count to 0
       setCartItemCount(0)
     }
   }
   
   const initializeData = async () => {
     await checkAuth()
     await fetchCartCount()
   }
   
   initializeData()
 }, [])
 
 // Function to refresh cart item count (can be called from outside)
 const refreshCartCount = async () => {
   try {
     const response = await fetch('/api/cart')
     if (response.ok) {
       const data = await response.json()
       
       // Calculate total number of items (considering quantities)
       let totalItems = 0
       if (data.cart && data.cart.items) {
         data.cart.items.forEach(item => {
           totalItems += item.quantity
         })
       }
       
       setCartItemCount(totalItems)
     }
   } catch (error) {
     console.error('Fetch cart count failed:', error)
     setCartItemCount(0)
   }
 }
 
 useEffect(() => {
   const handleClickOutside = (event) => {
     if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
       setIsProfileMenuOpen(false)
     }
   }
   
   document.addEventListener('mousedown', handleClickOutside)
   return () => {
     document.removeEventListener('mousedown', handleClickOutside)
   }
 }, [])
 
 const handleLogout = async () => {
   try {
     await fetch('/api/auth/logout', {
       method: 'POST',
     })
     setUser(null)
     setIsProfileMenuOpen(false)
     // Clear cart count on logout since cart is user-specific
     setCartItemCount(0)
     router.push('/')
   } catch (error) {
     console.error('Logout failed:', error)
   }
 }
 
 // Handle cart click - redirect to login if not authenticated
 const handleCartClick = (e) => {
 if (!user) {
   e.preventDefault()
   window.location.href = '/Login?redirectTo=/cart&message=Please login to view your cart'
 }
}
 
 return (
   <motion.header
     className="bg-white shadow-lg sticky top-0 z-50 border-b-2 border-teal-100"
     initial={{ y: -100 }}
     animate={{ y: 0 }}
     transition={{ type: 'spring', stiffness: 300, damping: 30 }}
   >
     <div className="container mx-auto px-4 py-4 flex items-center justify-between">
       <Link href="/" className="text-xl font-bold text-teal-500 flex items-center group">
         <svg className="w-6 h-6 mr-1 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
           <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
           <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
           <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
         </svg>
         <span className="font-poppins tracking-tight">HomeServices</span>
       </Link>
       
       {/* Main navigation */}
       <nav className="hidden md:flex items-center space-x-8 mx-auto">
         <Link href="/" className="text-gray-700 hover:text-teal-500 transition-colors py-2 relative group">
           Home
           <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-teal-500 transition-all duration-300 group-hover:w-full"></span>
         </Link>
         <Link href="/products" className="text-gray-700 hover:text-teal-500 transition-colors py-2 relative group">
           Products
           <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-teal-500 transition-all duration-300 group-hover:w-full"></span>
         </Link>
         <Link href="/About" className="text-gray-700 hover:text-teal-500 transition-colors py-2 relative group">
           About Us
           <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-teal-500 transition-all duration-300 group-hover:w-full"></span>
         </Link>
         <Link href="/Faq" className="text-gray-700 hover:text-teal-500 transition-colors py-2 relative group">
           Faq
           <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-teal-500 transition-all duration-300 group-hover:w-full"></span>
         </Link>
         <Link href="/Contact" className="text-gray-700 hover:text-teal-500 transition-colors py-2 relative group">
           Contact Us
           <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-teal-500 transition-all duration-300 group-hover:w-full"></span>
         </Link>
       </nav>
       
       {/* Right side profile and cart */}
       <div className="hidden md:flex items-center space-x-4">
         {/* Cart icon - always visible, but behavior depends on authentication */}
         <Link href="/cart" onClick={handleCartClick} className="text-gray-700 hover:text-teal-500 relative transition-colors">
           <ShoppingCart size={24} />
           {cartItemCount > 0 && (
             <span className="absolute -top-2 -right-2 bg-teal-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
               {cartItemCount > 99 ? '99+' : cartItemCount}
             </span>
           )}
         </Link>
         
         {isLoading ? (
           <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
         ) : user ? (
           <div className="relative" ref={profileMenuRef}>
             <button 
               onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
               className="flex items-center space-x-2 text-gray-700 hover:text-teal-500 focus:outline-none"
             >
               <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-teal-400 overflow-hidden flex items-center justify-center">
                 {user.profilePicture ? (
                   <img 
                     src={user.profilePicture} 
                     alt={user.name} 
                     className="w-full h-full object-cover"
                   />
                 ) : (
                   <User size={20} className="text-gray-500" />
                 )}
               </div>
               <span className="font-medium">{user.name?.split(' ')[0]}</span>
               <ChevronDown size={16} className={`transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
             </button>
             
             {isProfileMenuOpen && (
               <motion.div 
                 className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-10 border border-gray-100"
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.2 }}
               >
                 <div className="px-4 py-2 border-b border-gray-100">
                   <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                   <p className="text-xs text-gray-500 truncate">{user.email}</p>
                   {user.companyName && (
                     <p className="text-xs text-gray-400 truncate">{user.companyName}</p>
                   )}
                 </div>
                 
                 <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-500">
                   <User size={16} className="mr-2" />
                   <span>My Profile</span>
                 </Link>
                 
                 <Link href="/user-reviews" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-500">
                   <Star size={16} className="mr-2" />
                   <span>My Reviews</span>
                 </Link>
                 
                 <Link href="/order-history" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-500">
                   <Package size={16} className="mr-2" />
                   <span>Order History</span>
                 </Link>
                 
                 <button 
                   onClick={handleLogout}
                   className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-500"
                 >
                   <LogOut size={16} className="mr-2" />
                   <span>Logout</span>
                 </button>
               </motion.div>
             )}
           </div>
         ) : (
           /* Show Login button when not authenticated */
           <Link href="/Login" className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-md transition-colors font-medium shadow-md">
             Login
           </Link>
         )}
       </div>
       
       <button 
         className="md:hidden" 
         onClick={() => setIsOpen(!isOpen)}
         aria-label={isOpen ? "Close menu" : "Open menu"}
       >
         {isOpen ? <X className="text-teal-500" /> : <Menu className="text-teal-500" />}
       </button>
     </div>

     <AnimatePresence>
       {isOpen && (
         <motion.div
           className="md:hidden bg-white"
           initial={{ opacity: 0, height: 0 }}
           animate={{ opacity: 1, height: 'auto' }}
           exit={{ opacity: 0, height: 0 }}
           transition={{ duration: 0.3 }}
         >
           <nav className="flex flex-col items-center py-4 space-y-4">
             <Link href="/" className="text-gray-700 hover:text-teal-500 transition-colors" onClick={closeMenu}>
               Home
             </Link>
             <Link href="/products" className="text-gray-700 hover:text-teal-500 transition-colors" onClick={closeMenu}>
               Products
             </Link>
             <Link href="/About" className="text-gray-700 hover:text-teal-500 transition-colors" onClick={closeMenu}>
               About Us
             </Link>
             <Link href="/Faq" className="text-gray-700 hover:text-teal-500 transition-colors" onClick={closeMenu}>
               Faq
             </Link>
             <Link href="/Contact" className="text-gray-700 hover:text-teal-500 transition-colors" onClick={closeMenu}>
               Contact Us
             </Link>
             
             {/* Cart button - always visible in mobile */}
             <Link href="/cart" 
               onClick={(e) => {
                 handleCartClick(e);
                 closeMenu();
               }}
               className="w-full max-w-xs bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-full text-center transition-all duration-300 font-medium shadow-md flex items-center justify-center"
             >
               <ShoppingCart size={16} className="mr-2" />
               My Cart
               {cartItemCount > 0 && (
                 <span className="ml-2 bg-white text-teal-600 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                   {cartItemCount > 99 ? '99+' : cartItemCount}
                 </span>
               )}
             </Link>
             
             {isLoading ? (
               <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
             ) : user ? (
               <div className="w-full flex flex-col items-center space-y-3 border-t border-gray-100 pt-4">
                 <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-teal-400 overflow-hidden flex items-center justify-center">
                     {user.profilePicture ? (
                       <img 
                         src={user.profilePicture} 
                         alt={user.name} 
                         className="w-full h-full object-cover"
                       />
                     ) : (
                       <User size={20} className="text-gray-500" />
                     )}
                   </div>
                   <div>
                     <p className="font-medium text-gray-900">{user.name}</p>
                     <p className="text-xs text-gray-500">{user.email}</p>
                     {user.companyName && (
                       <p className="text-xs text-gray-400">{user.companyName}</p>
                     )}
                   </div>
                 </div>
                 
                 <Link href="/profile" 
                   className="w-full max-w-xs bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-full text-center transition-all duration-300 font-medium shadow-md flex items-center justify-center"
                   onClick={closeMenu}
                 >
                   <User size={16} className="mr-2" />
                   My Profile
                 </Link>
                 
                 <Link href="/order-history" 
                   className="w-full max-w-xs bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-full text-center transition-all duration-300 font-medium shadow-md flex items-center justify-center"
                   onClick={closeMenu}
                 >
                   <Package size={16} className="mr-2" />
                   Order History
                 </Link>
                 
                 <button 
                   onClick={() => {
                     closeMenu();
                     handleLogout();
                   }}
                   className="w-full max-w-xs bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-center transition-all duration-300 font-medium shadow-md flex items-center justify-center"
                 >
                   <LogOut size={16} className="mr-2" />
                   Logout
                 </button>
               </div>
             ) : (
               /* Show Login button in mobile when not authenticated */
               <div className="w-full flex flex-col items-center space-y-3 border-t border-gray-100 pt-4">
                 <Link href="/Login" 
                   className="w-full max-w-xs bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-full text-center transition-all duration-300 font-medium shadow-md"
                   onClick={closeMenu}
                 >
                   Login
                 </Link>
               </div>
             )}
           </nav>
         </motion.div>
       )}
     </AnimatePresence>
   </motion.header>
 )
}
