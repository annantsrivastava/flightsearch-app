import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import MyAccount from './components/MyAccount';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showMyAccount, setShowMyAccount] = useState(false);

  // Search & Filter States
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [tripType, setTripType] = useState('roundtrip');
  const [cabinClass, setCabinClass] = useState('economy');

  // Filter States
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [stops, setStops] = useState('any');
  const [airlines, setAirlines] = useState([]);
  const [departureTime, setDepartureTime] = useState('any');

  // Results State
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Close sign in modal after successful login
      if (event === 'SIGNED_IN') {
        setShowSignIn(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockFlights = [
        {
          id: 1,
          airline: 'United Airlines',
          logo: '🛫',
          departure: '08:00 AM',
          arrival: '02:30 PM',
          duration: '6h 30m',
          stops: 'Nonstop',
          price: 459,
          prediction: 'up',
          predictionPercent: 12,
          aircraft: 'Boeing 787',
          emission: 'Low',
        },
        {
          id: 2,
          airline: 'Delta Airlines',
          logo: '✈️',
          departure: '10:15 AM',
          arrival: '05:00 PM',
          duration: '6h 45m',
          stops: '1 stop',
          price: 389,
          prediction: 'down',
          predictionPercent: 8,
          aircraft: 'Airbus A350',
          emission: 'Medium',
        },
        {
          id: 3,
          airline: 'American Airlines',
          logo: '🛩️',
          departure: '01:00 PM',
          arrival: '08:15 PM',
          duration: '7h 15m',
          stops: 'Nonstop',
          price: 520,
          prediction: 'stable',
          predictionPercent: 0,
          aircraft: 'Boeing 777',
          emission: 'Low',
        },
      ];
      setFlights(mockFlights);
      setLoading(false);
    }, 1500);
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
            
            {/* Show Sign In button OR User Account button */}
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
          <div className="message ai-message">
            <span className="message-icon">✈️</span>
            <div className="message-content">
              <p>Hi! I'm your AI travel agent, and I'm here to help you find the perfect flight!</p>
              <div className="timestamp">12:13 PM</div>
            </div>
          </div>

          <div className="message ai-message">
            <div className="message-content">
              <p>You can tell me your trip details however you like! For example:</p>
              <div className="example-queries">
                <div className="example">
                  🎯 All at once: "I want to fly from New York to London on Dec 15, returning Dec 22, 2 passengers, economy"
                </div>
                <div className="example">
                  🎯 Or just start: "London on Dec 23rd"
                </div>
              </div>
              <p>I'll figure out what you mean and ask about anything I'm missing. What's your trip?</p>
              <div className="timestamp">12:13 PM</div>
            </div>
          </div>

          {user && (
            <div className="message ai-message">
              <div className="message-content">
                <p>Welcome back, {user.user_metadata?.full_name || 'traveler'}! 👍</p>
                <div className="timestamp">12:13 PM</div>
              </div>
            </div>
          )}
        </div>

        <div className="chat-input-container">
          <input
            type="text"
            className="chat-input"
            placeholder="Tell me about your trip..."
          />
          <button className="send-btn">Send</button>
        </div>
      </section>

      {/* Search Form */}
      <section className="search-section">
        <div className="trip-type-selector">
          <button
            className={tripType === 'roundtrip' ? 'active' : ''}
            onClick={() => setTripType('roundtrip')}
          >
            Round Trip
          </button>
          <button
            className={tripType === 'oneway' ? 'active' : ''}
            onClick={() => setTripType('oneway')}
          >
            One Way
          </button>
          <button
            className={tripType === 'multicity' ? 'active' : ''}
            onClick={() => setTripType('multicity')}
          >
            Multi-City
          </button>
        </div>

        <div className="search-form">
          <div className="form-row">
            <div className="form-field">
              <label>From</label>
              <input
                type="text"
                placeholder="City or Airport"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>To</label>
              <input
                type="text"
                placeholder="City or Airport"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Depart</label>
              <input
                type="date"
                value={departDate}
                onChange={(e) => setDepartDate(e.target.value)}
              />
            </div>
            {tripType === 'roundtrip' && (
              <div className="form-field">
                <label>Return</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Passengers</label>
              <input
                type="number"
                min="1"
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
              />
            </div>
            <div className="form-field">
              <label>Class</label>
              <select value={cabinClass} onChange={(e) => setCabinClass(e.target.value)}>
                <option value="economy">Economy</option>
                <option value="premium">Premium Economy</option>
                <option value="business">Business</option>
                <option value="first">First Class</option>
              </select>
            </div>
            <button className="search-btn" onClick={handleSearch}>
              Search Flights
            </button>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Finding the best flights for you...</p>
        </div>
      )}

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
                        <div className="location">{from || 'JFK'}</div>
                      </div>
                      <div className="flight-duration">
                        <div className="duration-line"></div>
                        <div className="duration-text">{flight.duration}</div>
                        <div className="stops-info">{flight.stops}</div>
                      </div>
                      <div className="time-block">
                        <div className="time">{flight.arrival}</div>
                        <div className="location">{to || 'LHR'}</div>
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

                    <button className="select-btn">Select</button>
                  </div>

                  <div className="flight-details">
                    <div className="detail-item">
                      <span className="detail-label">Aircraft:</span>
                      <span>{flight.aircraft}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Carbon Emissions:</span>
                      <span>{flight.emission}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Jet Lag Impact:</span>
                      <span>Moderate (6-hour time difference)</span>
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
