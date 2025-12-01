import React, { useState, useEffect } from 'react';
import { Search, Plane, MapPin, Calendar, Users, Filter, X, ChevronDown, Menu, User, LogOut, Clock, Settings } from 'lucide-react';

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

  const filterOptions = {
    'Class': ['Economy', 'Premium Economy', 'Business', 'First'],
    'Trip Type': ['One way', 'Round trip'],
    'Stops': ['Non-Stop', '1 Stop', '2+ Stops'],
    'Baggage': ['Carry-on only', 'Checked bag included', '2+ bags'],
    'Departure Time': ['Early morning (12am-8am)', 'Morning (8am-12pm)', 'Afternoon (12pm-5pm)', 'Evening (5pm-12am)'],
    'Passengers': ['1 Adult', '2 Adults', '3+ Adults', 'With Children', 'With Infants']
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

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: newMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          system: `You are a helpful AI flight search assistant. You help users find the best flight options from various booking systems like Amadeus and Sabre.

When a user searches for flights, provide realistic flight recommendations with:
- Airline names
- Flight numbers
- Departure and arrival times
- Duration
- Number of stops
- Approximate prices
- Brief highlights (e.g., "Best value", "Fastest route", "Most convenient")

Format your responses in a clear, conversational way. Show 3-5 flight options when appropriate.

At the end of each flight option, suggest that users can click "Select This Flight" to book through our partner booking sites.

Remember the conversation context and help with follow-up questions about filters, dates, prices, etc.`
        })
      });

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.content[0].text
      };
      
      setMessages([...newMessages, assistantMessage]);
      setShowFilters(true);
    } catch (error) {
      console.error('Error:', error);
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    }
    
    setIsLoading(false);
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

  const getAffiliateLink = (flightInfo) => {
    // This would be replaced with actual affiliate links based on the airline/booking partner
    const baseUrls = {
      'expedia': 'https://www.expedia.com/Flights',
      'booking': 'https://www.booking.com/flights/',
      'kayak': 'https://www.kayak.com/flights',
      'skyscanner': 'https://www.skyscanner.com/'
    };
    
    // For demo purposes, rotating between partners
    const partners = Object.keys(baseUrls);
    const randomPartner = partners[Math.floor(Math.random() * partners.length)];
    
    return baseUrls[randomPartner];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
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

      {/* Login Modal */}
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
            /* Chat Interface */
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-3xl px-6 py-4 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'bg-white shadow-md'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none">
                          {message.content.split('\n').map((line, i) => {
                            // Check if line mentions booking/selecting
                            if (line.toLowerCase().includes('select') || 
                                line.toLowerCase().includes('book') ||
                                line.toLowerCase().includes('click')) {
                              return (
                                <div key={i} className="mt-3">
                                  <p className="mb-2">{line}</p>
                                  <a
                                    href={getAffiliateLink()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-medium no-underline"
                                  >
                                    Select This Flight →
                                  </a>
                                </div>
                              );
                            }
                            return <p key={i} className="mb-2">{line}</p>;
                          })}
                        </div>
                      ) : (
                        <p>{message.content}</p>
                      )}
                    </div>
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

              {/* Input Bar */}
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
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isLoading ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
