"use client";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import api from "../../utils/api";

export default function EventDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id;
  
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  // Check for payment status from URL query params
  useEffect(() => {
    if (searchParams.get('payment_success') === "true") {
      alert("Payment successful! You are now registered for the event.");
    } else if (searchParams.get('payment_canceled') === "true") {
      alert("Payment was canceled. You can try again later.");
    }
  }, [searchParams]);

  // Fetch event data and user profile
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch event details
        const eventResponse = await api.get(`/api/events/${id}/`);
        setEvent(eventResponse.data);
        
        // Fetch current user profile
        try {
          const profileResponse = await api.get("/api/profile/");
          setCurrentUser(profileResponse.data);
        } catch (profileError) {
          console.error("Error fetching user profile:", profileError);
        }
      } catch (err) {
        console.error("Error fetching event details:", err);
        setError("Failed to load event details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  // Check if user is attending
  const isUserAttending = () => {
    return currentUser && event?.attendees?.includes(currentUser.id);
  };
  
  // Format price for display
  const formatPrice = (price: number | string | null | undefined) => {
    if (price === null || price === undefined || price === '') return 'Free';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice <= 0 ? 'Free' : `$${numPrice.toFixed(2)}`;
  };
  
  // Handle buy ticket button click
  const handleBuyTicket = async () => {
    if (!currentUser) {
      alert("You need to be logged in to purchase tickets");
      router.push("/login");
      return;
    }
    
    if (!event || !event.id) {
      setError("Event information is missing");
      return;
    }
    
    try {
      setCheckoutLoading(true);
      
      // Create checkout session
      const response = await api.post(`/api/events/${event.id}/checkout/`);
      
      // For free events, we'll get a success message back
      if (response.data.success) {
        alert("You have successfully registered for this event!");
        // Refresh the event data
        const updatedEventResponse = await api.get(`/api/events/${event.id}/`);
        setEvent(updatedEventResponse.data);
        setCheckoutLoading(false);
        return;
      }
      
      // For paid events, redirect to Stripe
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Failed to process payment. Please try again.");
      setCheckoutLoading(false);
    }
  };

  // Go back to events list
  const handleBackToEvents = () => {
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#EAF6FF" }}>
        <Navbar />
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 flex justify-center">
          <div className="text-center">
            <p style={{ color: "#666B6A" }}>Loading event details...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !event) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#EAF6FF" }}>
        <Navbar />
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-red-600">Error</h1>
            <p className="mt-2 text-gray-600">{error || "Event not found"}</p>
            <button
              onClick={handleBackToEvents}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#EAF6FF" }}>
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-6">
          <button
            onClick={handleBackToEvents}
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Events
          </button>
        </div>
        
        {/* Event information */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200" style={{ borderTop: "4px solid #86CD82" }}>
            <h1 className="text-3xl font-bold" style={{ color: "#08090A" }}>
              {event.title}
            </h1>
          </div>
          
          <div className="p-6">
            {/* Description */}
            <div className="mb-8">
              <p className="text-gray-700">{event.description}</p>
            </div>
            
            {/* Event details */}
            <div className="space-y-4 mb-8">
              {/* Date and Time */}
              <div className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Date and Time</h3>
                  <p className="text-gray-600">{formatDate(event.date)}</p>
                </div>
              </div>
              
              {/* Location */}
              {event.location && (
                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-3 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Location</h3>
                    <p className="text-gray-600">{event.location}</p>
                  </div>
                </div>
              )}
              
              {/* Virtual Location */}
              {event.virtual_location && (
                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-3 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Virtual Location</h3>
                    {isUserAttending() ? (
                      <a
                        href={event.virtual_location}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Join Virtual Event
                      </a>
                    ) : (
                      <p className="text-gray-600">Available after registration</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Buy Ticket Button */}
            <div className="mt-10 border-t border-gray-200 pt-6">
              {isUserAttending() ? (
                <div className="bg-green-100 text-green-800 px-4 py-3 rounded-md">
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">You're already registered for this event</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center sm:flex-row sm:justify-between sm:items-baseline">
                  <div className="mb-4 sm:mb-0">
                    <p className="text-xl font-medium text-gray-900">
                      {formatPrice(event.ticket_price)}
                    </p>
                  </div>
                  <button
                    onClick={handleBuyTicket}
                    disabled={checkoutLoading}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-md shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70"
                  >
                    {checkoutLoading
                      ? "Processing..."
                      : `Buy Ticket`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}