import React, { useState } from 'react';
import { Plane, MapPin, Calendar, Users, X, User, LogOut, Clock, Settings, TrendingUp, Leaf, Star, Zap, ChevronDown, ChevronUp, Send } from 'lucide-react';

const App = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [expandedTimeline, setExpandedTimeline] = useState({});
  const [expandedJetLag, setExpandedJetLag] = useState({});
  const [currentFlightData, setCurrentFlightData] = useState(null);

  const filterOptions = {
    'Class': ['Economy', 'Premium Economy', 'Business', 'First'],
    'Trip Type': ['One way', 'Round trip'],
    'Stops': ['Non-Stop', '1 Stop', '2+ Stops'],
    'Baggage': ['Carry-on only', 'Checked bag included', '2+ bags'],
    'Departure Time': ['Early morning (12am-8am)', 'Morning (8am-12pm)', 'Afternoon (12pm-5pm)', 'Evening (5pm-12am)'],
    'Passengers': ['1 Adult', '2 Adults', '3+ Adults', 'With Children', 'With Infants']
  };

  // Generate comprehensive flight data
  const generateFlightOptions = (query) => {
    return {
      searchQuery: query,
      flights: [
        {
          id: 1,
          type: 'cheapest',
          badge: '💰 Cheapest',
          badgeColor: 'bg-green-100 text-green-700',
          airline: 'United Airlines',
          flightNumber: 'UA 847 / UA 124',
          route: 'Houston (IAH) → Dubai (DXB) → New Delhi (DEL)',
          departure: '10:30 AM',
          arrival: '2:45 PM (+1 day)',
          duration: '18h 15m',
          stops: '1 stop (2h in Dubai)',
          price: 1245,
          originalPrice: 1450,
          discount: 14,
          comfortScore: 7.8,
          carbonFootprint: 2.4,
          wifiAvailable: true,
          mealIncluded: true,
          
          pricePrediction: {
            trend: 'increasing',
            confidence: 87,
            predictedIncrease: 15,
            savings: 187,
            recommendation: 'Book soon to save $187',
            bestTimeToBook: 'Now',
            currentVsOptimal: 'Current price is optimal'
          },
          
          timeline: [
            { time: '10:30 AM', event: '✈️ Takeoff from Houston (IAH)', type: 'departure' },
            { time: '11:45 AM', event: '☕ Beverage service begins', type: 'service' },
            { time: '1:30 PM', event: '🍽️ Meal service - International cuisine', type: 'meal' },
            { time: '3:00 PM', event: '🌙 Lights dimmed for rest period', type: 'rest' },
            { time: '9:45 PM', event: '🛬 Landing in Dubai (DXB)', type: 'arrival' },
            { time: '9:45 PM - 11:45 PM', event: '⏱️ 2-hour layover - Dubai Terminal 3', type: 'layover' },
            { time: '11:45 PM', event: '✈️ Takeoff from Dubai', type: 'departure' },
            { time: '2:45 PM', event: '🛬 Arrival in New Delhi (DEL)', type: 'arrival' }
          ],
          
          jetLagOptimizer: {
            timeDifference: '+10.5 hours',
            severity: 'Moderate',
            recoveryTime: '4-6 days',
            preDeparture: [
              { day: 'Day -3', sleep: '11:00 PM', wake: '7:00 AM', tips: ['Avoid caffeine after 2 PM', 'Get 30 min sunlight'] },
              { day: 'Day -2', sleep: '10:30 PM', wake: '6:30 AM', tips: ['Light dinner by 7 PM', 'Start taking melatonin'] },
              { day: 'Day -1', sleep: '10:00 PM', wake: '6:00 AM', tips: ['Pack and relax', 'Hydrate well'] }
            ]
          }
        },
        {
          id: 2,
          type: 'fastest',
          badge: '⚡ Fastest',
          badgeColor: 'bg-blue-100 text-blue-700',
          airline: 'Emirates',
          flightNumber: 'EK 211 / EK 512',
          route: 'Houston (IAH) → Dubai (DXB) → New Delhi (DEL)',
          departure: '8:45 PM',
          arrival: '10:15 AM (+1 day)',
          duration: '15h 30m',
          stops: '1 stop (1h 30m in Dubai)',
          price: 1580,
          originalPrice: 1680,
          discount: 6,
          comfortScore: 9.2,
          carbonFootprint: 2.2,
          wifiAvailable: true,
          mealIncluded: true,
          
          pricePrediction: {
            trend: 'stable',
            confidence: 92,
            predictedIncrease: 3,
            savings: 0,
            recommendation: 'Good time to book',
            bestTimeToBook: 'Next 3 days',
            currentVsOptimal: '$35 above optimal'
          },
          
          timeline: [
            { time: '8:45 PM', event: '✈️ Takeoff from Houston (IAH)', type: 'departure' },
            { time: '10:00 PM', event: '🍽️ Gourmet dinner service', type: 'meal' },
            { time: '11:30 PM', event: '🌙 Cabin lights dimmed', type: 'rest' },
            { time: '7:15 AM', event: '🛬 Landing in Dubai (DXB)', type: 'arrival' },
            { time: '7:15 AM - 8:45 AM', event: '⏱️ 1.5-hour layover', type: 'layover' },
            { time: '8:45 AM', event: '✈️ Takeoff from Dubai', type: 'departure' },
            { time: '10:15 AM', event: '🛬 Arrival in New Delhi (DEL)', type: 'arrival' }
          ],
          
          jetLagOptimizer: {
            timeDifference: '+10.5 hours',
            severity: 'Mild',
            recoveryTime: '3-4 days',
            preDeparture: [
              { day: 'Day -3', sleep: '11:30 PM', wake: '7:30 AM', tips: ['Evening workout', 'Limit screen time'] },
              { day: 'Day -2', sleep: '11:00 PM', wake: '7:00 AM', tips: ['Eat meals at new time', 'Stay hydrated'] },
              { day: 'Day -1', sleep: '10:30 PM', wake: '6:30 AM', tips: ['Relax', 'Confirm travel docs'] }
            ]
          }
        },
        {
          id: 3,
          type: 'best-value',
          badge: '⭐ Best Value',
          badgeColor: 'bg-purple-100 text-purple-700',
          airline: 'Qatar Airways',
          flightNumber: 'QR 715 / QR 579',
          route: 'Houston (IAH) → Doha (DOH) → New Delhi (DEL)',
          departure: '1:15 PM',
          arrival: '5:30 PM (+1 day)',
          duration: '16h 15m',
          stops: '1 stop (2h 30m in Doha)',
          price: 1380,
          originalPrice: 1550,
          discount: 11,
          comfortScore: 8.9,
          carbonFootprint: 2.3,
          wifiAvailable: true,
          mealIncluded: true,
          
          pricePrediction: {
            trend: 'decreasing',
            confidence: 78,
            predictedIncrease: -5,
            savings: 0,
            recommendation: 'Wait 2-3 days for better price',
            bestTimeToBook: 'In 3 days',
            currentVsOptimal: '$69 above optimal'
          },
          
          timeline: [
            { time: '1:15 PM', event: '✈️ Takeoff from Houston (IAH)', type: 'departure' },
            { time: '2:30 PM', event: '🍽️ Premium meal service', type: 'meal' },
            { time: '6:00 PM', event: '🌙 Rest period begins', type: 'rest' },
            { time: '1:00 AM', event: '🛬 Landing in Doha (DOH)', type: 'arrival' },
            { time: '1:00 AM - 3:30 AM', event: '⏱️ 2.5-hour layover', type: 'layover' },
            { time: '3:30 AM', event: '✈️ Takeoff from Doha', type: 'departure' },
            { time: '5:30 PM', event: '🛬 Arrival in New Delhi (DEL)', type: 'arrival' }
          ],
          
          jetLagOptimizer: {
            timeDifference: '+10.5 hours',
            severity: 'Moderate',
            recoveryTime: '4-5 days',
            preDeparture: [
              { day: 'Day -3', sleep: '11:00 PM', wake: '7:00 AM', tips: ['Morning exercise', 'Eat light dinner'] },
              { day: 'Day -2', sleep: '10:30 PM', wake: '6:30 AM', tips: ['Afternoon nap OK', 'Stay hydrated'] },
              { day: 'Day -1', sleep: '10:00 PM', wake: '6:00 AM', tips: ['Final prep', 'Early dinner'] }
            ]
          }
        }
      ],
      recommendations: [
        { icon: '💡', text: 'You usually prefer morning flights - Emirates arrives early!' },
        { icon: '💰', text: 'Save $200 by flying on Tuesday instead of Wednesday' },
        { icon: '🏆', text: 'Premium Economy available - only $250 more for extra legroom' }
      ]
    };
  };

  const toggleFilter = (category, option) => {
    setSelectedFilters(prev => {
      const categoryFilters = prev[category] || [];
      const newFilters = categoryFilters.includes(option)
        ? categoryFilters.filter(f => f !== option)
        : [...categoryFilters, option];
      
      return {
        ...prev,
        [category]: newFilters.length > 0 ? newFilters : undefined
      };
    });
  };

  const applyFilters = async () => {
    const filterParts = Object.entries(selectedFilters)
      .filter(([_, values]) => values && values.length > 0)
      .map(([category, values]) => `${category}: ${values.join(', ')}`);
    
    if (filterParts.length > 0) {
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      const filterQuery = `${lastUserMessage?.content || 'My previous search'} with these preferences: ${filterParts.join('; ')}`;
      await sendMessage(filterQuery);
    }
  };

  const sendMessage = async (messageText = inputValue) => {
    if (!messageText.trim()) return;

    const userMessage = { role: 'user', content: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);
    
    if (isLoggedIn) {
      setSearchHistory(prev => [{
        query: messageText,
        timestamp: new Date().toISOString()
      }, ...prev]);
    }

    // Check if this is the first message (initial flight search)
    const isFirstMessage = messages.length === 0;

    if (isFirstMessage) {
      // First message - show flight cards
      setTimeout(() => {
        const flightData = generateFlightOptions(messageText);
        setCurrentFlightData(flightData);
        const assistantMessage = {
          role: 'assistant',
          content: messageText,
          flightData: flightData,
          showCards: true
        };
        
        setMessages([...newMessages, assistantMessage]);
        setShowFilters(true);
        setIsLoading(false);
      }, 1500);
    } else {
      // Follow-up conversation - use Claude API
      try {
        // Build context for Claude
        let contextPrompt = `You are a helpful flight search assistant. `;
        
        if (currentFlightData) {
          contextPrompt += `The user previously searched for flights and you showed them these options:\n\n`;
          currentFlightData.flights.forEach(flight => {
            contextPrompt += `${flight.badge} - ${flight.airline} (${flight.flightNumber})\n`;
            contextPrompt += `Price: $${flight.price}, Duration: ${flight.duration}, Stops: ${flight.stops}\n`;
            contextPrompt += `Comfort Score: ${flight.comfortScore}/10, Carbon: ${flight.carbonFootprint}t CO₂\n`;
            contextPrompt += `WiFi: ${flight.wifiAvailable ? 'Yes' : 'No'}\n\n`;
          });
        }
        
        contextPrompt += `\nNow the user is asking a follow-up question. Answer conversationally and helpfully based on the flight options shown. If they ask about specific flights, refer to the details above. If they want different options, suggest modifications. Keep responses concise and friendly.`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            system: contextPrompt,
            messages: newMessages.map(msg => {
              if (msg.flightData) {
                return { role: msg.role, content: `User searched: ${msg.content}` };
              }
              return { role: msg.role, content: msg.content };
            })
          })
        });

        const data = await response.json();
        const assistantMessage = {
          role: 'assistant',
          content: data.content[0].text,
          showCards: false
        };
        
        setMessages([...newMessages, assistantMessage]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error:', error);
        // Fallback to simple response
        const fallbackMessage = {
          role: 'assistant',
          content: "I'd be happy to help you with that! Could you provide more details about what you're looking for?",
          showCards: false
        };
        setMessages([...newMessages, fallbackMessage]);
        setIsLoading(false);
      }
    }
  };

  const handleSocialLogin = (provider) => {
    setUser({
      name: `User ${Math.floor(Math.random() * 1000)}`,
      email: `user@${provider}.com`,
      provider: provider,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider}`
    });
    setIsLoggedIn(true);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setSearchHistory([]);
    setShowAccount(false);
  };

  const getAffiliateLink = () => {
    const partners = ['expedia', 'booking', 'kayak', 'skyscanner'];
    const baseUrls = {
      'expedia': 'https://www.expedia.com/Flights',
      'booking': 'https://www.booking.com/flights/',
      'kayak': 'https://www.kayak.com/flights',
      'skyscanner': 'https://www.skyscanner.com/'
    };
    return baseUrls[partners[Math.floor(Math.random() * partners.length)]];
  };

  const FlightCard = ({ flight }) => {
    const timelineExpanded = expandedTimeline[flight.id];
    const jetLagExpanded = expandedJetLag[flight.id];

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
        {/* Badge */}
        <div className="flex items-center justify-between mb-4">
          <span className={`${flight.badgeColor} px-4 py-1 rounded-full text-sm font-semibold`}>
            {flight.badge}
          </span>
          {flight.discount > 0 && (
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
              {flight.discount}% OFF
            </span>
          )}
        </div>

        {/* Airline & Flight Info */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900">{flight.airline}</h3>
          <p className="text-sm text-gray-500">{flight.flightNumber}</p>
        </div>

        {/* Route */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">{flight.route}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{flight.departure}</p>
              <p className="text-xs text-gray-500">Departure</p>
            </div>
            <div className="flex-1 mx-4">
              <div className="h-0.5 bg-gray-300 relative">
                <Plane className="w-5 h-5 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-center text-xs text-gray-500 mt-1">{flight.duration}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{flight.arrival}</p>
              <p className="text-xs text-gray-500">Arrival</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{flight.stops}</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 text-blue-600" />
              <span className="text-lg font-bold text-blue-600">{flight.comfortScore}</span>
            </div>
            <p className="text-xs text-gray-600">Comfort</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Leaf className="w-4 h-4 text-green-600" />
              <span className="text-lg font-bold text-green-600">{flight.carbonFootprint}t</span>
            </div>
            <p className="text-xs text-gray-600">CO₂</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-4 h-4 text-purple-600" />
              <span className="text-lg font-bold text-purple-600">{flight.wifiAvailable ? 'Yes' : 'No'}</span>
            </div>
            <p className="text-xs text-gray-600">WiFi</p>
          </div>
        </div>

        {/* Price Prediction */}
        <div className={`mb-4 p-4 rounded-lg ${
          flight.pricePrediction.trend === 'increasing' ? 'bg-red-50' :
          flight.pricePrediction.trend === 'decreasing' ? 'bg-green-50' : 'bg-blue-50'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className={`w-5 h-5 ${
              flight.pricePrediction.trend === 'increasing' ? 'text-red-600' :
              flight.pricePrediction.trend === 'decreasing' ? 'text-green-600' : 'text-blue-600'
            }`} />
            <span className="font-semibold">AI Price Prediction</span>
            <span className="ml-auto text-sm text-gray-600">{flight.pricePrediction.confidence}% confidence</span>
          </div>
          <p className="text-sm mb-1">{flight.pricePrediction.recommendation}</p>
          <p className="text-xs text-gray-600">{flight.pricePrediction.currentVsOptimal}</p>
        </div>

        {/* Journey Timeline Toggle */}
        <button
          onClick={() => setExpandedTimeline(prev => ({ ...prev, [flight.id]: !prev[flight.id] }))}
          className="w-full mb-3 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
        >
          <Clock className="w-5 h-5" />
          View Journey Timeline
          {timelineExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Journey Timeline Content */}
        {timelineExpanded && (
          <div className="mb-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              Your Journey Timeline
            </h4>
            <div className="space-y-3">
              {flight.timeline.map((event, idx) => (
                <div key={idx} className={`flex gap-3 ${event.type === 'layover' ? 'bg-blue-100 p-3 rounded-lg' : ''}`}>
                  <div className="flex-shrink-0 w-20 text-sm font-medium text-gray-700">
                    {event.time}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price & Book Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-gray-900">${flight.price}</span>
              {flight.originalPrice > flight.price && (
                <span className="text-lg text-gray-400 line-through">${flight.originalPrice}</span>
              )}
            </div>
            <p className="text-xs text-gray-500">Per person</p>
          </div>
          <a
            href={getAffiliateLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
          >
            Select Flight →
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header - Same as before */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FlightFinder
            </h1>
          </div>
          
          <nav className="flex items-center gap-6">
            <button className="text-gray-600 hover:text-blue-600 transition">Explore</button>
            <button className="text-gray-600 hover:text-blue-600 transition">Saved Searches</button>
            <button className="text-gray-600 hover:text-blue-600 transition">My Trips</button>
            
            {isLoggedIn ? (
              <div className="relative">
                <button 
                  onClick={() => setShowAccount(!showAccount)}
                  className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
                >
                  <img src={user?.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
                  <span className="text-sm font-medium">{user?.name}</span>
                </button>
                
                {showAccount && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border p-4">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                      <img src={user?.avatar} alt="Avatar" className="w-12 h-12 rounded-full" />
                      <div>
                        <div className="font-semibold">{user?.name}</div>
                        <div className="text-sm text-gray-500">{user?.email}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Edit Profile
                      </button>
                      <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 rounded flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                    
                    {searchHistory.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Recent Searches
                        </div>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {searchHistory.slice(0, 5).map((search, idx) => (
                            <div key={idx} className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                              {search.query}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setShowLogin(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Login Modal - Same as before */}
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative">
            <button 
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-bold mb-2">Welcome to FlightFinder</h2>
            <p className="text-gray-600 mb-6">Sign in to save your searches and manage trips</p>
            
            <div className="space-y-3">
              {[
                { name: 'Google', color: 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-500' },
                { name: 'Facebook', color: 'bg-blue-600 text-white hover:bg-blue-700' },
                { name: 'Yahoo', color: 'bg-purple-600 text-white hover:bg-purple-700' },
                { name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600' },
                { name: 'TikTok', color: 'bg-black text-white hover:bg-gray-800' }
              ].map(provider => (
                <button
                  key={provider.name}
                  onClick={() => handleSocialLogin(provider.name.toLowerCase())}
                  className={`w-full ${provider.color} py-3 rounded-lg font-medium transition flex items-center justify-center gap-2`}
                >
                  Continue with {provider.name}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setShowLogin(false)}
              className="w-full mt-4 text-gray-600 hover:text-gray-800 py-2"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex">
        {/* Filters Sidebar */}
        {showFilters && messages.length > 0 && (
          <div className="w-64 bg-white border-r h-[calc(100vh-73px)] sticky top-[73px] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Filters</h3>
                <button 
                  onClick={() => setSelectedFilters({})}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear all
                </button>
              </div>
              
              {Object.entries(filterOptions).map(([category, options]) => (
                <div key={category} className="mb-6">
                  <h4 className="font-semibold text-sm mb-3 text-gray-700">{category}</h4>
                  <div className="space-y-2">
                    {options.map(option => (
                      <button
                        key={option}
                        onClick={() => toggleFilter(category, option)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                          selectedFilters[category]?.includes(option)
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              <button
                onClick={applyFilters}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {messages.length === 0 ? (
            /* Landing Page */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="max-w-3xl w-full text-center">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mb-6">
                    <Plane className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Where would you like to go?
                  </h2>
                  <p className="text-xl text-gray-600 mb-8">
                    Tell us about your trip in your own words, and we'll find the best flight options for you.
                  </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="e.g., I need a flight from Houston to New Delhi on December 15th"
                      className="flex-1 px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={() => sendMessage()}
                      disabled={isLoading || !inputValue.trim()}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
                    >
                      {isLoading ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-left">
                  {[
                    { icon: MapPin, title: 'Any Destination', desc: 'Search by city, airport, or country' },
                    { icon: Calendar, title: 'Flexible Dates', desc: 'Find the best prices across dates' },
                    { icon: Users, title: 'Group Travel', desc: 'Book for families and groups' }
                  ].map((feature, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
                      <feature.icon className="w-8 h-8 text-blue-600 mb-3" />
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Chat Interface with Flight Cards */
            <div className="flex-1 overflow-y-auto p-6">
              {messages.map((message, idx) => (
                <div key={idx} className="mb-8">
                  {message.role === 'user' ? (
                    <div className="flex justify-end mb-4">
                      <div className="max-w-3xl px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        <p>{message.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {message.showCards ? (
                        /* Show Flight Cards */
                        <>
                          <div className="mb-6">
                            <p className="text-lg font-semibold text-gray-800 mb-2">
                              Great! I found {message.flightData.flights.length} excellent options for you:
                            </p>
                          </div>

                          {/* Personalized Recommendations */}
                          {message.flightData.recommendations && (
                            <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                              <h4 className="font-semibold mb-3 text-blue-900">💡 Personalized Recommendations</h4>
                              <div className="space-y-2">
                                {message.flightData.recommendations.map((rec, recIdx) => (
                                  <div key={recIdx} className="flex items-start gap-2 text-sm">
                                    <span>{rec.icon}</span>
                                    <span className="text-gray-700">{rec.text}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Flight Cards */}
                          <div className="grid grid-cols-1 gap-6 mb-6">
                            {message.flightData.flights.map((flight) => (
                              <FlightCard key={flight.id} flight={flight} />
                            ))}
                          </div>

                          {/* Conversation prompt */}
                          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl">
                            <p className="text-sm text-gray-700">
                              💬 <strong>Want to know more?</strong> Ask me anything about these flights, or request different options!
                            </p>
                            <p className="text-xs text-gray-600 mt-2">
                              Try: "Which one has the best WiFi?" or "Show me cheaper options" or "What about business class?"
                            </p>
                          </div>
                        </>
                      ) : (
                        /* Show Conversational Response */
                        <div className="flex justify-start mb-4">
                          <div className="max-w-3xl px-6 py-4 rounded-2xl bg-white shadow-md">
                            <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white shadow-md px-6 py-4 rounded-2xl">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Input Bar (only show after first search) */}
          {messages.length > 0 && (
            <div className="border-t bg-white p-4">
              <div className="max-w-4xl mx-auto flex gap-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask a follow-up question or refine your search..."
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
