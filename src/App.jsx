import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import MyAccount from './components/MyAccount';
import AdsSidebar from './components/AdsSidebar';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showMyAccount, setShowMyAccount] = useState(false);

  // Chat States
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'ai',
      text: "Hi! I'm your AI travel agent, and I'm here to help you find the perfect flight!",
      timestamp: '12:13 PM'
    },
    {
      id: 2,
      type: 'ai',
      text: 'You can tell me your trip details however you like! For example:\n\n🎯 All at once: "I want to fly from New York to London on Dec 15, returning Dec 22, 2 passengers, economy"\n\n🎯 Or just start: "London on Dec 23rd"\n\nI\'ll figure out what you mean and ask about anything I\'m missing. What\'s your trip?',
      timestamp: '12:13 PM'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Search & Filter States
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    departDate: '',
    returnDate: '',
    passengers: 1,
    cabinClass: 'economy'
  });

  // Enhanced Filter States (Kayak-style)
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [stops, setStops] = useState('any');
  const [departureTime, setDepartureTime] = useState([]);
  const [arrivalTime, setArrivalTime] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [duration, setDuration] = useState([0, 24]);
  
  // Sort State
  const [sortBy, setSortBy] = useState('best');

  // Results State
  const [flights, setFlights] = useState([]);
  const [allFlights, setAllFlights] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          type: 'ai',
          text: `Welcome back, ${session.user.user_metadata?.full_name || 'traveler'}! 👋`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN') {
        setShowSignIn(false);
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          type: 'ai',
          text: `Welcome back, ${session.user.user_metadata?.full_name || 'traveler'}! 👋`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Filter flights whenever filter state changes
  useEffect(() => {
    if (allFlights.length > 0) {
      let filtered = [...allFlights];

      // Price filter
      filtered = filtered.filter(f => f.price >= priceRange[0] && f.price <= priceRange[1]);

      // Stops filter
      if (stops === 'nonstop') {
        filtered = filtered.filter(f => f.stops === 'Nonstop');
      } else if (stops === '1stop') {
        filtered = filtered.filter(f => f.stops === '1 stop');
      }

      // Airlines filter
      if (airlines.length > 0) {
        filtered = filtered.filter(f => airlines.includes(f.airline));
      }

      // Departure time filter
      if (departureTime.length > 0) {
        filtered = filtered.filter(f => {
          const hour = parseInt(f.departure.split(':')[0]);
          const isPM = f.departure.includes('PM');
          const hour24 = isPM && hour !== 12 ? hour + 12 : hour;
          
          return departureTime.some(timeSlot => {
            if (timeSlot === 'morning') return hour24 >= 5 && hour24 < 12;
            if (timeSlot === 'afternoon') return hour24 >= 12 && hour24 < 18;
            if (timeSlot === 'evening') return hour24 >= 18 || hour24 < 5;
            return true;
          });
        });
      }

      // Sort filtered results
      filtered = sortFlights(filtered, sortBy);
      
      setFlights(filtered);
    }
  }, [priceRange, stops, airlines, departureTime, arrivalTime, duration, sortBy, allFlights]);

  // Sort function
  const sortFlights = (flightList, sortType) => {
    const sorted = [...flightList];
    
    switch(sortType) {
      case 'cheapest':
        return sorted.sort((a, b) => a.price - b.price);
      case 'fastest':
        return sorted.sort((a, b) => {
          const getDuration = (dur) => {
            const [hours, mins] = dur.replace('h', '').replace('m', '').split(' ');
            return parseInt(hours) * 60 + parseInt(mins);
          };
          return getDuration(a.duration) - getDuration(b.duration);
        });
      case 'best':
      default:
        // Best = combination of price, duration, and prediction
        return sorted.sort((a, b) => {
          const scoreA = a.price + (a.prediction === 'up' ? 50 : a.prediction === 'down' ? -50 : 0);
          const scoreB = b.price + (b.prediction === 'up' ? 50 : b.prediction === 'down' ? -50 : 0);
          return scoreA - scoreB;
        });
    }
  };

  // Toggle functions for filters
  const toggleAirline = (airline) => {
    setAirlines(prev => 
      prev.includes(airline) 
        ? prev.filter(a => a !== airline)
        : [...prev, airline]
    );
  };

  const toggleDepartureTime = (time) => {
    setDepartureTime(prev =>
      prev.includes(time)
        ? prev.filter(t => t !== time)
        : [...prev, time]
    );
  };

  const handleSuggestionClick = (suggestion) => {
    setChatInput(suggestion);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);

    try {
      // Call our serverless API endpoint (not Anthropic directly)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `You are a helpful flight search assistant. Parse this flight search query and respond in a friendly way: "${chatInput}". If you can identify flight details (origin, destination, dates, passengers, class), acknowledge them. If information is missing, ask for it naturally.`
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      const aiResponse = data.content[0].text;

      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          type: 'ai',
          text: aiResponse,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }]);
        setIsTyping(false);

        // Simulate search with mock data
        if (chatInput.toLowerCase().includes('search') || chatInput.toLowerCase().includes('find')) {
          simulateSearch();
        }
      }, 1000);

    } catch (error) {
      console.error('Error:', error);
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        text: "I'm having trouble connecting right now. Please try again!",
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }
  };

  const simulateSearch = () => {
    setLoading(true);
    
    setTimeout(() => {
      const mockFlights = [
        {
          id: 1,
          airline: 'United Airlines',
          logo: '🛫',
          aircraft: 'Boeing 787',
          from: 'IAH',
          to: 'DEL',
          departure: '10:30 AM',
          arrival: '2:15 PM +1',
          duration: '15h 45m',
          stops: 'Nonstop',
          price: 850,
          emission: '2,100kg',
          prediction: 'down',
          predictionPercent: 12,
          predictionText: 'Our AI predicts prices will drop by 12% in the next 3 days. Consider waiting!',
          bookingUrl: 'https://www.kayak.com',
          jetLag: {
            severity: 'Moderate',
            timeDifference: '+10.5 hours',
            tips: [
              'Start adjusting sleep schedule 3 days before departure',
              'Stay hydrated during the flight',
              'Get sunlight exposure upon arrival',
              'Avoid heavy meals before sleeping'
            ]
          }
        },
        {
          id: 2,
          airline: 'Delta',
          logo: '✈️',
          aircraft: 'Airbus A350',
          from: 'IAH',
          to: 'DEL',
          departure: '6:45 PM',
          arrival: '11:30 AM +1',
          duration: '16h 45m',
          stops: '1 stop',
          price: 720,
          emission: '1,950kg',
          prediction: 'stable',
          predictionPercent: 0,
          predictionText: 'Prices are stable. Book now to secure this rate.',
          bookingUrl: 'https://www.kayak.com',
          jetLag: {
            severity: 'Moderate',
            timeDifference: '+10.5 hours',
            tips: [
              'Take short naps during layover',
              'Drink water frequently',
              'Avoid caffeine 6 hours before landing',
              'Use melatonin if needed'
            ]
          }
        },
        {
          id: 3,
          airline: 'British Airways',
          logo: '🛩️',
          aircraft: 'Boeing 777',
          from: 'IAH',
          to: 'DEL',
          departure: '8:15 AM',
          arrival: '1:45 PM +1',
          duration: '17h 30m',
          stops: '1 stop',
          price: 680,
          emission: '2,050kg',
          prediction: 'up',
          predictionPercent: 8,
          predictionText: 'Prices likely to increase by 8% soon. Book now for best value!',
          bookingUrl: 'https://www.kayak.com',
          jetLag: {
            severity: 'High',
            timeDifference: '+10.5 hours',
            tips: [
              'Adjust sleep 2-3 days early',
              'Stay active during flight',
              'Eat light meals',
              'Expose yourself to daylight'
            ]
          }
        }
      ];

      setAllFlights(mockFlights);
      setFlights(mockFlights);
      setLoading(false);

      setChatMessages(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        text: `Great! I found ${mockFlights.length} flights for you. Check out the results below! 🎉`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 2000);
  };

  const handleOAuthSignIn = async (provider) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      alert('Sign in failed. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setShowMyAccount(false);
      setChatMessages([
        {
          id: 1,
          type: 'ai',
          text: "Hi! I'm your AI travel agent, and I'm here to help you find the perfect flight!",
          timestamp: '12:13 PM'
        }
      ]);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getFilteredFlights = () => {
    return flights;
  };

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">✈️</span>
            <span>FlightSearch AI</span>
          </div>
          <div className="nav">
            <a href="#how-it-works">How it Works</a>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="header-actions">
            {user ? (
              <button className="user-account-btn" onClick={() => setShowMyAccount(true)}>
                <span className="user-icon">👤</span>
                My Account
              </button>
            ) : (
              <button className="sign-in-btn" onClick={() => setShowSignIn(true)}>
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="main-container">
        <div className="content-area">
          
          {/* Hero Section */}
          {flights.length === 0 && (
            <div className="hero-section">
              <div className="hero-badge">
                <span className="badge-dot"></span>
                AI-Powered Travel Assistant
              </div>
              
              <h1 className="hero-title">
                Book flights the<br />smart way
              </h1>
              
              <p className="hero-subtitle">
                Skip the endless searching. Just tell our AI where you want to go, 
                and we'll find the perfect flight with price predictions and jet lag tips—all in one conversation.
              </p>

              {/* AI Chat Interface */}
              <div className="ai-chat-container">
                <div className="ai-chat-header">
                  <div className="ai-avatar">🤖</div>
                  <div className="ai-greeting">
                    <h2>Your AI Travel Assistant</h2>
                    <p>Ready to help you find the perfect flight</p>
                  </div>
                  <div className="status-indicator">
                    <span className="status-dot"></span>
                    Online
                  </div>
                </div>

                <div className="chat-messages">
                  {chatMessages.map((message) => (
                    <div key={message.id} className={`message ${message.type}`}>
                      <div className="message-content">
                        <div className="message-text">{message.text}</div>
                        <div className="message-timestamp">{message.timestamp}</div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="message ai">
                      <div className="message-content">
                        <div className="typing-indicator">
                          <span></span><span></span><span></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="chat-suggestions">
                  <div className="suggestions-label">Popular searches</div>
                  <div className="suggestion-chips">
                    <div className="chip" onClick={() => handleSuggestionClick('Beach vacation under $800')}>
                      <span className="chip-icon">🏖️</span>
                      <span>Beach vacation under $800</span>
                    </div>
                    <div className="chip" onClick={() => handleSuggestionClick('Cheap flights to Europe')}>
                      <span className="chip-icon">🌍</span>
                      <span>Cheap flights to Europe</span>
                    </div>
                    <div className="chip" onClick={() => handleSuggestionClick('Business class to Tokyo')}>
                      <span className="chip-icon">💼</span>
                      <span>Business class to Tokyo</span>
                    </div>
                    <div className="chip" onClick={() => handleSuggestionClick('Weekend getaway ideas')}>
                      <span className="chip-icon">🎉</span>
                      <span>Weekend getaway ideas</span>
                    </div>
                  </div>
                </div>

                <div className="chat-input-area">
                  <div className="input-wrapper">
                    <input 
                      type="text" 
                      className="chat-input" 
                      placeholder="Where would you like to go?"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button className="voice-btn">🎤</button>
                    <button className="send-btn" onClick={handleSendMessage}>Send</button>
                  </div>
                </div>
              </div>

              {/* Trust Signals */}
              <div className="trust-section">
                <div className="trust-item">
                  <div className="trust-number">50K+</div>
                  <div className="trust-label">Happy Travelers</div>
                </div>
                <div className="trust-item">
                  <div className="trust-number">$5.2M</div>
                  <div className="trust-label">Money Saved</div>
                </div>
                <div className="trust-item">
                  <div className="trust-number">4.9★</div>
                  <div className="trust-label">Average Rating</div>
                </div>
                <div className="trust-item">
                  <div className="trust-number">95%</div>
                  <div className="trust-label">Would Recommend</div>
                </div>
              </div>
            </div>
          )}

          {/* Features Preview */}
          {flights.length === 0 && (
            <div className="features-preview" id="features">
              <h2 className="features-title">Everything you need in one place</h2>
              <p className="features-subtitle">Powered by AI to make travel booking simple, smart, and stress-free</p>
              
              <div className="features-grid">
                <div className="feature-card">
                  <span className="feature-icon">💬</span>
                  <div className="feature-title">Natural Conversation</div>
                  <div className="feature-description">
                    Just chat naturally—no forms, no confusion. Tell us what you want and we'll handle the rest.
                  </div>
                </div>

                <div className="feature-card">
                  <span className="feature-icon">📈</span>
                  <div className="feature-title">Price Predictions</div>
                  <div className="feature-description">
                    AI forecasts tell you when prices will rise or drop, so you always book at the right time.
                  </div>
                </div>

                <div className="feature-card">
                  <span className="feature-icon">😴</span>
                  <div className="feature-title">Jet Lag Optimizer</div>
                  <div className="feature-description">
                    Get personalized tips to beat jet lag based on your specific flight and time zones.
                  </div>
                </div>

                <div className="feature-card">
                  <span className="feature-icon">⚡</span>
                  <div className="feature-title">Instant Results</div>
                  <div className="feature-description">
                    Search hundreds of flights in seconds with smart filters that learn your preferences.
                  </div>
                </div>

                <div className="feature-card">
                  <span className="feature-icon">🔒</span>
                  <div className="feature-title">Secure Booking</div>
                  <div className="feature-description">
                    Book directly with airlines through our secure platform. No hidden fees, ever.
                  </div>
                </div>

                <div className="feature-card">
                  <span className="feature-icon">💡</span>
                  <div className="feature-title">Smart Suggestions</div>
                  <div className="feature-description">
                    Not sure where to go? Our AI suggests destinations based on your budget and interests.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Social Proof */}
          {flights.length === 0 && (
            <div className="social-proof">
              <h2 className="social-title">Loved by travelers worldwide</h2>
              <p className="social-subtitle">See what our customers are saying</p>

              <div className="testimonials">
                <div className="testimonial">
                  <div className="stars">★★★★★</div>
                  <div className="testimonial-text">
                    "This is genuinely the future of travel booking. I just told it where I wanted to go 
                    and it found me the perfect flight in seconds. The jet lag tips actually worked!"
                  </div>
                  <div className="testimonial-author">
                    <div className="author-avatar">SM</div>
                    <div className="author-info">
                      <div className="author-name">Sarah Mitchell</div>
                      <div className="author-title">Digital Nomad</div>
                    </div>
                  </div>
                </div>

                <div className="testimonial">
                  <div className="stars">★★★★★</div>
                  <div className="testimonial-text">
                    "Saved me 6 hours of research AND $400 on my London flight. 
                    The price prediction said to wait 2 days and it was spot on. Amazing."
                  </div>
                  <div className="testimonial-author">
                    <div className="author-avatar">JC</div>
                    <div className="author-info">
                      <div className="author-name">James Chen</div>
                      <div className="author-title">Business Consultant</div>
                    </div>
                  </div>
                </div>

                <div className="testimonial">
                  <div className="stars">★★★★★</div>
                  <div className="testimonial-text">
                    "Finally, a booking site that doesn't make me want to scream. 
                    It's like having a knowledgeable friend who loves travel in your pocket."
                  </div>
                  <div className="testimonial-author">
                    <div className="author-avatar">EG</div>
                    <div className="author-info">
                      <div className="author-name">Emily Garcia</div>
                      <div className="author-title">Travel Blogger</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CTA Section */}
          {flights.length === 0 && (
            <div className="cta-section">
              <div className="cta-box">
                <h2 className="cta-title">Ready to travel smarter?</h2>
                <p className="cta-subtitle">Join thousands who never overpay for flights</p>
                <button className="cta-button" onClick={() => document.querySelector('.chat-input').focus()}>
                  Start Planning Your Trip →
                </button>
              </div>
            </div>
          )}

          {/* Flight Results Section */}
          {flights.length > 0 && (
            <section className="results-section">
              <div className="filters-sidebar">
                <h3 className="filters-title">Filters</h3>

                {/* Price Range */}
                <div className="filter-group">
                  <h4>Price Range</h4>
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                  />
                  <div className="price-display">
                    ${priceRange[0]} - ${priceRange[1]}
                  </div>
                </div>

                {/* Stops */}
                <div className="filter-group">
                  <h4>Stops</h4>
                  <label>
                    <input
                      type="radio"
                      name="stops"
                      checked={stops === 'any'}
                      onChange={() => setStops('any')}
                    />
                    Any
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="stops"
                      checked={stops === 'nonstop'}
                      onChange={() => setStops('nonstop')}
                    />
                    Nonstop
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="stops"
                      checked={stops === '1stop'}
                      onChange={() => setStops('1stop')}
                    />
                    1 Stop
                  </label>
                </div>

                {/* Airlines */}
                <div className="filter-group">
                  <h4>Airlines</h4>
                  <label>
                    <input
                      type="checkbox"
                      checked={airlines.includes('United Airlines')}
                      onChange={() => toggleAirline('United Airlines')}
                    />
                    United Airlines
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={airlines.includes('Delta')}
                      onChange={() => toggleAirline('Delta')}
                    />
                    Delta
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={airlines.includes('American Airlines')}
                      onChange={() => toggleAirline('American Airlines')}
                    />
                    American Airlines
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={airlines.includes('British Airways')}
                      onChange={() => toggleAirline('British Airways')}
                    />
                    British Airways
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={airlines.includes('Virgin Atlantic')}
                      onChange={() => toggleAirline('Virgin Atlantic')}
                    />
                    Virgin Atlantic
                  </label>
                </div>

                {/* Departure Time */}
                <div className="filter-group">
                  <h4>Departure Time</h4>
                  <label>
                    <input
                      type="checkbox"
                      checked={departureTime.includes('morning')}
                      onChange={() => toggleDepartureTime('morning')}
                    />
                    Morning (5AM - 12PM)
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={departureTime.includes('afternoon')}
                      onChange={() => toggleDepartureTime('afternoon')}
                    />
                    Afternoon (12PM - 6PM)
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={departureTime.includes('evening')}
                      onChange={() => toggleDepartureTime('evening')}
                    />
                    Evening (6PM - 5AM)
                  </label>
                </div>

                {/* Flight Duration */}
                <div className="filter-group">
                  <h4>Max Duration</h4>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    value={duration[1]}
                    onChange={(e) => setDuration([0, Number(e.target.value)])}
                  />
                  <div className="price-display">
                    Up to {duration[1]} hours
                  </div>
                </div>
              </div>

              <div className="results-content">
                <div className="results-header">
                  <h3>{flights.length} Flights Found</h3>
                  <div className="sort-options">
                    <button 
                      className={`sort-btn ${sortBy === 'best' ? 'active' : ''}`}
                      onClick={() => setSortBy('best')}
                    >
                      Best
                    </button>
                    <button 
                      className={`sort-btn ${sortBy === 'cheapest' ? 'active' : ''}`}
                      onClick={() => setSortBy('cheapest')}
                    >
                      Cheapest
                    </button>
                    <button 
                      className={`sort-btn ${sortBy === 'fastest' ? 'active' : ''}`}
                      onClick={() => setSortBy('fastest')}
                    >
                      Fastest
                    </button>
                  </div>
                </div>

                <div className="flights-list">
                  {getFilteredFlights().map((flight) => (
                    <div key={flight.id} className="flight-card">
                      <div className="flight-main">
                        <div className="airline-info">
                          <span className="airline-logo">{flight.logo}</span>
                          <div>
                            <div className="airline-name">{flight.airline}</div>
                            <div className="aircraft">{flight.aircraft}</div>
                          </div>
                        </div>

                        <div className="flight-times">
                          <div className="time-block">
                            <div className="time">{flight.departure}</div>
                            <div className="location">{flight.from}</div>
                          </div>
                          <div className="flight-duration">
                            <div className="duration-line">
                              <div className="plane-icon">✈️</div>
                            </div>
                            <div className="duration-text">{flight.duration}</div>
                            <div className="stops-info">{flight.stops}</div>
                          </div>
                          <div className="time-block">
                            <div className="time">{flight.arrival}</div>
                            <div className="location">{flight.to}</div>
                          </div>
                        </div>

                        <div className="flight-price">
                          <div className="price">${flight.price}</div>
                          <div className="price-prediction">
                            {flight.prediction === 'up' && (
                              <span className="pred-up">
                                📈 +{flight.predictionPercent}% likely
                              </span>
                            )}
                            {flight.prediction === 'down' && (
                              <span className="pred-down">
                                📉 -{flight.predictionPercent}% likely
                              </span>
                            )}
                            {flight.prediction === 'stable' && (
                              <span className="pred-stable">📊 Stable</span>
                            )}
                          </div>
                          <div className="emission-badge">{flight.emission} CO₂</div>
                        </div>

                        <a 
                          href={flight.bookingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="select-btn"
                        >
                          Book Now →
                        </a>
                      </div>

                      {/* Expandable Details */}
                      <div className="flight-details">
                        <div className="detail-section">
                          <h4>💰 Price Prediction</h4>
                          <p>{flight.predictionText}</p>
                        </div>
                        
                        <div className="detail-section">
                          <h4>😴 Jet Lag Optimizer</h4>
                          <p><strong>Severity:</strong> {flight.jetLag.severity}</p>
                          <p><strong>Time Difference:</strong> {flight.jetLag.timeDifference}</p>
                          <div className="jet-lag-tips">
                            <strong>Tips:</strong>
                            <ul>
                              {flight.jetLag.tips.map((tip, idx) => (
                                <li key={idx}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="detail-section">
                          <h4>✈️ Flight Details</h4>
                          <p><strong>Aircraft:</strong> {flight.aircraft}</p>
                          <p><strong>Carbon Emissions:</strong> {flight.emission}</p>
                          <p><strong>Stops:</strong> {flight.stops}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Footer */}
          <div className="footer">
            <div className="footer-content">
              <div className="footer-text">
                © 2024 FlightSearch AI. All rights reserved.
              </div>
              <div className="footer-links">
                <a href="#privacy">Privacy</a>
                <a href="#terms">Terms</a>
                <a href="#contact">Contact</a>
                <a href="#blog">Blog</a>
              </div>
            </div>
          </div>

        </div> {/* End content-area */}

        {/* Ads Sidebar */}
        <AdsSidebar />

      </div> {/* End main-container */}

      {/* Sign In Modal */}
      {showSignIn && (
        <div className="modal-overlay" onClick={() => setShowSignIn(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSignIn(false)}>
              ×
            </button>
            <h2>Sign In to FlightSearch AI</h2>
            <p className="modal-subtitle">Continue with your preferred account</p>

            <div className="oauth-buttons">
              <button className="oauth-btn google" onClick={() => handleOAuthSignIn('google')}>
                <span className="oauth-icon">G</span>
                Continue with Google
              </button>
              <button className="oauth-btn github" onClick={() => handleOAuthSignIn('github')}>
                <span className="oauth-icon">⚫</span>
                Continue with GitHub
              </button>
              <button className="oauth-btn azure" onClick={() => handleOAuthSignIn('azure')}>
                <span className="oauth-icon">🔷</span>
                Continue with Microsoft
              </button>
            </div>

            <div className="modal-footer">
              <p>
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      )}

      {/* My Account Modal */}
      {showMyAccount && (
        <MyAccount
          user={user}
          onClose={() => setShowMyAccount(false)}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
}

export default App;
