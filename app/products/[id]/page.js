"use client"

import {
  AlertTriangle,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Heart,
  Info,
  MessageCircle,
  RefreshCw,
  Share,
  Shield,
  ShoppingCart,
  Star,
  Truck,
  User
} from "lucide-react"
import { useRouter } from "next/navigation"
import { use, useEffect, useRef, useState } from "react"

// Simple chart components for analytics display
const SimpleBarChart = ({ data, title, className = "" }) => {
  const maxValue = Math.max(...data.map(item => item.value))
  
  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700">{title}</h4>
      <div className="space-y-1">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <span className="text-xs text-gray-600 w-16 text-right">{item.label}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
              <div 
                className={`h-3 rounded-full ${item.color || 'bg-blue-500'}`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-700 w-8">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Simple Pie Chart component for review authenticity
const SimplePieChart = ({ data, title, className = "" }) => {
  const total = data.reduce((sum, item) => sum + item.count, 0)
  
  if (total === 0) {
    return (
      <div className={`text-center py-6 ${className}`}>
        <div className="text-gray-400 text-sm">No data available</div>
      </div>
    )
  }

  let cumulativePercentage = 0
  
  return (
    <div className={`space-y-4 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700 text-center">{title}</h4>
      
      {/* Pie Chart */}
      <div className="flex justify-center">
        <div className="relative w-48 h-48">
          <svg width="192" height="192" className="transform -rotate-90">
            {data.map((item, index) => {
              const percentage = (item.count / total) * 100
              const strokeDasharray = `${percentage * 3.77} 377`
              const strokeDashoffset = -cumulativePercentage * 3.77
              cumulativePercentage += percentage
              
              return (
                <circle
                  key={index}
                  cx="96"
                  cy="96"
                  r="60"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="24"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              )
            })}
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-700">{item.name}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-800">{item.count}</span>
              <span className="text-xs text-gray-500 ml-1">({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProductDetailPage({ params }) {
  const router = useRouter()
  // Use React.use() to unwrap params
  const unwrappedParams = use(params)
  const { id } = unwrappedParams

  const [product, setProduct] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [loadAttempts, setLoadAttempts] = useState(0) // Track load attempts for retry logic
  const [reviews, setReviews] = useState([])
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [reviewsError, setReviewsError] = useState("")
  const [activeTab, setActiveTab] = useState("reviews")
  const [isFavorite, setIsFavorite] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const imageRef = useRef(null)

  // Review form state
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" })
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewSubmitError, setReviewSubmitError] = useState("")
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState("")
  const [hasUserReviewed, setHasUserReviewed] = useState(false)
  
  // Image upload state
  const [reviewImages, setReviewImages] = useState([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [imageUploadError, setImageUploadError] = useState("")

  // NEW: Product analytics state for AI agent results
  const [productAnalytics, setProductAnalytics] = useState(null)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true)
        // Use the available endpoint to get real-time availability
        const response = await fetch(`/api/products/${id}/available`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch product: ${response.status}`)
        }
        
        const data = await response.json()

        if (!data.product) {
          throw new Error('Product data not found')
        }

        setProduct(data.product)
        setError("")
        setIsLoading(false)

        // Check if product is in favorites
        const savedFavorites = localStorage.getItem("favorites")
        if (savedFavorites) {
          const favorites = JSON.parse(savedFavorites)
          setIsFavorite(favorites.includes(data.product._id))
        }
      } catch (error) {
        console.error("Fetch product error:", error)
        setError("Failed to load product. Please try again.")
        
        // If we've tried less than 3 times, try again after a short delay
        if (loadAttempts < 3) {
          setTimeout(() => {
            setLoadAttempts(prev => prev + 1)
          }, 1000)
        }
        
        setIsLoading(false)
      }
    }

    const fetchReviews = async () => {
      try {
        setIsLoadingReviews(true)
        setIsLoadingAnalytics(true)
        const response = await fetch(`/api/products/${id}/reviews`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch reviews")
        }

        setReviews(data.reviews)

        // ALWAYS generate analytics from reviews data with AI analysis
        // This ensures your AI agent logic is always connected and working
        console.log('Reviews data:', data.reviews) // Debug log
        updateAnalytics(data.reviews)
        
        // Optional: Try to fetch additional analytics from API but ALWAYS regenerate for 2-category system
        try {
          const analyticsResponse = await fetch(`/api/products/${id}/analytics`)
          if (analyticsResponse.ok) {
            const analyticsData = await analyticsResponse.json()
            if (analyticsData.success && analyticsData.data) {
              console.log('API Analytics data:', analyticsData.data) // Debug log
              // Merge API data but ALWAYS regenerate reviewAuthenticity for 2-category system
              const mergedAnalytics = generateBasicAnalytics(data.reviews)
              // Keep API data for other metrics but use our 2-category system for bar graph
              mergedAnalytics.avgConfidence = analyticsData.data.avgConfidence
              mergedAnalytics.avgAuthenticityScore = analyticsData.data.avgAuthenticityScore
              mergedAnalytics.lastUpdated = analyticsData.data.lastUpdated
              setProductAnalytics(mergedAnalytics)
            }
          }
        } catch (analyticsError) {
          console.error("Analytics API error (using fallback):", analyticsError)
        } finally {
          setIsLoadingAnalytics(false)
        }

        // TEMPORARILY DISABLED FOR ML TESTING
        // Remove this comment and uncomment below code when ready for production
        /*
        // Check if current user has already reviewed this product
        const response2 = await fetch("/api/auth/user")
        if (response2.ok) {
          const userData = await response2.json()
          if (userData.user) {
            const userReview = data.reviews.find((review) => review.user._id === userData.user._id)
            setHasUserReviewed(!!userReview)
          }
        }
        */
      } catch (error) {
        console.error("Fetch reviews error:", error)
        setReviewsError("Failed to load reviews. Please try again.")
        setIsLoadingAnalytics(false)
      } finally {
        setIsLoadingReviews(false)
      }
    }

    if (id) {
      fetchProduct()
      fetchReviews()
    }
  }, [id, loadAttempts]) // Re-run when loadAttempts changes for retry logic

  // NEW: Generate basic analytics from reviews when API is not available
  const generateBasicAnalytics = (reviewsData) => {
    console.log('Generating analytics for', reviewsData.length, 'reviews') // Debug log
    
    const analytics = {
      totalReviews: reviewsData.length,
      displayedReviews: reviewsData.length,
      hiddenReviews: 0,
      genuine: 0,
      suspicious: 0,
      pending: 0,
      greenIndicator: 0,
      yellowIndicator: 0,
      redIndicator: 0,
      verifiedPurchasers: 0,
      unverifiedUsers: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      trustScore: '0',
      reliabilityPercentage: '0',
      chartData: {
        trustDistribution: [],
        purchaseVerification: [],
        ratingBreakdown: [],
        // NEW: Simplified 2-category analysis
        reviewAuthenticity: []
      }
    }

    reviewsData.forEach((review, index) => {
      console.log(`Review ${index + 1}:`, {
        rating: review.rating,
        hasAIAnalysis: !!review.aiAnalysis,
        classification: review.aiAnalysis?.classification,
        verifiedPurchase: review.verifiedPurchase || review.hasPurchased
      }) // Debug log
      
      // Count ratings
      if (review.rating >= 1 && review.rating <= 5) {
        analytics.ratingDistribution[review.rating]++
      }

      // Count purchase verification
      if (review.verifiedPurchase || review.hasPurchased) {
        analytics.verifiedPurchasers++
      } else {
        analytics.unverifiedUsers++
      }

      // Count AI analysis results - Your AI Agent Logic (Fixed for accurate detection)
      if (review.aiAnalysis) {
        console.log(`Review ${index + 1} AI Analysis:`, {
          classification: review.aiAnalysis.classification,
          nestedAgentApproval: review.aiAnalysis.agentApproval,
          rootAgentApproval: review.agentApproval
        }) // Enhanced debug
        
        // Check both nested and root level agentApproval like getReviewIndicator does
        const agentApproval = review.aiAnalysis.agentApproval || review.agentApproval;
        
        if (agentApproval && agentApproval.displayIndicator) {
          // Use agent approval display indicator for accurate counting
          const indicator = agentApproval.displayIndicator;
          console.log(`Review ${index + 1} using agent indicator:`, indicator);
          
          if (indicator === 'green') {
            analytics.genuine++
            analytics.greenIndicator++
          } else if (indicator === 'red') {
            analytics.suspicious++
            analytics.redIndicator++
          } else {
            // Yellow or pending - count as suspicious for now
            analytics.suspicious++
            analytics.yellowIndicator++
          }
        } else {
          // Fallback to classification if no agent approval
          if (review.aiAnalysis.classification === 'genuine') {
            analytics.genuine++
            analytics.greenIndicator++
          } else if (review.aiAnalysis.classification === 'suspicious') {
            analytics.suspicious++
            analytics.redIndicator++
          } else {
            // Pending or unknown classification
            analytics.suspicious++
            analytics.yellowIndicator++
          }
        }
      } else {
        // Reviews without AI analysis count as suspicious until analyzed
        analytics.suspicious++
        analytics.redIndicator++
      }
    })

    // Calculate average rating
    let totalRating = 0;
    let ratingCount = 0;
    reviewsData.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        totalRating += review.rating;
        ratingCount++;
      }
    });
    analytics.averageRating = ratingCount > 0 ? (totalRating / ratingCount) : 0;

    // Calculate percentages for 2-category system
    const genuinePercentage = analytics.totalReviews > 0 ? 
      ((analytics.genuine / analytics.totalReviews) * 100).toFixed(1) : '0';
    const suspiciousPercentage = analytics.totalReviews > 0 ? 
      ((analytics.suspicious / analytics.totalReviews) * 100).toFixed(1) : '0';

    // Calculate trust score (genuine percentage)
    analytics.trustScore = genuinePercentage;
    
    analytics.reliabilityPercentage = analytics.totalReviews > 0 ? 
      ((analytics.verifiedPurchasers / analytics.totalReviews) * 100).toFixed(1) : '0'

    // Generate chart data with simplified 2-category system
    analytics.chartData = {
      trustDistribution: [
        { name: 'Verified Genuine', value: analytics.greenIndicator, color: '#10B981' },
        { name: 'Needs Review', value: analytics.yellowIndicator, color: '#F59E0B' },
        { name: 'Suspicious', value: analytics.redIndicator, color: '#EF4444' }
      ],
      purchaseVerification: [
        { name: 'Verified Buyers', value: analytics.verifiedPurchasers, color: '#10B981' },
        { name: 'Unverified Users', value: analytics.unverifiedUsers, color: '#6B7280' }
      ],
      ratingBreakdown: Object.entries(analytics.ratingDistribution).map(([rating, count]) => ({
        rating: `${rating} Star`,
        count: count,
        percentage: analytics.totalReviews > 0 ? ((count / analytics.totalReviews) * 100).toFixed(1) : 0
      })),
      // NEW: Simplified 2-category authenticity chart
      reviewAuthenticity: [
        {
          name: 'Genuine Reviews',
          count: analytics.genuine,
          percentage: genuinePercentage,
          color: '#10B981' // Green
        },
        {
          name: 'Suspicious Reviews',
          count: analytics.suspicious,
          percentage: suspiciousPercentage,
          color: '#EF4444' // Red
        }
      ]
    }

    console.log('Final analytics:', {
      totalReviews: analytics.totalReviews,
      genuine: analytics.genuine,
      suspicious: analytics.suspicious,
      trustScore: analytics.trustScore,
      greenIndicator: analytics.greenIndicator,
      redIndicator: analytics.redIndicator,
      chartData: analytics.chartData.reviewAuthenticity
    }) // Debug log

    // ENSURE bar graph data always exists even if values are 0
    if (!analytics.chartData.reviewAuthenticity || analytics.chartData.reviewAuthenticity.length === 0) {
      console.log('Forcing bar graph creation with current values')
      analytics.chartData.reviewAuthenticity = [
        {
          name: 'Genuine Reviews',
          count: analytics.genuine,
          percentage: genuinePercentage,
          color: '#10B981' // Green
        },
        {
          name: 'Suspicious Reviews',
          count: analytics.suspicious,
          percentage: suspiciousPercentage,
          color: '#EF4444' // Red
        }
      ]
    }

    return analytics;
  }

  // Call setProductAnalytics to update state
  const updateAnalytics = (reviewsData) => {
    setProductAnalytics(generateBasicAnalytics(reviewsData));
  }

  // NEW: Get color indicator for review display
  const getReviewIndicator = (review) => {
    console.log('🔍 DEBUG getReviewIndicator:', {
      reviewId: review._id,
      hasAiAnalysis: !!review.aiAnalysis,
      hasNestedAgentApproval: !!review.aiAnalysis?.agentApproval,
      hasRootAgentApproval: !!review.agentApproval,
      nestedDisplayIndicator: review.aiAnalysis?.agentApproval?.displayIndicator,
      rootDisplayIndicator: review.agentApproval?.displayIndicator,
      classification: review.aiAnalysis?.classification,
      userDisplayStatus: review.aiAnalysis?.agentApproval?.userDisplayStatus
    });

    if (!review.aiAnalysis) return { color: 'yellow', status: 'Pending Review', bgColor: 'bg-yellow-50', textColor: 'text-yellow-800', borderColor: 'border-yellow-200' }
    
    // Check both nested and root level agentApproval
    const agentApproval = review.aiAnalysis.agentApproval || review.agentApproval;
    
    if (agentApproval) {
      const indicator = agentApproval.displayIndicator
      console.log('🎯 Using agentApproval indicator:', indicator, 'from:', review.aiAnalysis.agentApproval ? 'nested' : 'root');
      switch (indicator) {
        case 'green':
          return { color: 'green', status: 'Verified Genuine', bgColor: 'bg-green-50', textColor: 'text-green-800', borderColor: 'border-green-200' }
        case 'red':
          return { color: 'red', status: 'Suspicious', bgColor: 'bg-red-50', textColor: 'text-red-800', borderColor: 'border-red-200' }
        case 'yellow':
        default:
          return { color: 'yellow', status: 'Needs Review', bgColor: 'bg-yellow-50', textColor: 'text-yellow-800', borderColor: 'border-yellow-200' }
      }
    }
    
    console.log('🔄 Using fallback classification:', review.aiAnalysis.classification);
    // Fallback based on classification
    if (review.aiAnalysis.classification === 'genuine') {
      return { color: 'green', status: 'Verified Genuine', bgColor: 'bg-green-50', textColor: 'text-green-800', borderColor: 'border-green-200' }
    } else if (review.aiAnalysis.classification === 'suspicious') {
      return { color: 'red', status: 'Suspicious', bgColor: 'bg-red-50', textColor: 'text-red-800', borderColor: 'border-red-200' }
    } else {
      return { color: 'yellow', status: 'Pending Review', bgColor: 'bg-yellow-50', textColor: 'text-yellow-800', borderColor: 'border-yellow-200' }
    }
  }

  // Check if user is logged in
  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/user")
      if (!response.ok) {
        return false
      }
      const userData = await response.json()
      return !!userData.user
    } catch (error) {
      return false
    }
  }

  const handleAddToCart = async () => {
    try {
      // Check if user is logged in
      const isLoggedIn = await checkAuth()
      if (!isLoggedIn) {
        router.push('/Login')
        return
      }
      
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product._id,
          quantity,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add item to cart")
      }

      showToast("Product added to cart!", "success")
    } catch (error) {
      console.error("Add to cart error:", error)
      showToast(error.message || "Failed to add to cart", "error")
    }
  }

  // Handle Buy Now action - add to cart and redirect to checkout
  const handleBuyNow = async () => {
    try {
      // Check if user is logged in
      const isLoggedIn = await checkAuth()
      if (!isLoggedIn) {
        router.push('/Login')
        return
      }

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product._id,
          quantity,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add item to cart")
      }

      // Redirect to checkout page immediately
      router.push('/checkout')
    } catch (error) {
      console.error("Buy now error:", error)
      showToast(error.message || "Failed to process. Please try again.", "error")
    }
  }

  // Toast notification
  const showToast = (message, type = "info") => {
    const toast = document.createElement("div")
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 animate-fade-in-up ${
      type === "success" ? "bg-teal-600" : type === "error" ? "bg-red-600" : "bg-blue-600"
    }`
    toast.textContent = message
    document.body.appendChild(toast)

    setTimeout(() => {
      toast.classList.add("animate-fade-out")
      setTimeout(() => {
        document.body.removeChild(toast)
      }, 300)
    }, 3000)
  }

  // Handle image upload for reviews
  const handleImageUpload = async (files) => {
    if (files.length === 0) return;

    // Validate number of images
    if (reviewImages.length + files.length > 5) {
      setImageUploadError("Maximum 5 images allowed per review");
      return;
    }

    setIsUploadingImages(true);
    setImageUploadError("");

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`Image ${file.name} is too large. Maximum size is 5MB`);
        }
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`);
        }
        formData.append('images', file);
      });

      const response = await fetch('/api/reviews/upload-images', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload images');
      }

      // Add uploaded images to review images array
      setReviewImages(prev => [...prev, ...data.images]);
      showToast(`${data.images.length} image(s) uploaded successfully!`, "success");
    } catch (error) {
      console.error('Image upload error:', error);
      setImageUploadError(error.message);
      showToast(error.message, "error");
    } finally {
      setIsUploadingImages(false);
    }
  };

  // Remove image from review
  const removeReviewImage = (index) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault()

    if (!reviewForm.comment.trim()) {
      setReviewSubmitError("Please enter a review comment")
      return
    }

    setIsSubmittingReview(true)
    setReviewSubmitError("")
    setReviewSubmitSuccess("")

    try {
      const response = await fetch(`/api/products/${id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: reviewForm.rating,
          comment: reviewForm.comment,
          images: reviewImages, // Include uploaded images
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review")
      }

      // Add the new review to the reviews list
      setReviews((prevReviews) => {
        const updatedReviews = [data.review, ...prevReviews];
        // Recalculate analytics in real-time with the new review
        updateAnalytics(updatedReviews);
        return updatedReviews;
      })

      // Update product rating
      setProduct((prevProduct) => ({
        ...prevProduct,
        ratings:
          (prevProduct.ratings * prevProduct.numReviews + Number(reviewForm.rating)) / (prevProduct.numReviews + 1),
        numReviews: prevProduct.numReviews + 1,
      }))

      // Reset form and show success message
      setReviewForm({ rating: 5, comment: "" })
      setReviewImages([]) // Clear uploaded images
      setReviewSubmitSuccess("Your review has been submitted successfully!")
      setHasUserReviewed(true)

      // Show toast
      showToast("Review submitted successfully!", "success")
    } catch (error) {
      console.error("Submit review error:", error)
      setReviewSubmitError(error.message || "Failed to submit review. Please try again.")
      showToast("Failed to submit review", "error")
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: product.name,
          text: `Check out this ${product.name}!`,
          url: window.location.href,
        })
        .catch((error) => console.error("Error sharing:", error))
    } else {
      // Fallback for browsers that don't support the Web Share API
      prompt("Copy this link to share:", window.location.href)
    }
  }

  const toggleFavorite = () => {
    const savedFavorites = localStorage.getItem("favorites") || "[]"
    let favorites = JSON.parse(savedFavorites)

    if (isFavorite) {
      favorites = favorites.filter((fav) => fav !== product._id)
      showToast("Removed from favorites", "info")
    } else {
      favorites.push(product._id)
      showToast("Added to favorites! Favorites are stored locally on this device.", "success")
    }

    localStorage.setItem("favorites", JSON.stringify(favorites))
    setIsFavorite(!isFavorite)
  }

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % product.images.length)
  }

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length)
  }

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const handleImageZoom = (e) => {
    if (!imageRef.current) return

    const { left, top, width, height } = imageRef.current.getBoundingClientRect()
    const x = (e.clientX - left) / width
    const y = (e.clientY - top) / height

    setZoomPosition({ x, y })
  }

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 via-gray-50 to-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mb-4"></div>
          <p className="text-teal-700 animate-pulse">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 via-gray-50 to-white">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <Info size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-red-500 text-lg font-semibold mb-4">{error || "Product not found"}</p>
          <p className="text-gray-600 mb-6">We couldn&apos;t load the product. Please try again later.</p>
          <div className="flex space-x-4 justify-center">
            <button
              onClick={() => router.push("/products")}
              className="px-6 py-3 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors shadow-md"
            >
              Back to Products
            </button>
            <button
              onClick={() => setLoadAttempts(prev => prev + 1)}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors shadow-md"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-gray-50 to-white py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center text-sm text-gray-500">
            <button onClick={() => router.push("/products")} className="hover:text-teal-600 transition-colors">
              Products
            </button>
            <span className="mx-2">/</span>
            <span className="text-gray-700 font-medium truncate">{product.name}</span>
          </div>
        </div>

        {/* Product Overview */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="md:flex">
            {/* Left: Product Images */}
            <div className="md:w-1/2 bg-white border-r border-gray-100">
              <div className="relative h-80 md:h-[500px] bg-gray-50 flex items-center justify-center overflow-hidden">
                {/* Main image with zoom effect */}
                <div
                  className="relative w-full h-full flex items-center justify-center cursor-zoom-in"
                  onMouseMove={handleImageZoom}
                  onMouseEnter={() => setIsZoomed(true)}
                  onMouseLeave={() => setIsZoomed(false)}
                  ref={imageRef}
                >
                  <img
                    src={product.images[selectedImage].url || "/placeholder.svg"}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain transition-transform duration-200"
                  />

                  {isZoomed && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <img
                        src={product.images[selectedImage].url || "/placeholder.svg"}
                        alt={product.name}
                        className="absolute w-[200%] h-[200%] max-w-none object-contain"
                        style={{
                          transform: `translate(-${zoomPosition.x * 50}%, -${zoomPosition.y * 50}%)`,
                          transformOrigin: `${zoomPosition.x * 100}% ${zoomPosition.y * 100}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Image navigation arrows */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}

                {/* Discount badge */}
                {product.discount > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-semibold px-3 py-1 rounded-full shadow-md">
                    {product.discount}% OFF
                  </div>
                )}

                {/* Favorite button */}
                <button
                  onClick={toggleFavorite}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                >
                  <Heart
                    size={20}
                    className={isFavorite ? "text-red-500" : "text-gray-400"}
                    fill={isFavorite ? "currentColor" : "none"}
                  />
                </button>
              </div>

              {/* Thumbnail images */}
              {product.images.length > 1 && (
                <div className="flex overflow-x-auto p-4 space-x-3 bg-white">
                  {product.images.map((image, index) => (
                    <div
                      key={index}
                      className={`w-20 h-20 flex-shrink-0 border-2 rounded-md cursor-pointer overflow-hidden ${
                        index === selectedImage
                          ? "border-teal-500 shadow-md"
                          : "border-transparent hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img
                        src={image.url || "/placeholder.svg"}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Details */}
            <div className="md:w-1/2 p-6 md:p-8 flex flex-col">
              <div className="mb-2 flex items-center">
                <span className="text-sm font-medium text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                  {product.category}
                </span>
                {product.brand && (
                  <span className="ml-2 text-sm text-gray-500">
                    By <span className="font-medium">{product.brand}</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      fill={i < Math.floor(product.ratings || 0) ? "currentColor" : "none"}
                      stroke="currentColor"
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500 ml-2">{product.ratings?.toFixed(1) || "0.0"}</span>
                <span className="mx-2 text-gray-300">|</span>
                <button onClick={() => setActiveTab("reviews")} className="text-sm text-teal-600 hover:underline">
                  {product.numReviews || 0} {product.numReviews === 1 ? "review" : "reviews"}
                </button>
              </div>

              <div className="flex items-end mb-6">
                <span className="text-3xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="ml-3 flex flex-col">
                    <span className="text-sm text-gray-500 line-through">
                      ₹{product.originalPrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-green-600 font-medium">
                      Save ₹{(product.originalPrice - product.price).toLocaleString()} (
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%)
                    </span>
                  </div>
                )}
              </div>

              {/* Short description */}
              <div className="mb-6">
                <p className="text-gray-600">{product.description.split(".")[0]}.</p>
              </div>

              {/* Availability */}
              <div className="mb-6 flex items-center">
                {product.availableQuantity > 0 ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-green-600 font-medium">In Stock</span>
                    <span className="text-gray-500 ml-2">({product.availableQuantity} available)</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-red-600 font-medium">Out of Stock</span>
                  </>
                )}
              </div>

              {/* Quantity selector */}
              {product.availableQuantity > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <div className="flex items-center">
                    <button
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-l-md bg-gray-50 hover:bg-gray-100 transition-colors"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={product.availableQuantity}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(
                          Math.min(product.availableQuantity, Math.max(1, Number.parseInt(e.target.value) || 1)),
                        )
                      }
                      className="w-16 h-10 px-2 py-1 text-center border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => setQuantity((prev) => Math.min(product.availableQuantity, prev + 1))}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100 transition-colors"
                      disabled={quantity >= product.availableQuantity}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex space-x-3 mb-6">
                <button
                  onClick={handleAddToCart}
                  disabled={product.availableQuantity < 1}
                  className={`flex-1 py-3 px-4 rounded-md flex items-center justify-center ${
                    product.availableQuantity > 0
                      ? "bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-md"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <ShoppingCart size={18} className="mr-2" />
                  Add to Cart
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={product.availableQuantity < 1}
                  className={`flex-1 py-3 px-4 rounded-md flex items-center justify-center ${
                    product.availableQuantity > 0
                      ? "bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-md"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <CreditCard size={18} className="mr-2" />
                  Buy Now
                </button>

                <button
                  onClick={handleShare}
                  className="py-3 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors shadow-sm"
                >
                  <Share size={18} />
                </button>
              </div>

              {/* Product highlights */}
              <div className="border-t border-gray-200 pt-6 mt-auto">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Product Highlights</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Check size={16} className="text-teal-500 mr-2 flex-shrink-0" />
                    <span>Free shipping over ₹500</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <RefreshCw size={16} className="text-teal-500 mr-2 flex-shrink-0" />
                    <span>30-day returns</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Shield size={16} className="text-teal-500 mr-2 flex-shrink-0" />
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Truck size={16} className="text-teal-500 mr-2 flex-shrink-0" />
                    <span>Fast delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab("reviews")}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === "reviews"
                    ? "text-teal-600 border-b-2 border-teal-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Reviews ({product.numReviews || 0})
              </button>
              <button
                onClick={() => setActiveTab("description")}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === "description"
                    ? "text-teal-600 border-b-2 border-teal-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Description
              </button>
              {product.features && product.features.length > 0 && (
                <button
                  onClick={() => setActiveTab("features")}
                  className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                    activeTab === "features"
                      ? "text-teal-600 border-b-2 border-teal-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Features
                </button>
              )}
              {product.specifications && (
                <button
                  onClick={() => setActiveTab("specifications")}
                  className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                    activeTab === "specifications"
                      ? "text-teal-600 border-b-2 border-teal-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Specifications
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div>
                {/* Review Summary */}
                <div className="mb-8 bg-gray-50 p-6 rounded-lg">
                  <div className="md:flex items-start">
                    <div className="md:w-1/3 mb-6 md:mb-0">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-gray-900 mb-2">
                          {productAnalytics && productAnalytics.averageRating !== undefined ? productAnalytics.averageRating.toFixed(1) : "0.0"}
                        </div>
                        <div className="flex justify-center text-yellow-400 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={20}
                              fill={i < Math.floor(productAnalytics?.averageRating || 0) ? "currentColor" : "none"}
                              stroke="currentColor"
                            />
                          ))}
                        </div>
                        <div className="text-sm text-gray-500">
                          Based on {productAnalytics && productAnalytics.totalReviews !== undefined ? productAnalytics.totalReviews : 0} reviews
                        </div>
                      </div>
                    </div>
                    
                    {/* Rating Distribution */}
                    <div className="md:w-2/3 md:pl-8">
                      <h4 className="font-medium text-gray-900 mb-4">Rating Distribution</h4>
                      {productAnalytics && productAnalytics.chartData && productAnalytics.chartData.ratingBreakdown ? (
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map((rating) => {
                            const ratingData = productAnalytics.chartData.ratingBreakdown.find(
                              item => item.rating === `${rating} Star`
                            ) || { count: 0, percentage: 0 };
                            
                            return (
                              <div key={rating} className="flex items-center">
                                <div className="flex items-center w-16">
                                  <span className="text-sm text-gray-600 mr-1">{rating}</span>
                                  <Star size={14} className="text-yellow-400" fill="currentColor" />
                                </div>
                                <div className="flex-1 mx-3">
                                  <div className="bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                      style={{
                                        width: `${ratingData.percentage}%`
                                      }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 w-20">
                                  <span className="text-sm text-gray-600">{ratingData.count}</span>
                                  <span className="text-xs text-gray-500">({ratingData.percentage}%)</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No rating data available</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Review Form */}
                {/* TEMPORARILY ALLOWING MULTIPLE REVIEWS FOR ML TESTING */}
                {/* Change this back to {!hasUserReviewed ? ( for production */}
                {true ? (
                  <div className="mb-8 border-b border-gray-200 pb-8">
                    <h3 className="text-lg font-semibold mb-4">Write a Review</h3>

                    <form onSubmit={handleSubmitReview}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}
                              className="p-1 focus:outline-none"
                            >
                              <Star
                                size={24}
                                className="text-yellow-400"
                                fill={star <= reviewForm.rating ? "currentColor" : "none"}
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-gray-600">({reviewForm.rating}/5)</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                        <textarea
                          rows="4"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Share your experience with this product..."
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                          required
                        ></textarea>
                      </div>

                      {/* Image Upload Section */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Add Photos (Optional)
                        </label>
                        <div className="space-y-3">
                          {/* Upload Area */}
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                            <input
                              type="file"
                              id="review-images"
                              multiple
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e.target.files)}
                              className="hidden"
                              disabled={isUploadingImages || reviewImages.length >= 5}
                            />
                            <label
                              htmlFor="review-images"
                              className={`cursor-pointer ${isUploadingImages || reviewImages.length >= 5 ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                              <div className="flex flex-col items-center">
                                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <p className="text-sm text-gray-600">
                                  {isUploadingImages ? 'Uploading...' : 'Click to upload images'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Maximum 5 images, 5MB each (JPEG, PNG, WebP)
                                </p>
                              </div>
                            </label>
                          </div>

                          {/* Image Upload Error */}
                          {imageUploadError && (
                            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
                              {imageUploadError}
                            </div>
                          )}

                          {/* Uploaded Images Preview */}
                          {reviewImages.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {reviewImages.map((image, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={image.url}
                                    alt={`Review image ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeReviewImage(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Images Count */}
                          {reviewImages.length > 0 && (
                            <p className="text-sm text-gray-600">
                              {reviewImages.length}/5 images uploaded
                            </p>
                          )}
                        </div>
                      </div>

                      {reviewSubmitError && (
                        <div className="p-3 mb-4 bg-red-50 text-red-700 text-sm rounded-md">{reviewSubmitError}</div>
                      )}

                      {reviewSubmitSuccess && (
                        <div className="p-3 mb-4 bg-green-50 text-green-700 text-sm rounded-md">
                          {reviewSubmitSuccess}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-70 transition-colors"
                      >
                        {isSubmittingReview ? "Submitting..." : "Submit Review"}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="mb-8 pb-8 border-b border-gray-200">
                    <div className="bg-teal-50 p-4 rounded-md flex items-center">
                      <Check size={18} className="text-teal-600 mr-2" />
                      <p className="text-teal-700">
                        You have already reviewed this product. Thank you for your feedback!
                      </p>
                    </div>
                  </div>
                )}

                {/* Simplified Pie Chart Only - No Analytics Overview Cards */}
                {!isLoadingAnalytics && productAnalytics && (
                  <div className="mb-8 pb-8 border-b border-gray-200">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                        <Shield size={18} className="mr-2 text-teal-600" />
                        Review Authenticity Analysis
                        {/* Debug info */}
                        <span className="ml-2 text-xs text-gray-500">
                          (Total: {productAnalytics.totalReviews || 0}, 
                          Genuine: {productAnalytics.genuine || 0}, 
                          Suspicious: {productAnalytics.suspicious || 0})
                        </span>
                      </h4>
                      
                      {productAnalytics.chartData?.reviewAuthenticity && productAnalytics.chartData.reviewAuthenticity.length > 0 ? (
                        <SimplePieChart 
                          data={productAnalytics.chartData.reviewAuthenticity}
                          title="Review Analysis Distribution"
                        />
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <Shield size={24} className="mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">
                            {productAnalytics.totalReviews === 0 
                              ? "No reviews available for analysis" 
                              : `${productAnalytics.totalReviews} reviews found, AI analysis in progress...`
                            }
                          </p>
                          {/* Force show basic pie chart if we have reviews but no chart data */}
                          {productAnalytics.totalReviews > 0 && (
                            <SimplePieChart 
                              data={[
                                {
                                  name: 'Genuine Reviews',
                                  count: productAnalytics.genuine || 0,
                                  percentage: productAnalytics.totalReviews > 0 ? 
                                    ((productAnalytics.genuine / productAnalytics.totalReviews) * 100).toFixed(1) : '0',
                                  color: '#10B981'
                                },
                                {
                                  name: 'Suspicious Reviews',
                                  count: productAnalytics.suspicious || 0,
                                  percentage: productAnalytics.totalReviews > 0 ? 
                                    ((productAnalytics.suspicious / productAnalytics.totalReviews) * 100).toFixed(1) : '0',
                                  color: '#EF4444'
                                }
                              ]}
                              title="Review Analysis Distribution"
                              className="mt-4"
                            />
                          )}
                          {/* Debug: Show raw analytics data */}
                          <details className="mt-2 text-xs">
                            <summary className="cursor-pointer">Debug Info</summary>
                            <pre className="bg-gray-100 p-2 rounded mt-1 text-left overflow-auto">
                              {JSON.stringify(productAnalytics, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <MessageCircle size={18} className="mr-2 text-teal-600" />
                    {reviews.length === 0 ? "No Reviews Yet" : `Customer Reviews (${reviews.length})`}
                  </h3>

                  {isLoadingReviews ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
                    </div>
                  ) : reviewsError ? (
                    <div className="p-4 bg-red-50 text-red-700 text-sm rounded-md">{reviewsError}</div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Bookmark size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500 mb-4">Be the first to review this product!</p>
                      <button
                        onClick={() => setActiveTab("reviews")}
                        className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
                        // TEMPORARILY DISABLED FOR ML TESTING
                        // disabled={hasUserReviewed}
                        disabled={false}
                      >
                        Write a Review
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {reviews.map((review) => {
                        const indicator = getReviewIndicator(review)
                        return (
                          <div key={review._id} className={`border-b border-gray-100 pb-6 last:border-0 relative ${indicator.bgColor} ${indicator.borderColor} border rounded-lg p-4`}>
                            {/* NEW: AI Status Indicator Badge */}
                            <div className="absolute top-2 right-2">
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${indicator.bgColor} ${indicator.textColor} border ${indicator.borderColor}`}>
                                {indicator.color === 'green' && <Shield size={10} className="mr-1" />}
                                {indicator.color === 'red' && <AlertTriangle size={10} className="mr-1" />}
                                {indicator.color === 'yellow' && <Info size={10} className="mr-1" />}
                                {indicator.status}
                              </div>
                            </div>

                            <div className="flex items-center mb-2">
                              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 mr-3">
                                {review.user.profilePicture ? (
                                  <img
                                    src={review.user.profilePicture || "/placeholder.svg"}
                                    alt={review.user.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <User size={20} className="text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 mr-20">
                                <div className="flex items-center space-x-2">
                                  <p className="font-medium text-gray-900">{review.user.name}</p>
                                  {(review.verifiedPurchase || review.hasPurchased) && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <Check size={10} className="mr-1" />
                                      Verified Purchase
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                              </div>
                            </div>

                            <div className="flex mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  className="text-yellow-400"
                                  fill={i < review.rating ? "currentColor" : "none"}
                                />
                              ))}
                            </div>

                            <p className="text-gray-700 whitespace-pre-line">{review.comment}</p>
                            
                            {/* Review Images */}
                            {review.images && review.images.length > 0 && (
                              <div className="mt-3">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {review.images.map((image, index) => (
                                    <img
                                      key={index}
                                      src={image.url}
                                      alt={`Review image ${index + 1}`}
                                      className="w-full h-24 sm:h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
                                      onClick={() => {
                                        // Optional: Add image lightbox/modal functionality here
                                        window.open(image.url, '_blank');
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description Tab */}
            {activeTab === "description" && (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* Features Tab */}
            {activeTab === "features" && product.features && (
              <div>
                <ul className="space-y-3">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check size={18} className="text-teal-500 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specifications Tab */}
            {activeTab === "specifications" && product.specifications && (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <tr key={key}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                          {key}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-700">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>









        {/* Related Products Section */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {product.relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct._id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/products/${relatedProduct._id}`)}
                >
                  <div className="h-40 bg-gray-100 overflow-hidden">
                    <img
                      src={relatedProduct.mainImage || "/placeholder.svg"}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-1 truncate">{relatedProduct.name}</h3>

                    <div className="flex items-center mb-1">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill={i < Math.floor(relatedProduct.ratings || 0) ? "currentColor" : "none"}
                            stroke="currentColor"
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 ml-1">({relatedProduct.numReviews || 0})</span>
                    </div>

                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">₹{relatedProduct.price.toLocaleString()}</span>
                      {relatedProduct.originalPrice && relatedProduct.originalPrice > relatedProduct.price && (
                        <span className="text-xs text-gray-500 line-through ml-2">
                          ₹{relatedProduct.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-out {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
        
        .animate-fade-out {
          animation: fade-out 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}