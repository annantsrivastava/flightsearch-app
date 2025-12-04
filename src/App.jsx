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

  // Track extracted flight information with advanced criteria
  const [flightInfo, setFlightInfo] = useState({
    from: '',
    to: '',
    departDate: '',
    returnDate: '',
    passengers: 1,
    class: 'economy',
    tripType: 'oneway', // Default to one-way as per requirements
    maxPrice: null,
    dateRange: { start: '', end: '' },
    sortPreference: 'best', // 'cheapest', 'fastest', 'best'
    flexible: false
  });

  // Function to extract flight information from text using AI
  const extractFlightInfo = (text, previousInfo) => {
    const info = { ...previousInfo };
    const lowerText = text.toLowerCase();
    
    // Detect if user is modifying previous request
    const isModification = lowerText.includes('actually') || 
                           lowerText.includes('change') || 
                           lowerText.includes('i want') ||
                           lowerText.includes('make it') ||
                           lowerText.includes('two way') ||
                           lowerText.includes('round trip');
    
    // === TRIP TYPE DETECTION ===
    if (lowerText.match(/two[- ]?way|round[- ]?trip|return/)) {
      info.tripType = 'roundtrip';
    } else if (lowerText.match(/one[- ]?way|single/)) {
      info.tripType = 'oneway';
    }
    
    // === CITY/AIRPORT DETECTION ===
    // Enhanced patterns to catch "from X to Y"
    const fromToPattern = /(?:from|leaving|departing)\s+([A-Za-z\s]+?)\s+(?:to|into|going to|flying to)/i;
    const toPattern = /(?:to|into|going to|flying to)\s+([A-Za-z\s]+?)(?:\s+on|\s+in|\s+this|\s+any|\s+between|\s+under|\s+\$|\s*$)/i;
    
    const fromToMatch = text.match(fromToPattern);
    if (fromToMatch) {
      info.from = fromToMatch[1].trim();
    }
    
    const toMatch = text.match(toPattern);
    if (toMatch) {
      info.to = toMatch[1].trim();
    }
    
    // === DATE DETECTION ===
    // Specific date: "dec 15", "december 15th", "12/15"
    const specificDatePattern = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?/i;
    const numericDatePattern = /\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/;
    
    // Date range: "this december", "between X and Y"
    const monthPattern = /this\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/i;
    const betweenPattern = /between\s+(.+?)\s+and\s+(.+?)(?:\s|$)/i;
    const anyDatePattern = /any\s+date/i;
    
    const specificMatch = text.match(specificDatePattern);
    const numericMatch = text.match(numericDatePattern);
    const monthMatch = text.match(monthPattern);
    const betweenMatch = text.match(betweenPattern);
    
    if (specificMatch && !info.departDate) {
      info.departDate = specificMatch[0];
      info.flexible = false;
    } else if (numericMatch && !info.departDate) {
      info.departDate = numericMatch[0];
      info.flexible = false;
    } else if (monthMatch) {
      const month = monthMatch[1];
      info.dateRange = {
        start: `${month} 1, 2025`,
        end: `${month} 31, 2025`
      };
      info.flexible = true;
    } else if (betweenMatch) {
      info.dateRange = {
        start: betweenMatch[1].trim(),
        end: betweenMatch[2].trim()
      };
      info.flexible = true;
    } else if (anyDatePattern.test(text)) {
      info.flexible = true;
    }
    
    // === RETURN DATE DETECTION ===
    if (info.tripType === 'roundtrip') {
      const returningPattern = /return(?:ing)?\s+(?:on\s+)?([A-Za-z\s\d\/]+)/i;
      const returnMatch = text.match(returningPattern);
      if (returnMatch) {
        info.returnDate = returnMatch[1].trim();
      }
    }
    
    // === PASSENGER DETECTION ===
    const passengerPattern = /(\d+)\s+(?:passenger|person|people|traveler|adult)/i;
    const passengerMatch = text.match(passengerPattern);
    if (passengerMatch) {
      info.passengers = parseInt(passengerMatch[1]);
    }
    
    // === CLASS DETECTION ===
    if (/first\s+class|first/i.test(text)) {
      info.class = 'first';
    } else if (/business\s+class|business/i.test(text)) {
      info.class = 'business';
    } else if (/premium\s+economy|premium/i.test(text)) {
      info.class = 'premium';
    } else if (/economy|coach/i.test(text)) {
      info.class = 'economy';
    }
    
    // === PRICE LIMIT DETECTION ===
    const pricePattern = /under\s+\$?(\d+)|less\s+than\s+\$?(\d+)|below\s+\$?(\d+)|max(?:imum)?\s+\$?(\d+)/i;
    const priceMatch = text.match(pricePattern);
    if (priceMatch) {
      const price = priceMatch[1] || priceMatch[2] || priceMatch[3] || priceMatch[4];
      info.maxPrice = parseInt(price);
    }
    
    // === SORT PREFERENCE DETECTION ===
    if (/cheapest|lowest\s+price|least\s+expensive/i.test(text)) {
      info.sortPreference = 'cheapest';
    } else if (/fastest|quickest|shortest\s+flight|direct/i.test(text)) {
      info.sortPreference = 'fastest';
    } else if (/best/i.test(text)) {
      info.sortPreference = 'best';
    }
    
    return info;
  };

  // Check if we have minimum info to search
  const hasEnoughInfoToSearch = (info) => {
    // Must have origin, destination, and either specific date or flexible date range
    const hasRoute = info.from && info.to;
    const hasDate = info.departDate || info.flexible || (info.dateRange.start && info.dateRange.end);
    
    // For round-trip, check if we need return date
    if (info.tripType === 'roundtrip' && info.departDate && !info.returnDate) {
      return false; // Need return date for round-trip with specific depart date
    }
    
    return hasRoute && hasDate;
  };

  // Generate smart follow-up question
  const getFollowUpQuestion = (info) => {
    if (!info.to && !info.from) {
      return "Where would you like to fly? (For example: from New York to London)";
    }
    if (!info.to) {
      return "Where would you like to go?";
    }
    if (!info.from) {
      return "Where will you be departing from?";
    }
    if (!info.departDate && !info.flexible && !info.dateRange.start) {
      return "When would you like to travel?";
    }
    if (info.tripType === 'roundtrip' && info.departDate && !info.returnDate) {
      return "When would you like to return?";
    }
    return null;
  };

  // Generate confirmation message based on extracted info
  const generateConfirmation = (info) => {
    let confirmation = "";
    
    // Add airport codes if known (simple mapping)
    const airportCodes = {
      'new york': 'JFK',
      'london': 'LHR',
      'los angeles': 'LAX',
      'chicago': 'ORD',
      'boston': 'BOS',
      'miami': 'MIA',
      'san francisco': 'SFO',
      'paris': 'CDG',
      'tokyo': 'NRT',
      'dubai': 'DXB'
    };
    
    const fromCode = airportCodes[info.from?.toLowerCase()] || '';
    const toCode = airportCodes[info.to?.toLowerCase()] || '';
    
    // Build confirmation string
    if (info.flexible) {
      confirmation = `Searching for ${info.sortPreference === 'cheapest' ? 'cheapest' : info.sortPreference === 'fastest' ? 'fastest' : ''} flights from ${info.from} ${fromCode ? `(${fromCode})` : ''} to ${info.to} ${toCode ? `(${toCode})` : ''}`;
      
      if (info.dateRange.start && info.dateRange.end) {
        confirmation += ` between ${info.dateRange.start} and ${info.dateRange.end}`;
      } else {
        confirmation += ` for flexible dates`;
      }
    } else {
      confirmation = `Found flights from ${info.from} ${fromCode ? `(${fromCode})` : ''} to ${info.to} ${toCode ? `(${toCode})` : ''}`;
      
      if (info.tripType === 'oneway') {
        confirmation += `, one-way`;
      } else {
        confirmation += `, round-trip`;
      }
      
      confirmation += ` for ${info.passengers} passenger${info.passengers > 1 ? 's' : ''}`;
      
      if (info.departDate) {
        confirmation += ` departing ${info.departDate}`;
        // Add year if not present
        if (!info.departDate.includes('2025') && !info.departDate.includes('2024')) {
          confirmation += ', 2025';
        }
      }
      
      if (info.returnDate && info.tripType === 'roundtrip') {
        confirmation += `, returning ${info.returnDate}`;
        if (!info.returnDate.includes('2025') && !info.returnDate.includes('2024')) {
          confirmation += ', 2025';
        }
      }
    }
    
    if (info.maxPrice) {
      confirmation += ` under $${info.maxPrice}`;
    }
    
    if (info.class !== 'economy') {
      confirmation += ` in ${info.class} class`;
    }
    
    confirmation += ".";
    
    return confirmation;
  };

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

  // Build conversation history for API (maintains context)
  const buildConversationHistory = () => {
    const history = [];
    
    // Convert our chat messages to API format
    chatMessages.forEach(msg => {
      if (msg.type === 'user') {
        history.push({
          role: 'user',
          content: msg.text
        });
      } else if (msg.type === 'ai') {
        history.push({
          role: 'assistant',
          content: msg.text
        });
      }
    });
    
    return history;
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
    const currentInput = chatInput;
    setChatInput('');
    setIsTyping(true);

    // Extract flight information from user input (pass previous info for context)
    const extractedInfo = extractFlightInfo(currentInput, flightInfo);
    setFlightInfo(extractedInfo);

    // Check if we have enough info to search
    const canSearch = hasEnoughInfoToSearch(extractedInfo);
    const followUpQuestion = getFollowUpQuestion(extractedInfo);

    try {
      let aiResponseText = "";

      if (canSearch) {
        // Generate confirmation message
        aiResponseText = generateConfirmation(extractedInfo);
      } else if (followUpQuestion) {
        // Need more information - ask follow-up
        // Build full conversation history for context
        const conversationHistory = buildConversationHistory();
        
        // Add context about extracted info
        const contextPrompt = `You are a friendly flight search assistant. 
        
Context from conversation:
${extractedInfo.to ? `- Destination: ${extractedInfo.to}` : ''}
${extractedInfo.from ? `- Origin: ${extractedInfo.from}` : ''}
${extractedInfo.departDate ? `- Date: ${extractedInfo.departDate}` : ''}
${extractedInfo.passengers > 1 ? `- Passengers: ${extractedInfo.passengers}` : ''}
${extractedInfo.class !== 'economy' ? `- Class: ${extractedInfo.class}` : ''}

The user just said: "${currentInput}"

Ask them this follow-up question naturally and friendly: "${followUpQuestion}"`;

        conversationHistory.push({
          role: 'user',
          content: contextPrompt
        });

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: conversationHistory
          })
        });

        if (response.ok) {
          const data = await response.json();
          aiResponseText = data.content[0].text;
        } else {
          aiResponseText = followUpQuestion;
        }
      } else {
        // General conversational response
        // Build full conversation history for context
        const conversationHistory = buildConversationHistory();
        
        conversationHistory.push({
          role: 'user',
          content: `You are a helpful flight search assistant. The user said: "${currentInput}". 
          
Respond naturally and helpfully. If they're asking about flights, help them clarify their travel plans. 
Remember our previous conversation and build on it.`
        });

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: conversationHistory
          })
        });

        if (response.ok) {
          const data = await response.json();
          aiResponseText = data.content[0].text;
        } else {
          aiResponseText = "I'd be happy to help you find flights! Where would you like to go?";
        }
      }

      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          type: 'ai',
          text: aiResponseText,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }]);
        setIsTyping(false);

        // Automatically show results if we have enough information
        if (canSearch) {
          setTimeout(() => {
            // Apply sort preference
            setSortBy(extractedInfo.sortPreference);
            simulateSearch();
          }, 500);
        }
      }, 1000);

    } catch (error) {
      console.error('Error:', error);
      
      // Even on error, if we have enough info, show confirmation
      if (canSearch) {
        const confirmation = generateConfirmation(extractedInfo);
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          type: 'ai',
          text: confirmation,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }]);
        setIsTyping(false);
        
        setTimeout(() => {
          setSortBy(extractedInfo.sortPreference);
          simulateSearch();
        }, 500);
      } else {
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          type: 'ai',
          text: "I'm having trouble connecting right now. Please try again!",
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }]);
        setIsTyping(false);
      }
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
          
          {/* Hero Section - Only show when no results */}
          {flights.length === 0 && (
            <>
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
            </>
          )}

          {/* AI Chat Interface - ALWAYS VISIBLE */}
          <div className={`ai-chat-container ${flights.length > 0 ? 'with-results' : ''}`}>
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
            </div>

            {/* Trust Signals - Only when no results */}
            {flights.length === 0 && (
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
