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

  // Function to sort flights
  const getSortedFlights = () => {
    let sorted = [...flights];
    
    switch(sortBy) {
      case 'cheapest':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'fastest':
        sorted.sort((a, b) => {
          const getDuration = (dur) => {
            const [hours, mins] = dur.match(/\d+/g);
            return parseInt(hours) * 60 + parseInt(mins);
          };
          return getDuration(a.duration) - getDuration(b.duration);
        });
        break;
      case 'best':
      default:
        // Best is a combination of price and duration
        sorted.sort((a, b) => {
          const getDuration = (dur) => {
            const [hours, mins] = dur.match(/\d+/g);
            return parseInt(hours) * 60 + parseInt(mins);
          };
          const scoreA = a.price + getDuration(a.duration) * 0.5;
          const scoreB = b.price + getDuration(b.duration) * 0.5;
          return scoreA - scoreB;
        });
    }
    
    return sorted;
  };

  // Function to filter flights
  const getFilteredFlights = () => {
    let filtered = getSortedFlights();
    
    // Filter by price
    filtered = filtered.filter(flight => 
      flight.price >= priceRange[0] && flight.price <= priceRange[1]
    );
    
    // Filter by stops
    if (stops === 'nonstop') {
      filtered = filtered.filter(flight => flight.stops === 'Nonstop');
    } else if (stops === '1stop') {
      filtered = filtered.filter(flight => flight.stops.includes('1 stop'));
    }
    
    // Filter by airlines
    if (airlines.length > 0) {
      filtered = filtered.filter(flight => airlines.includes(flight.airline));
    }
    
    return filtered;
  };

  // Results State
  const [flights, setFlights] = useState([]);
  const [allFlights, setAllFlights] = useState([]); // Store original unfiltered flights
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
          text: `Welcome back, ${session.user.user_metadata?.full_name || 'traveler'}! 👍`,
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
          text: `Welcome back, ${session.user.user_metadata?.full_name || 'traveler'}! 👍`,
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

  const toggleArrivalTime = (time) => {
    setArrivalTime(prev =>
      prev.includes(time)
        ? prev.filter(t => t !== time)
        : [...prev, time]
    );
  };

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

    setTimeout(() => {
      const input = chatInput.toLowerCase();
      let aiResponse = '';
      let shouldSearch = false;

      const fromMatch = input.match(/from\s+([a-z]+)/i) || input.match(/\b(jfk|lax|ord|iah|ewr|sfo|atl|den|dfw|bos|mia|lga|phx|iad|sea|dtw|msp|phl|bwi|mdw|slc|san|tpa|pdx|stl|bna|aus|msy|rdu|sna|oak|mci|cmh|cvg|pit|sat|smf|rsw|ind|cle|pwm|bur|ont|sjc|ric|roc|buf|abq|tul|oma|okc)\b/i);
      const toMatch = input.match(/to\s+([a-z]+)/i) || input.match(/\b(london|paris|tokyo|delhi|mumbai|dubai|singapore|sydney|lhr|cdg|nrt|del|bom|dxb|sin|syd|hnd|hkg|icn|bkk|kul|cgk|mnl|can|pvg|pek|szx|tpe|mel|bne|akl|per|auh|doh|jed|ruh|ist|fra|ams|mad|bcn|fco|mxp|zrh|vie|cph|arn|osl|hel|waw|prg|bud|ath|lis|dub|man|edi|gla|bru|lux|opo|ncl|bhx|mrs|lys|tls|nce|ber|muc|ham|dus|cgn|stu|han|txl|sxf)\b/i);
      const dateMatch = input.match(/(?:on|dec|december|date)\s+(\d{1,2})/i);
      const passengersMatch = input.match(/(\d+)\s+passenger/i);

      if (fromMatch || toMatch || dateMatch) {
        const newParams = { ...searchParams };
        if (fromMatch) newParams.from = fromMatch[1].toUpperCase();
        if (toMatch) newParams.to = toMatch[1].toUpperCase();
        if (dateMatch) {
          const month = '12';
          const day = dateMatch[1].padStart(2, '0');
          newParams.departDate = `2025-${month}-${day}`;
        }
        if (passengersMatch) newParams.passengers = parseInt(passengersMatch[1]);

        setSearchParams(newParams);

        if (newParams.from && newParams.to) {
          shouldSearch = true;
          aiResponse = `Perfect! I've got:\n\n✈️ From: ${newParams.from}\n✈️ To: ${newParams.to}\n📅 Date: ${newParams.departDate || 'Not specified'}\n👥 Passengers: ${newParams.passengers}\n\nSearching for the best flights for you...`;
        } else {
          aiResponse = `Great! I've got some details:\n\n${newParams.from ? `✈️ From: ${newParams.from}\n` : ''}${newParams.to ? `✈️ To: ${newParams.to}\n` : ''}${newParams.departDate ? `📅 Date: ${newParams.departDate}\n` : ''}\n${!newParams.from ? '📍 Where are you flying from?\n' : ''}${!newParams.to ? '📍 Where do you want to go?\n' : ''}`;
        }
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

      if (shouldSearch) {
        setTimeout(() => handleFlightSearch(), 1000);
      }
    }, 1500);
  };

  const handleFlightSearch = () => {
    setLoading(true);
    
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
        {
          id: 4,
          airline: 'British Airways',
          logo: '🛫',
          from: searchParams.from || 'JFK',
          to: searchParams.to || 'LHR',
          departure: '06:30 PM',
          arrival: '06:45 AM',
          duration: '7h 15m',
          stops: 'Nonstop',
          price: 495,
          prediction: 'down',
          predictionPercent: 5,
          predictionText: 'Price likely to drop by 5% - monitor for better deals',
          aircraft: 'Boeing 747',
          emission: 'Medium',
          jetLag: {
            severity: 'Mild',
            tips: ['Red-eye helps adjustment', 'Sleep on the plane', 'Breakfast on arrival'],
            timeDifference: '5 hours ahead'
          },
          bookingUrl: 'https://www.britishairways.com'
        },
        {
          id: 5,
          airline: 'Virgin Atlantic',
          logo: '✈️',
          from: searchParams.from || 'JFK',
          to: searchParams.to || 'LHR',
          departure: '09:30 PM',
          arrival: '09:45 AM',
          duration: '7h 15m',
          stops: 'Nonstop',
          price: 475,
          prediction: 'stable',
          predictionPercent: 0,
          predictionText: 'Price stable - book when ready',
          aircraft: 'Airbus A350',
          emission: 'Low',
          jetLag: {
            severity: 'Mild',
            tips: ['Overnight flight is ideal', 'Stay awake until evening UK time', 'Light meals'],
            timeDifference: '5 hours ahead'
          },
          bookingUrl: 'https://www.virginatlantic.com'
        },
      ];
      
      setAllFlights(mockFlights);
      setFlights(sortFlights(mockFlights, sortBy));
      setLoading(false);

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

      {/* Main Container */}
      <div className="main-container">
        <div className="content-area">

          {/* Destination Cards Section */}
          <section className="destination-cards-section">
            <div className="section-header">
              <span className="section-icon">✈️</span>
              <span className="section-title">Featured deals for your next adventure</span>
            </div>

            <div className="destination-cards">
              {/* Card 1: Barcelona */}
              <div className="destination-card">
                <div className="destination-image barcelona-img">🏛️</div>
                <div className="discount-badge">75% off</div>
                <div className="destination-info">
                  <div className="destination-header">
                    <div className="destination-name">Barcelona</div>
                    <div className="destination-description">Gaudí buildings, Gothic Quarter & tapas</div>
                  </div>
                  <div className="destination-details">
                    <div className="destination-dates">
                      <span>Thu, Dec 4 → Thu, Dec 11</span>
                      <span className="destination-airline">✈️ Nonstop · 7h 35m · Iberia</span>
                    </div>
                    <div className="destination-price">
                      <div className="original-price">$353</div>
                      <div className="current-price">$282</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Hong Kong */}
              <div className="destination-card">
                <div className="destination-image hongkong-img">🌃</div>
                <div className="discount-badge">60% off</div>
                <div className="destination-info">
                  <div className="destination-header">
                    <div className="destination-name">Hong Kong</div>
                    <div className="destination-description">Shopping, temples, peak & Kowloon</div>
                  </div>
                  <div className="destination-details">
                    <div className="destination-dates">
                      <span>Mon, Dec 1 → Mon, Dec 8</span>
                      <span className="destination-airline">✈️ Nonstop · 16h 15m · Cathay Pacific</span>
                    </div>
                    <div className="destination-price">
                      <div className="original-price">$1,246</div>
                      <div className="current-price">$903</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: San Francisco */}
              <div className="destination-card">
                <div className="destination-image sanfrancisco-img">🌉</div>
                <div className="discount-badge">65% off</div>
                <div className="destination-info">
                  <div className="destination-header">
                    <div className="destination-name">San Francisco</div>
                    <div className="destination-description">Golden Gate Bridge, cable cars & fog</div>
                  </div>
                  <div className="destination-details">
                    <div className="destination-dates">
                      <span>Sat, Dec 6 → Sat, Dec 13</span>
                      <span className="destination-airline">✈️ Nonstop · 6h 28m · Alaska</span>
                    </div>
                    <div className="destination-price">
                      <div className="original-price">$638</div>
                      <div className="current-price">$191</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Hero Section */}
          <div className="hero-content">
            <h1 className="hero-title">READY TO TAKE OFF</h1>
            <p className="hero-subtitle">FlightSearch makes your journey easier. Just type and we will book the best flight for you in minutes.</p>
          </div>

          {/* Chat Area - Keep Original */}
          <section className="chat-area">
            <h2 className="chat-title">Talk to us where you would like to go</h2>
            <div className="chat-messages-wrapper">
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
          {/* Enhanced Kayak-style Sidebar */}
          <div className="sidebar">
            <h3>Filters</h3>

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
                Nonstop only
              </label>
              <label>
                <input
                  type="radio"
                  name="stops"
                  value="1stop"
                  checked={stops === '1stop'}
                  onChange={(e) => setStops(e.target.value)}
                />
                1 stop or fewer
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
                  checked={airlines.includes('Delta Airlines')}
                  onChange={() => toggleAirline('Delta Airlines')}
                />
                Delta Airlines
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
