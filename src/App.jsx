import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import MyAccount from './components/MyAccount';
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

  // Filter States
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [stops, setStops] = useState('any');
  const [departureTime, setDepartureTime] = useState('any');

  // Results State
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Add welcome back message if user is logged in
      if (session?.user) {
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          type: 'ai',
          text: `Welcome back, ${session.user.user_metadata?.full_name || 'traveler'}! 👍`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    });

    // Listen for auth changes
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
          text: `Welcome back, ${session.user.user_metadata?.full_name || 'traveler'}! 👍`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Chat functionality
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

    // Simulate AI processing and extract flight details
    setTimeout(() => {
      const input = chatInput.toLowerCase();
      let aiResponse = '';
      let shouldSearch = false;

      // Parse the user input for flight details
      const fromMatch = input.match(/from\s+(\w+)/i);
      const toMatch = input.match(/to\s+(\w+)/i) || input.match(/(\w+)\s+on\s+/i);
      const dateMatch = input.match(/(?:on|dec|december)\s+(\d+)/i);
      const passengersMatch = input.match(/(\d+)\s+passenger/i);

      if (fromMatch || toMatch || dateMatch) {
        // Extract details
        const newParams = { ...searchParams };
        if (fromMatch) newParams.from = fromMatch[1];
        if (toMatch) newParams.to = toMatch[1];
        if (dateMatch) {
          const month = '12';
          const day = dateMatch[1].padStart(2, '0');
          newParams.departDate = `2025-${month}-${day}`;
        }
        if (passengersMatch) newParams.passengers = parseInt(passengersMatch[1]);

        setSearchParams(newParams);
        shouldSearch = true;

        aiResponse = `Perfect! I've got:\n\n✈️ From: ${newParams.from || 'Not specified'}\n✈️ To: ${newParams.to || 'Not specified'}\n📅 Date: ${newParams.departDate || 'Not specified'}\n👥 Passengers: ${newParams.passengers}\n\nSearching for the best flights for you...`;
      } else {
        aiResponse = "I'd be happy to help you find flights! Could you tell me:\n\n📍 Where are you flying from?\n📍 Where do you want to go?\n📅 What date would you like to travel?";
      }

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);

      // If we have enough info, search for flights
      if (shouldSearch && searchParams.from && searchParams.to) {
        setTimeout(() => handleFlightSearch(), 1000);
      }
    }, 1500);
  };

  const handleFlightSearch = () => {
    setLoading(true);
    
    // Simulate API call with realistic flight data
    setTimeout(() => {
      const mockFlights = [
        {
          id: 1,
          airline: 'United Airlines',
          logo: '🛫',
          from: searchParams.from || 'JFK',
          to: searchParams.to || 'LHR',
          departure: '08:00 AM',
          arrival: '02:30 PM',
          duration: '6h 30m',
          stops: 'Nonstop',
          price: 459,
          prediction: 'up',
          predictionPercent: 12,
          predictionText: 'Price likely to increase by 12% in next 48hrs',
          aircraft: 'Boeing 787',
          emission: 'Low',
          jetLag: {
            severity: 'Moderate',
            tips: ['Adjust sleep 2 days before', 'Stay hydrated', 'Get sunlight on arrival'],
            timeDifference: '5 hours ahead'
          },
          bookingUrl: 'https://www.united.com'
        },
        {
          id: 2,
          airline: 'Delta Airlines',
          logo: '✈️',
          from: searchParams.from || 'JFK',
          to: searchParams.to || 'LHR',
          departure: '10:15 AM',
          arrival: '05:00 PM',
          duration: '6h 45m',
          stops: '1 stop',
          price: 389,
          prediction: 'down',
          predictionPercent: 8,
          predictionText: 'Price likely to drop by 8% - good time to book!',
          aircraft: 'Airbus A350',
          emission: 'Medium',
          jetLag: {
            severity: 'Moderate',
            tips: ['Avoid caffeine 6hrs before landing', 'Use sleep mask', 'Stay active during flight'],
            timeDifference: '5 hours ahead'
          },
          bookingUrl: 'https://www.delta.com'
        },
        {
          id: 3,
          airline: 'American Airlines',
          logo: '🛩️',
          from: searchParams.from || 'JFK',
          to: searchParams.to || 'LHR',
          departure: '01:00 PM',
          arrival: '08:15 PM',
          duration: '7h 15m',
          stops: 'Nonstop',
          price: 520,
          prediction: 'stable',
          predictionPercent: 0,
          predictionText: 'Price stable - book anytime this week',
          aircraft: 'Boeing 777',
          emission: 'Low',
          jetLag: {
            severity: 'Mild',
            tips: ['Evening arrival helps adjustment', 'Light dinner', 'Go to bed at local time'],
            timeDifference: '5 hours ahead'
          },
          bookingUrl: 'https://www.aa.com'
        },
      ];
      
      setFlights(mockFlights);
      setLoading(false);

      // Add AI message about results
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        text: `Great news! I found ${mockFlights.length} flights for you. Check out the results below - I've included price predictions and jet lag tips for each flight! 🎉`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 2000);
  };

  const handleOAuthSignIn = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) console.error('Error signing in:', error.message);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowMyAccount(false);
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      type: 'ai',
      text: "You've been signed out. Feel free to search for flights anytime!",
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">✈️</span>
            <span className="logo-text">FlightFinder AI</span>
          </div>
          <nav className="nav">
            <a href="#flights">Flights</a>
            <a href="#hotels">Hotels</a>
            <a href="#trips">My Trips</a>
            <a href="#help">Help</a>
          </nav>
          <div className="header-actions">
            <button className="ai-agent-btn">
              <span className="ai-icon">🤖</span> AI Agent Active
            </button>
            
            {!user ? (
              <button className="sign-in-btn" onClick={() => setShowSignIn(true)}>
                <span className="user-icon">👤</span> Sign In
              </button>
            ) : (
              <button className="user-account-btn" onClick={() => setShowMyAccount(true)}>
                <span className="user-icon">👤</span>
                {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Account'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* AI Agent Chat Section */}
      <section className="ai-chat-section">
        <div className="ai-chat-header">
          <div className="ai-avatar">💬</div>
          <div>
            <h2>Your AI Travel Agent</h2>
            <p>I'll help you find and book the perfect flight</p>
          </div>
        </div>

        <div className="chat-messages">
          {chatMessages.map(msg => (
            <div key={msg.id} className={`message ${msg.type}-message`}>
              {msg.type === 'ai' && <span className="message-icon">✈️</span>}
              <div className="message-content">
                <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>
                <div className="timestamp">{msg.timestamp}</div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="message ai-message">
              <span className="message-icon">✈️</span>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="chat-input-container">
          <input
            type="text"
            className="chat-input"
            placeholder="Tell me about your trip..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className="send-btn" onClick={handleSendMessage}>
            Send
          </button>
        </div>
      </section>

      {/* Loading */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Finding the best flights for you...</p>
        </div>
      )}

      {/* Results Section */}
      {flights.length > 0 && (
        <section className="results-section">
          <div className="sidebar">
            <h3>Filters</h3>

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

            <div className="filter-group">
              <h4>Stops</h4>
              <label>
                <input
                  type="radio"
                  name="stops"
                  value="any"
                  checked={stops === 'any'}
                  onChange={(e) => setStops(e.target.value)}
                />
                Any
              </label>
              <label>
                <input
                  type="radio"
                  name="stops"
                  value="nonstop"
                  checked={stops === 'nonstop'}
                  onChange={(e) => setStops(e.target.value)}
                />
                Nonstop
              </label>
              <label>
                <input
                  type="radio"
                  name="stops"
                  value="1stop"
                  checked={stops === '1stop'}
                  onChange={(e) => setStops(e.target.value)}
                />
                1 Stop
              </label>
            </div>

            <div className="filter-group">
              <h4>Departure Time</h4>
              <label>
                <input
                  type="radio"
                  name="time"
                  value="any"
                  checked={departureTime === 'any'}
                  onChange={(e) => setDepartureTime(e.target.value)}
                />
                Any Time
              </label>
              <label>
                <input
                  type="radio"
                  name="time"
                  value="morning"
                  checked={departureTime === 'morning'}
                  onChange={(e) => setDepartureTime(e.target.value)}
                />
                Morning (5AM - 12PM)
              </label>
              <label>
                <input
                  type="radio"
                  name="time"
                  value="afternoon"
                  checked={departureTime === 'afternoon'}
                  onChange={(e) => setDepartureTime(e.target.value)}
                />
                Afternoon (12PM - 6PM)
              </label>
              <label>
                <input
                  type="radio"
                  name="time"
                  value="evening"
                  checked={departureTime === 'evening'}
                  onChange={(e) => setDepartureTime(e.target.value)}
                />
                Evening (6PM - 12AM)
              </label>
            </div>
          </div>

          <div className="results-content">
            <div className="results-header">
              <h3>{flights.length} Flights Found</h3>
              <div className="sort-options">
                <button className="sort-btn active">Best</button>
                <button className="sort-btn">Cheapest</button>
                <button className="sort-btn">Fastest</button>
              </div>
            </div>

            <div className="flights-list">
              {flights.map((flight) => (
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
                        <div className="duration-line"></div>
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

      {/* Sign In Modal */}
      {showSignIn && (
        <div className="modal-overlay" onClick={() => setShowSignIn(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSignIn(false)}>
              ×
            </button>
            <h2>Sign In to FlightFinder AI</h2>
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
