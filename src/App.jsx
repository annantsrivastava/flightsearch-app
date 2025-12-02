import React, { useState, useEffect, useRef } from 'react';
import { 
  Plane, MessageCircle, Send, Calendar, Users, MapPin, 
  DollarSign, Clock, Wifi, Leaf, TrendingUp, Star,
  ChevronDown, ChevronUp, User, Mail, Phone, CreditCard,
  CheckCircle, ArrowRight, Copy, ExternalLink, Sparkles,
  Menu, X, Search, Filter, Globe
} from 'lucide-react';

// Conversation states
const CONVERSATION_STATES = {
  GREETING: 'greeting',
  COLLECTING_ORIGIN: 'collecting_origin',
  COLLECTING_DESTINATION: 'collecting_destination',
  COLLECTING_DATES: 'collecting_dates',
  COLLECTING_PASSENGERS: 'collecting_passengers',
  COLLECTING_PREFERENCES: 'collecting_preferences',
  SHOWING_FLIGHTS: 'showing_flights',
  COLLECTING_PASSENGER_DETAILS: 'collecting_passenger_details',
  SHOWING_SUMMARY: 'showing_summary',
  CHAT_MODE: 'chat_mode'
};

function App() {
  // Core state
  const [conversationState, setConversationState] = useState(CONVERSATION_STATES.GREETING);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Search criteria collected from conversation
  const [searchCriteria, setSearchCriteria] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
    class: 'economy',
    tripType: 'roundtrip',
    maxStops: 'any',
    budget: 'any',
    preferredTime: 'any',
    directOnly: false
  });
  
  // Passenger details
  const [passengerDetails, setPassengerDetails] = useState([]);
  const [currentPassengerIndex, setCurrentPassengerIndex] = useState(0);
  
  // Flight data
  const [flightOptions, setFlightOptions] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  
  // UI state
  const [expandedTimeline, setExpandedTimeline] = useState(null);
  const [expandedJetLag, setExpandedJetLag] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [quickReplies, setQuickReplies] = useState([]);
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update quick replies based on conversation state
  useEffect(() => {
    switch (conversationState) {
      case CONVERSATION_STATES.COLLECTING_DATES:
        if (searchCriteria.departureDate && !searchCriteria.tripType) {
          setQuickReplies(['Round-trip', 'One-way']);
        } else {
          setQuickReplies([]);
        }
        break;
      case CONVERSATION_STATES.COLLECTING_PASSENGERS:
        setQuickReplies(['1', '2', '3', '4', '5']);
        break;
      case CONVERSATION_STATES.COLLECTING_PREFERENCES:
        if (!searchCriteria.class || searchCriteria.class === 'economy') {
          setQuickReplies(['Economy', 'Premium Economy', 'Business', 'First Class']);
        } else {
          setQuickReplies(['Direct flights only', 'Connections are ok']);
        }
        break;
      case CONVERSATION_STATES.SHOWING_FLIGHTS:
        setQuickReplies(['Book the cheapest', 'Book the fastest', 'Book best value', 'Tell me more']);
        break;
      default:
        setQuickReplies([]);
    }
  }, [conversationState, searchCriteria.class, searchCriteria.departureDate, searchCriteria.tripType]);

  // Initialize conversation
  useEffect(() => {
    const greetingMessage = {
      type: 'bot',
      text: "✈️ Hi! I'm your AI travel agent, and I'm here to help you find the perfect flight!",
      timestamp: new Date()
    };
    const firstQuestion = {
      type: 'bot',
      text: "You can tell me your trip details however you like! For example:\n\n📝 All at once: \"I want to fly from New York to London on Dec 15, returning Dec 22, 2 passengers, economy\"\n\n📝 Or just start: \"London on Dec 23rd\"\n\nI'll figure out what you mean and ask about anything I'm missing. What's your trip?",
      timestamp: new Date()
    };
    setMessages([greetingMessage, firstQuestion]);
    setConversationState(CONVERSATION_STATES.COLLECTING_ORIGIN);
  }, []);

  // Add message helper
  const addBotMessage = (text, delay = 1000) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        type: 'bot',
        text,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, delay);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, {
      type: 'user',
      text,
      timestamp: new Date()
    }]);
  };

  // INTELLIGENT extraction helper - extracts info from ANY context
  const extractFlightInfo = (text, conversationHistory = []) => {
    const lowerText = text.toLowerCase();
    const extracted = {};
    
    // Extract origin and destination from multiple patterns
    // Pattern 1: "from X to Y"
    const fromToPattern = /from\s+([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/i;
    const match = text.match(fromToPattern);
    
    if (match) {
      extracted.origin = match[1].trim();
      extracted.destination = match[2].trim();
    }
    
    // Pattern 2: "X to Y" (without "from")
    if (!extracted.destination) {
      const toPattern = /([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+?)(?:\s+on|,|\.|$)/i;
      const toMatch = text.match(toPattern);
      if (toMatch) {
        extracted.origin = toMatch[1].trim();
        extracted.destination = toMatch[2].trim();
      }
    }
    
    // Pattern 3: Just a city name when expecting destination (context-aware)
    if (!extracted.destination && conversationHistory.length > 0) {
      const lastBotMsg = conversationHistory[conversationHistory.length - 1];
      if (lastBotMsg?.text?.toLowerCase().includes('where would you like to go')) {
        // This is likely just the destination
        const cityMatch = text.match(/([a-zA-Z\s]+?)(?:\s+on|,|\.|$)/i);
        if (cityMatch) {
          extracted.destination = cityMatch[1].trim();
        }
      }
    }
    
    // Extract dates - ENHANCED with more patterns
    const datePatterns = [
      // "dec 23rd", "december 23rd 2024"
      /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s*(?:\d{4})?/gi,
      // "23 dec", "23 december 2024"
      /\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s*(?:\d{4})?/gi,
      // "12/25/2024", "12/25"
      /\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/g,
      // "2024-12-25"
      /\d{4}-\d{2}-\d{2}/g,
      // "on dec 23" pattern
      /on\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?/gi
    ];
    
    for (const pattern of datePatterns) {
      const dateMatch = text.match(pattern);
      if (dateMatch) {
        extracted.date = dateMatch[0].replace(/^on\s+/i, '').trim();
        break;
      }
    }
    
    // Extract number of passengers
    const passengersPattern = /(\d+)\s*(?:passenger|person|people|traveler|pax)/i;
    const passengersMatch = text.match(passengersPattern);
    if (passengersMatch) {
      extracted.passengers = parseInt(passengersMatch[1]);
    }
    
    // Extract class
    if (lowerText.includes('first class') || lowerText.includes('first-class')) {
      extracted.class = 'first';
    } else if (lowerText.includes('business')) {
      extracted.class = 'business';
    } else if (lowerText.includes('premium')) {
      extracted.class = 'premium';
    } else if (lowerText.includes('economy')) {
      extracted.class = 'economy';
    }
    
    // Extract trip type
    if (lowerText.includes('one-way') || lowerText.includes('oneway') || lowerText.includes('one way')) {
      extracted.tripType = 'oneway';
    } else if (lowerText.includes('round-trip') || lowerText.includes('roundtrip') || lowerText.includes('return')) {
      extracted.tripType = 'roundtrip';
    }
    
    return extracted;
  };

  // Check what information we still need
  const checkMissingInfo = (criteria) => {
    const missing = [];
    if (!criteria.origin) missing.push('origin');
    if (!criteria.destination) missing.push('destination');
    if (!criteria.departureDate) missing.push('departureDate');
    if (!criteria.tripType) missing.push('tripType');
    if (criteria.tripType === 'roundtrip' && !criteria.returnDate) missing.push('returnDate');
    if (!criteria.passengers || criteria.passengers === 1) missing.push('passengers');
    if (!criteria.class) missing.push('class');
    return missing;
  };

  // Smart response generator based on what's missing
  const generateSmartResponse = (extracted, currentCriteria) => {
    const updated = { ...currentCriteria };
    let responses = [];
    
    // Update criteria with extracted info
    if (extracted.origin && !updated.origin) {
      updated.origin = extracted.origin;
      responses.push(`Got it - flying from ${extracted.origin}`);
    }
    
    if (extracted.destination && !updated.destination) {
      updated.destination = extracted.destination;
      responses.push(`to ${extracted.destination}`);
    }
    
    if (extracted.date && !updated.departureDate) {
      updated.departureDate = extracted.date;
      responses.push(`on ${extracted.date}`);
    }
    
    if (extracted.passengers) {
      updated.passengers = extracted.passengers;
      responses.push(`for ${extracted.passengers} passenger${extracted.passengers > 1 ? 's' : ''}`);
    }
    
    if (extracted.class) {
      updated.class = extracted.class;
      responses.push(`in ${extracted.class} class`);
    }
    
    if (extracted.tripType) {
      updated.tripType = extracted.tripType;
    }
    
    return { updated, responses };
  };

  // Fallback response generator (no API needed)
  const generateFallbackResponse = (userMessage, conversationHistory, currentCriteria) => {
    const lowerInput = userMessage.toLowerCase();
    
    // Handle common queries without API
    if (lowerInput.includes('clear') || lowerInput.includes('reset')) {
      return "Sure! I'll clear everything and we can start fresh. What's your new trip?";
    }
    
    if (lowerInput.includes('change') && lowerInput.includes('date')) {
      return "I'd be happy to search for a different date! What date would you like to try?";
    }
    
    if (lowerInput.includes('wifi')) {
      return "Great question! All three flights have WiFi available. The Best Value option has excellent connectivity!";
    }
    
    if (lowerInput.includes('cheap') || lowerInput.includes('price')) {
      return "The cheapest option is the first card at the best price! It offers great value for your trip.";
    }
    
    if (lowerInput.includes('fast') || lowerInput.includes('quick')) {
      return "The fastest option is the middle card - it has the shortest flight duration!";
    }
    
    if (lowerInput.includes('recommend')) {
      return "Based on your search, I'd recommend the Best Value option - it offers the perfect balance of price, comfort, and flight time!";
    }
    
    // Default helpful response
    return "I'm here to help! You can ask me about the flights, or click one of the booking buttons below.";
  };

  // INTELLIGENT conversation handler (works WITHOUT API calls)
  const handleUserResponse = async (input) => {
    if (!input.trim()) return;

    addUserMessage(input);
    setUserInput('');
    setIsTyping(true);

    const lowerInput = input.toLowerCase();

    // Check for special commands
    if (lowerInput.includes('clear') || lowerInput.includes('reset') || lowerInput.includes('start over')) {
      setTimeout(() => {
        addBotMessage(`Sure! I'll clear everything and we can start fresh. What's your new trip?`, 800);
        // Reset all state
        setSearchCriteria({
          origin: '',
          destination: '',
          departureDate: '',
          returnDate: '',
          passengers: 1,
          class: 'economy',
          tripType: 'roundtrip',
          maxStops: 'any',
          budget: 'any',
          preferredTime: 'any',
          directOnly: false
        });
        setFlightOptions([]);
        setSelectedFlight(null);
        setShowSummary(false);
        setConversationState(CONVERSATION_STATES.COLLECTING_ORIGIN);
        setIsTyping(false);
      }, 800);
      return;
    }

    // If showing flights and user selected one, handle continuation
    if (conversationState === CONVERSATION_STATES.SHOWING_FLIGHTS && selectedFlight) {
      // User selected a flight and is typing - they probably want to continue
      addBotMessage(`Great! Let me collect passenger details for your ${selectedFlight.airline} flight.`, 800);
      setTimeout(() => {
        // Initialize passenger details
        const passengers = Array(searchCriteria.passengers).fill(null).map((_, i) => ({
          id: i + 1,
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          email: '',
          phone: ''
        }));
        setPassengerDetails(passengers);
        setCurrentPassengerIndex(0);
        
        addBotMessage(`Let's start with Passenger 1. What's their first name?`, 1600);
        setConversationState(CONVERSATION_STATES.COLLECTING_PASSENGER_DETAILS);
        setIsTyping(false);
      }, 1200);
      return;
    }

    // If showing flights, use fallback responses
    if (conversationState === CONVERSATION_STATES.SHOWING_FLIGHTS || flightOptions.length > 0) {
      // Check if user wants to modify search
      if (lowerInput.includes('change') || lowerInput.includes('different') || lowerInput.includes('another')) {
        const extracted = extractFlightInfo(input, messages);
        
        if (extracted.date) {
          const updatedCriteria = { ...searchCriteria, departureDate: extracted.date };
          setSearchCriteria(updatedCriteria);
          addBotMessage(`Got it! Let me search for flights on ${extracted.date}...`, 1000);
          setTimeout(() => {
            const flights = generateFlightOptions(updatedCriteria);
            setFlightOptions(flights);
            addBotMessage(`Here are the updated options for ${extracted.date}!`, 1500);
            setIsTyping(false);
          }, 1500);
          return;
        }
        
        addBotMessage(`I can help you modify your search! What would you like to change? (date, destination, number of passengers, etc.)`, 1000);
        setIsTyping(false);
        return;
      }
      
      // Use fallback response for other questions
      const fallbackResponse = generateFallbackResponse(input, messages, searchCriteria);
      setTimeout(() => {
        addBotMessage(fallbackResponse, 1000);
        
        // Check if user wants to book
        if (lowerInput.includes('book') || lowerInput.includes('select')) {
          setTimeout(() => {
            handleFlightConversation(input);
          }, 1500);
        }
        setIsTyping(false);
      }, 800);
      return;
    }

    // Continue with extraction logic for initial search
    const extracted = extractFlightInfo(input, messages);
    
    // Create a working copy of current criteria
    let updatedCriteria = { ...searchCriteria };
    let extractedSummary = [];
    
    // Update criteria with extracted info
    if (extracted.origin && !updatedCriteria.origin) {
      updatedCriteria.origin = extracted.origin;
      extractedSummary.push(`flying from ${extracted.origin}`);
    }
    
    if (extracted.destination && !updatedCriteria.destination) {
      updatedCriteria.destination = extracted.destination;
      extractedSummary.push(`to ${extracted.destination}`);
    }
    
    if (extracted.date && !updatedCriteria.departureDate) {
      updatedCriteria.departureDate = extracted.date;
      extractedSummary.push(`on ${extracted.date}`);
    }
    
    if (extracted.passengers && !updatedCriteria.passengers) {
      updatedCriteria.passengers = extracted.passengers;
      extractedSummary.push(`for ${extracted.passengers} passenger${extracted.passengers > 1 ? 's' : ''}`);
    } else if (!extracted.passengers && !updatedCriteria.passengers) {
      const numPassengers = parseInt(input.trim());
      if (!isNaN(numPassengers) && numPassengers > 0 && numPassengers <= 10) {
        updatedCriteria.passengers = numPassengers;
        extractedSummary.push(`for ${numPassengers} passenger${numPassengers > 1 ? 's' : ''}`);
      }
    }
    
    if (extracted.class && !updatedCriteria.class) {
      updatedCriteria.class = extracted.class;
      extractedSummary.push(`in ${extracted.class} class`);
    }
    
    if (extracted.tripType && !updatedCriteria.tripType) {
      updatedCriteria.tripType = extracted.tripType;
    }
    
    if (extracted.date && updatedCriteria.tripType === 'roundtrip' && !updatedCriteria.returnDate && updatedCriteria.departureDate) {
      updatedCriteria.returnDate = extracted.date;
      extractedSummary.push(`returning ${extracted.date}`);
    }
    
    // Update the state IMMEDIATELY
    setSearchCriteria(updatedCriteria);
    
    // Check what information is still missing
    const missing = [];
    if (!updatedCriteria.origin) missing.push('origin');
    if (!updatedCriteria.destination) missing.push('destination');
    if (!updatedCriteria.departureDate) missing.push('departureDate');
    if (!updatedCriteria.tripType) missing.push('tripType');
    if (updatedCriteria.tripType === 'roundtrip' && !updatedCriteria.returnDate) missing.push('returnDate');
    if (!updatedCriteria.passengers || updatedCriteria.passengers < 1) missing.push('passengers');
    if (!updatedCriteria.class) missing.push('class');
    
    // Handle "I already told you"
    if (lowerInput.includes('already') || lowerInput.includes('i told') || lowerInput.includes('i said')) {
      addBotMessage(`I apologize for the confusion! Let me check what I have...`, 800);
      
      setTimeout(() => {
        const hasInfo = [];
        if (updatedCriteria.origin) hasInfo.push(`✅ From: ${updatedCriteria.origin}`);
        if (updatedCriteria.destination) hasInfo.push(`✅ To: ${updatedCriteria.destination}`);
        if (updatedCriteria.departureDate) hasInfo.push(`✅ Departing: ${updatedCriteria.departureDate}`);
        if (updatedCriteria.returnDate) hasInfo.push(`✅ Returning: ${updatedCriteria.returnDate}`);
        if (updatedCriteria.passengers) hasInfo.push(`✅ Passengers: ${updatedCriteria.passengers}`);
        if (updatedCriteria.class) hasInfo.push(`✅ Class: ${updatedCriteria.class}`);
        
        if (hasInfo.length > 0) {
          addBotMessage(`Here's what I have:\n${hasInfo.join('\n')}`, 1600);
        }
        
        setTimeout(() => {
          if (missing.length === 0) {
            addBotMessage(`Perfect! I have everything. Let me search for flights... 🔍`, 2400);
            setTimeout(() => {
              const flights = generateFlightOptions(updatedCriteria);
              setFlightOptions(flights);
              setConversationState(CONVERSATION_STATES.SHOWING_FLIGHTS);
              addBotMessage(`🎉 Found ${flights.length} great options!`, 1000);
              setIsTyping(false);
            }, 1500);
          } else {
            const nextMissing = missing[0];
            askForMissingInfo(nextMissing, updatedCriteria, 2400);
            setIsTyping(false);
          }
        }, 1600);
      }, 800);
      return;
    }
    
    // We have everything we need!
    if (missing.length === 0) {
      if (extractedSummary.length > 0) {
        addBotMessage(`Perfect! ${extractedSummary.join(', ')}! 🎉`, 800);
      } else {
        addBotMessage(`Excellent! I have all the details! 🎉`, 800);
      }
      
      setTimeout(() => {
        addBotMessage(`Let me search for the best flights...`, 1800);
        setTimeout(() => {
          const flights = generateFlightOptions(updatedCriteria);
          setFlightOptions(flights);
          setConversationState(CONVERSATION_STATES.SHOWING_FLIGHTS);
          
          addBotMessage(`🎉 Found ${flights.length} great options from ${updatedCriteria.origin} to ${updatedCriteria.destination}!`, 1000);
          setTimeout(() => {
            addBotMessage(`Feel free to ask me anything about these flights, or click below to book!`, 2500);
            setIsTyping(false);
          }, 1500);
        }, 1500);
      }, 800);
      return;
    }
    
    // Still collecting information
    if (extractedSummary.length > 0) {
      addBotMessage(`Great! ${extractedSummary.join(', ')}! ✈️`, 800);
      setTimeout(() => {
        askForMissingInfo(missing[0], updatedCriteria, 1600);
        setIsTyping(false);
      }, 800);
    } else {
      askForMissingInfo(missing[0], updatedCriteria, 800);
      setIsTyping(false);
    }
  };

  // Helper function to ask for missing information
  const askForMissingInfo = (missingItem, criteria, delay = 800) => {
    // Safeguard: Don't ask if we just asked this in the last message
    const lastBotMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    if (lastBotMessage && lastBotMessage.type === 'bot') {
      const lastQuestion = lastBotMessage.text.toLowerCase();
      
      // Check if we're about to ask the same question
      if (missingItem === 'passengers' && lastQuestion.includes('how many passengers')) {
        console.log('Prevented duplicate passengers question');
        return; // Don't ask again!
      }
      if (missingItem === 'origin' && lastQuestion.includes('where are you flying from')) {
        console.log('Prevented duplicate origin question');
        return;
      }
      if (missingItem === 'destination' && lastQuestion.includes('where would you like to go')) {
        console.log('Prevented duplicate destination question');
        return;
      }
      if (missingItem === 'departureDate' && lastQuestion.includes('when would you like to depart')) {
        console.log('Prevented duplicate departure date question');
        return;
      }
      if (missingItem === 'returnDate' && lastQuestion.includes('when would you like to return')) {
        console.log('Prevented duplicate return date question');
        return;
      }
      if (missingItem === 'class' && lastQuestion.includes('what class')) {
        console.log('Prevented duplicate class question');
        return;
      }
    }
    
    switch (missingItem) {
      case 'origin':
        addBotMessage(`Where are you flying from?`, delay);
        setConversationState(CONVERSATION_STATES.COLLECTING_ORIGIN);
        break;
      case 'destination':
        addBotMessage(`Where would you like to go?`, delay);
        setConversationState(CONVERSATION_STATES.COLLECTING_DESTINATION);
        break;
      case 'departureDate':
        addBotMessage(`When would you like to depart? (e.g., Dec 15, 2024)`, delay);
        setConversationState(CONVERSATION_STATES.COLLECTING_DATES);
        break;
      case 'tripType':
        addBotMessage(`Is this a one-way trip or round-trip?`, delay);
        break;
      case 'returnDate':
        addBotMessage(`When would you like to return?`, delay);
        break;
      case 'passengers':
        addBotMessage(`How many passengers will be traveling?`, delay);
        setConversationState(CONVERSATION_STATES.COLLECTING_PASSENGERS);
        break;
      case 'class':
        addBotMessage(`What class would you prefer? (Economy, Premium Economy, Business, or First Class)`, delay);
        setConversationState(CONVERSATION_STATES.COLLECTING_PREFERENCES);
        break;
      default:
        addBotMessage(`I need a bit more information to continue.`, delay);
    }
  };

  // Generate mock flight data based on collected criteria
  const generateAndShowFlights = () => {
    // Use current search criteria from state
    const criteria = searchCriteria;
    const flights = generateFlightOptions(criteria);
    setFlightOptions(flights);
    setConversationState(CONVERSATION_STATES.SHOWING_FLIGHTS);
    
    addBotMessage(`🎉 Found ${flights.length} great options for you from ${criteria.origin} to ${criteria.destination}!`, 1000);
    setTimeout(() => {
      addBotMessage(`Here are my top recommendations below! You can ask me questions like:\n• "Which one is fastest?"\n• "Tell me about the ${flights[0].airline} flight"\n• "Which has the best WiFi?"\n• "I want to book the cheapest one"`, 2500);
    }, 1500);
  };

  // Handle flight-related conversation
  const handleFlightConversation = async (input) => {
    const lowerInput = input.toLowerCase();
    
    // Check if user wants to book a specific flight
    if (lowerInput.includes('book') || lowerInput.includes('select') || lowerInput.includes('choose')) {
      let flightIndex = -1;
      
      if (lowerInput.includes('cheapest') || lowerInput.includes('cheap')) {
        flightIndex = 0;
      } else if (lowerInput.includes('fastest') || lowerInput.includes('quick')) {
        flightIndex = 1;
      } else if (lowerInput.includes('best') || lowerInput.includes('value')) {
        flightIndex = 2;
      } else if (lowerInput.includes('first') || lowerInput.includes('1')) {
        flightIndex = 0;
      } else if (lowerInput.includes('second') || lowerInput.includes('2')) {
        flightIndex = 1;
      } else if (lowerInput.includes('third') || lowerInput.includes('3')) {
        flightIndex = 2;
      }
      
      if (flightIndex >= 0 && flightOptions[flightIndex]) {
        selectFlightForBooking(flightOptions[flightIndex]);
      } else {
        addBotMessage(`Which flight would you like to book? You can say "the cheapest one", "the fastest one", or "the best value one"`, 800);
      }
      return;
    }
    
    // Answer questions about flights
    if (lowerInput.includes('fastest')) {
      addBotMessage(`The fastest option is the ⚡ Fastest flight - it takes only ${flightOptions[1].duration} with ${flightOptions[1].stops} stop. Would you like to book this one?`, 800);
    } else if (lowerInput.includes('cheapest') || lowerInput.includes('cheap')) {
      addBotMessage(`The cheapest option is $${flightOptions[0].price} with ${flightOptions[0].airline}. It takes ${flightOptions[0].duration} with ${flightOptions[0].stops} stop. Great value! Want to book it?`, 800);
    } else if (lowerInput.includes('wifi')) {
      const wifiFlights = flightOptions.filter(f => f.hasWifi);
      addBotMessage(`Good news! ${wifiFlights.length} of these flights have WiFi available. The Best Value option has excellent WiFi for staying connected. Interested?`, 800);
    } else if (lowerInput.includes('direct') || lowerInput.includes('non-stop')) {
      addBotMessage(`I'm showing flights with connections since they offer better value. Direct flights on this route are typically $200-300 more. Would you like me to search for direct flights instead?`, 800);
    } else {
      // Natural response
      addBotMessage(`I can help you with that! Try asking:\n• "Book the cheapest flight"\n• "Which one is fastest?"\n• "Tell me about luggage"\n• "Which has the best comfort?"`, 800);
    }
  };

  // Select flight and start passenger detail collection
  const selectFlightForBooking = (flight) => {
    setSelectedFlight(flight);
    addBotMessage(`Excellent choice! You've selected the ${flight.type} option with ${flight.airline}! ✈️`, 800);
    
    setTimeout(() => {
      addBotMessage(`Now I need to collect passenger details for booking. This will just take a minute!`, 1800);
      
      setTimeout(() => {
        // Initialize passenger details array
        const passengers = Array(searchCriteria.passengers).fill(null).map((_, i) => ({
          id: i + 1,
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          passportNumber: '',
          email: '',
          phone: ''
        }));
        setPassengerDetails(passengers);
        setCurrentPassengerIndex(0);
        
        addBotMessage(`Let's start with Passenger 1. What's their first name?`, 2800);
        setConversationState(CONVERSATION_STATES.COLLECTING_PASSENGER_DETAILS);
      }, 1800);
    }, 800);
  };

  // Handle passenger details collection
  const handlePassengerDetailsCollection = (input) => {
    const passenger = passengerDetails[currentPassengerIndex];
    
    if (!passenger.firstName) {
      passenger.firstName = input;
      addBotMessage(`Great! And their last name?`, 600);
    } else if (!passenger.lastName) {
      passenger.lastName = input;
      addBotMessage(`Perfect! What's ${passenger.firstName}'s date of birth? (e.g., Jan 15, 1990)`, 600);
    } else if (!passenger.dateOfBirth) {
      passenger.dateOfBirth = input;
      addBotMessage(`Got it! Email address for ${passenger.firstName}?`, 600);
    } else if (!passenger.email) {
      passenger.email = input;
      addBotMessage(`Excellent! Phone number?`, 600);
    } else if (!passenger.phone) {
      passenger.phone = input;
      
      // Check if there are more passengers
      if (currentPassengerIndex < searchCriteria.passengers - 1) {
        setCurrentPassengerIndex(currentPassengerIndex + 1);
        addBotMessage(`Perfect! Now let's get details for Passenger ${currentPassengerIndex + 2}. First name?`, 800);
      } else {
        // All passengers collected, show summary
        addBotMessage(`🎉 Awesome! I have all the passenger details. Let me prepare your booking summary...`, 800);
        setTimeout(() => {
          setShowSummary(true);
          setConversationState(CONVERSATION_STATES.SHOWING_SUMMARY);
          addBotMessage(`I've prepared your complete booking summary below! You can copy any information you need, and when you're ready, click the "Complete Booking" button to go to the booking site. 👇`, 2000);
        }, 1500);
      }
    }
    
    // Update passenger details
    const updatedPassengers = [...passengerDetails];
    updatedPassengers[currentPassengerIndex] = passenger;
    setPassengerDetails(updatedPassengers);
  };

  // Handle general chat mode
  const handleChatMode = async (input) => {
    // This would integrate with Claude API for intelligent responses
    addBotMessage(`I understand you're asking about that. Let me help you with the best information!`, 800);
  };

  // Generate mock flight data
  const generateFlightOptions = (criteria) => {
    const airlines = ['Emirates', 'Qatar Airways', 'Singapore Airlines', 'Lufthansa', 'British Airways'];
    const basePrice = criteria.class === 'economy' ? 450 : 
                     criteria.class === 'premium' ? 800 :
                     criteria.class === 'business' ? 2500 : 5000;
    
    return [
      {
        id: 1,
        type: '💰 Cheapest',
        airline: airlines[Math.floor(Math.random() * airlines.length)],
        flightNumber: 'EK' + Math.floor(Math.random() * 900 + 100),
        price: basePrice,
        originalPrice: Math.floor(basePrice * 1.15),
        discount: 15,
        duration: '14h 30m',
        stops: 1,
        departure: {
          time: '10:30 AM',
          airport: criteria.origin,
          date: criteria.departureDate
        },
        arrival: {
          time: '2:00 PM',
          airport: criteria.destination,
          date: criteria.departureDate
        },
        comfort: 7.5,
        carbonFootprint: 1.2,
        hasWifi: true,
        baggage: '2 x 23kg',
        pricePrediction: {
          trend: 'increasing',
          confidence: 85,
          recommendation: 'Book now - prices rising',
          optimalPrice: basePrice - 30
        }
      },
      {
        id: 2,
        type: '⚡ Fastest',
        airline: airlines[Math.floor(Math.random() * airlines.length)],
        flightNumber: 'QR' + Math.floor(Math.random() * 900 + 100),
        price: Math.floor(basePrice * 1.3),
        originalPrice: Math.floor(basePrice * 1.45),
        discount: 10,
        duration: '11h 45m',
        stops: 1,
        departure: {
          time: '8:15 AM',
          airport: criteria.origin,
          date: criteria.departureDate
        },
        arrival: {
          time: '10:00 PM',
          airport: criteria.destination,
          date: criteria.departureDate
        },
        comfort: 8.5,
        carbonFootprint: 1.0,
        hasWifi: true,
        baggage: '2 x 23kg',
        pricePrediction: {
          trend: 'stable',
          confidence: 78,
          recommendation: 'Good time to book',
          optimalPrice: Math.floor(basePrice * 1.25)
        }
      },
      {
        id: 3,
        type: '⭐ Best Value',
        airline: airlines[Math.floor(Math.random() * airlines.length)],
        flightNumber: 'SQ' + Math.floor(Math.random() * 900 + 100),
        price: Math.floor(basePrice * 1.15),
        originalPrice: Math.floor(basePrice * 1.35),
        discount: 18,
        duration: '13h 15m',
        stops: 1,
        departure: {
          time: '2:45 PM',
          airport: criteria.origin,
          date: criteria.departureDate
        },
        arrival: {
          time: '6:00 AM',
          airport: criteria.destination,
          date: criteria.departureDate
        },
        comfort: 9.0,
        carbonFootprint: 1.1,
        hasWifi: true,
        baggage: '2 x 23kg',
        pricePrediction: {
          trend: 'decreasing',
          confidence: 72,
          recommendation: 'Consider waiting 3 days',
          optimalPrice: Math.floor(basePrice * 1.10)
        }
      }
    ];
  };

  // Copy to clipboard
  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Generate booking URL with parameters for different affiliate sites
  const generateBookingURL = (affiliateSite = 'skyscanner', flightData = null) => {
    const flight = flightData || selectedFlight;
    const criteria = searchCriteria;
    
    // Format dates for URLs (most sites use YYYY-MM-DD)
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      // Try to parse various date formats
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        // If can't parse, return as is
        return dateStr;
      }
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    const departDate = formatDate(criteria.departureDate);
    const returnDate = formatDate(criteria.returnDate);
    
    // Map class to airline codes
    const classMap = {
      'economy': 'economy',
      'premium': 'premium_economy',
      'business': 'business',
      'first': 'first'
    };
    
    const cabinClass = classMap[criteria.class] || 'economy';
    
    // Build affiliate links based on site
    const affiliateLinks = {
      // SKYSCANNER (Best overall)
      skyscanner: (() => {
        // Skyscanner URL format
        const origin = criteria.origin?.toLowerCase().replace(/\s+/g, '-') || 'new-york';
        const destination = criteria.destination?.toLowerCase().replace(/\s+/g, '-') || 'london';
        const tripType = criteria.tripType === 'oneway' ? 'one-way' : 'return';
        
        let url = `https://www.skyscanner.com/transport/flights/${origin}/${destination}`;
        
        if (departDate) {
          url += `/${departDate.replace(/-/g, '')}`;
          if (returnDate && tripType === 'return') {
            url += `/${returnDate.replace(/-/g, '')}`;
          }
        }
        
        url += `/?adults=${criteria.passengers || 1}&cabinclass=${cabinClass}`;
        
        // Add affiliate parameter (replace with your actual affiliate ID)
        url += `&associateid=YOUR_SKYSCANNER_AFFILIATE_ID`;
        
        return url;
      })(),
      
      // EXPEDIA
      expedia: (() => {
        const flightType = criteria.tripType === 'oneway' ? 'on' : 'rt';
        const tripMode = criteria.tripType === 'oneway' ? 'oneway' : 'roundtrip';
        
        const params = new URLSearchParams({
          'flight-type': flightType,
          mode: 'search',
          trip: tripMode,
          leg1: `from:${criteria.origin},to:${criteria.destination},departure:${departDate}TANYT`,
          passengers: `adults:${criteria.passengers || 1},children:0,seniors:0,infantinlap:N`,
          options: `cabinclass:${cabinClass}`,
        });
        
        if (returnDate && criteria.tripType !== 'oneway') {
          params.append('leg2', `from:${criteria.destination},to:${criteria.origin},departure:${returnDate}TANYT`);
        }
        
        // Add affiliate parameter (replace with your actual affiliate ID)
        let url = `https://www.expedia.com/Flights-Search?${params}`;
        url += `&affcid=YOUR_EXPEDIA_AFFILIATE_ID`;
        
        return url;
      })(),
      
      // KAYAK
      kayak: (() => {
        const params = new URLSearchParams({
          sort: 'bestflight_a',
          attempt: '1',
          calendar_only: 'false'
        });
        
        const origin = criteria.origin?.toUpperCase().slice(0, 3) || 'NYC';
        const destination = criteria.destination?.toUpperCase().slice(0, 3) || 'LON';
        
        let url = `https://www.kayak.com/flights/${origin}-${destination}`;
        
        if (departDate) {
          url += `/${departDate}`;
          if (returnDate && criteria.tripType !== 'oneway') {
            url += `/${returnDate}`;
          }
        }
        
        url += `/${criteria.passengers || 1}adults?${params}`;
        
        // Add affiliate parameter (replace with your actual affiliate ID)
        url += `&sub=YOUR_KAYAK_AFFILIATE_ID`;
        
        return url;
      })(),
      
      // BOOKING.COM (for hotels, but good to have)
      booking: (() => {
        const checkIn = departDate;
        const checkOut = returnDate || departDate;
        const dest = criteria.destination || 'London';
        
        let url = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(dest)}`;
        
        if (checkIn) {
          url += `&checkin=${checkIn}`;
        }
        if (checkOut) {
          url += `&checkout=${checkOut}`;
        }
        
        url += `&group_adults=${criteria.passengers || 1}&no_rooms=1`;
        
        // Add affiliate parameter (replace with your actual affiliate ID)
        url += `&aid=YOUR_BOOKING_AFFILIATE_ID`;
        
        return url;
      })(),
      
      // PRICELINE
      priceline: (() => {
        const params = new URLSearchParams({
          'departure-airport': criteria.origin || 'NYC',
          'destination-airport': criteria.destination || 'LON',
          'trip-type': criteria.tripType === 'oneway' ? 'one-way' : 'round-trip',
          'departure-date': departDate,
          'number-of-passengers': criteria.passengers || 1,
          'cabin-class': cabinClass
        });
        
        if (returnDate && criteria.tripType !== 'oneway') {
          params.append('return-date', returnDate);
        }
        
        let url = `https://www.priceline.com/m/fly/search/results?${params}`;
        
        // Add affiliate parameter (replace with your actual affiliate ID)
        url += `&refid=YOUR_PRICELINE_AFFILIATE_ID`;
        
        return url;
      })()
    };
    
    return affiliateLinks[affiliateSite] || affiliateLinks.skyscanner;
  };

  // Get multiple booking options for user to choose
  const getMultipleBookingOptions = () => {
    return [
      { name: 'Skyscanner', url: generateBookingURL('skyscanner'), recommended: true },
      { name: 'Expedia', url: generateBookingURL('expedia') },
      { name: 'Kayak', url: generateBookingURL('kayak') },
      { name: 'Priceline', url: generateBookingURL('priceline') }
    ];
  };

  // Add state for mobile menu and sign in modal
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header with Top Navigation Bar */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Plane className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FlightFinder AI
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Flights
              </a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Hotels
              </a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                My Trips
              </a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Help
              </a>
            </nav>

            {/* Right Side - AI Status + Sign In */}
            <div className="flex items-center gap-4">
              {/* AI Active Badge */}
              <span className="hidden sm:flex px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium items-center gap-1">
                <Sparkles className="w-4 h-4" />
                AI Agent Active
              </span>

              {/* Sign In Button */}
              <button 
                onClick={() => setShowSignInModal(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <User className="w-4 h-4" />
                Sign In
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {showMobileMenu ? (
                  <X className="w-6 h-6 text-gray-700" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden mt-4 pt-4 border-t">
              <nav className="flex flex-col gap-3">
                <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium py-2">
                  Flights
                </a>
                <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium py-2">
                  Hotels
                </a>
                <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium py-2">
                  My Trips
                </a>
                <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium py-2">
                  Help
                </a>
                <button 
                  onClick={() => setShowSignInModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium mt-2"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* LEFT SIDEBAR - FILTERS */}
          {flightOptions.length > 0 && (
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                <div className="flex items-center gap-2 mb-6">
                  <Filter className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-lg">Filters</h3>
                </div>
                
                {/* Class Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-3 text-gray-700">Class</label>
                  <div className="space-y-2">
                    {['economy', 'premium', 'business', 'first'].map((classType) => (
                      <label key={classType} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="class"
                          value={classType}
                          checked={searchCriteria.class === classType}
                          onChange={(e) => setSearchCriteria(prev => ({ ...prev, class: e.target.value }))}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm capitalize">{classType === 'premium' ? 'Premium Economy' : classType}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Trip Type Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-3 text-gray-700">Trip Type</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tripType"
                        value="roundtrip"
                        checked={searchCriteria.tripType === 'roundtrip'}
                        onChange={(e) => setSearchCriteria(prev => ({ ...prev, tripType: e.target.value }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">Round Trip</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tripType"
                        value="oneway"
                        checked={searchCriteria.tripType === 'oneway'}
                        onChange={(e) => setSearchCriteria(prev => ({ ...prev, tripType: e.target.value }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">One Way</span>
                    </label>
                  </div>
                </div>
                
                {/* Stops Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-3 text-gray-700">Stops</label>
                  <div className="space-y-2">
                    {['any', 'nonstop', '1', '2+'].map((stopType) => (
                      <label key={stopType} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="stops"
                          value={stopType}
                          checked={searchCriteria.maxStops === stopType}
                          onChange={(e) => setSearchCriteria(prev => ({ ...prev, maxStops: e.target.value }))}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm capitalize">
                          {stopType === 'nonstop' ? 'Non-stop' : stopType === '1' ? '1 Stop' : stopType === '2+' ? '2+ Stops' : 'Any'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Passengers */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-3 text-gray-700">Passengers</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={searchCriteria.passengers}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, passengers: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Departure Time Preference */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-3 text-gray-700">Departure Time</label>
                  <div className="space-y-2">
                    {['any', 'morning', 'afternoon', 'evening'].map((timeType) => (
                      <label key={timeType} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="preferredTime"
                          value={timeType}
                          checked={searchCriteria.preferredTime === timeType}
                          onChange={(e) => setSearchCriteria(prev => ({ ...prev, preferredTime: e.target.value }))}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm capitalize">{timeType}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Apply Filters Button */}
                <button
                  onClick={() => {
                    // Regenerate flights with new filters
                    const newFlights = generateFlightOptions(searchCriteria);
                    setFlightOptions(newFlights);
                    addBotMessage(`Updated results based on your filters!`, 500);
                  }}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
          
          {/* MAIN CONTENT AREA */}
          <div className="flex-1">
        {/* Chat Interface */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Your AI Travel Agent</h2>
                <p className="text-sm text-white/80">I'll help you find and book the perfect flight</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={chatContainerRef}
            className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gray-50"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    msg.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white shadow-sm border'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span className="text-xs opacity-60 mt-1 block">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white shadow-sm border rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t">
            {/* Quick Reply Buttons */}
            {quickReplies.length > 0 && !showSummary && (
              <div className="mb-3 flex flex-wrap gap-2">
                {quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleUserResponse(reply)}
                    disabled={isTyping}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUserResponse(userInput)}
                placeholder="Type your response..."
                className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isTyping || showSummary}
              />
              <button
                onClick={() => handleUserResponse(userInput)}
                disabled={isTyping || !userInput.trim() || showSummary}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Flight Results */}
        {flightOptions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              Your Personalized Flight Options
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {flightOptions.map((flight) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  onSelect={() => selectFlightForBooking(flight)}
                  isSelected={selectedFlight?.id === flight.id}
                  expandedTimeline={expandedTimeline}
                  setExpandedTimeline={setExpandedTimeline}
                  expandedJetLag={expandedJetLag}
                  setExpandedJetLag={setExpandedJetLag}
                />
              ))}
            </div>
          </div>
        )}

        {/* Booking Summary */}
        {showSummary && selectedFlight && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Booking Summary</h2>
                <p className="text-gray-600">Review and complete your booking</p>
              </div>
            </div>

            {/* Flight Details Summary */}
            <div className="bg-blue-50 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Plane className="w-5 h-5 text-blue-600" />
                Selected Flight
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Airline & Flight</p>
                  <p className="font-bold">{selectedFlight.airline} {selectedFlight.flightNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="font-bold text-2xl text-green-600">${selectedFlight.price}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Departure</p>
                  <p className="font-bold">{selectedFlight.departure.time} - {selectedFlight.departure.airport}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Arrival</p>
                  <p className="font-bold">{selectedFlight.arrival.time} - {selectedFlight.arrival.airport}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-bold">{selectedFlight.duration}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Class</p>
                  <p className="font-bold capitalize">{searchCriteria.class}</p>
                </div>
              </div>
            </div>

            {/* Passenger Details */}
            <div className="space-y-4 mb-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Passenger Information
              </h3>
              
              {passengerDetails.map((passenger, idx) => (
                <div key={idx} className="bg-purple-50 rounded-xl p-4">
                  <p className="font-bold mb-3">Passenger {idx + 1}</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium">{passenger.firstName} {passenger.lastName}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(`${passenger.firstName} ${passenger.lastName}`, `name-${idx}`)}
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedField === `name-${idx}` ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Date of Birth</p>
                        <p className="font-medium">{passenger.dateOfBirth}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(passenger.dateOfBirth, `dob-${idx}`)}
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                      >
                        {copiedField === `dob-${idx}` ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{passenger.email}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(passenger.email, `email-${idx}`)}
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                      >
                        {copiedField === `email-${idx}` ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{passenger.phone}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(passenger.phone, `phone-${idx}`)}
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                      >
                        {copiedField === `phone-${idx}` ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons - Multiple Booking Options */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-blue-600" />
                Complete Your Booking
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose your preferred booking site. Your flight details will be pre-filled!
              </p>
              
              <div className="grid md:grid-cols-2 gap-3">
                {getMultipleBookingOptions().map((site, idx) => (
                  <button
                    key={idx}
                    onClick={() => window.open(site.url, '_blank')}
                    className={`relative p-4 rounded-xl font-bold transition-all flex items-center justify-between gap-2 ${
                      site.recommended
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-5 h-5" />
                      <span>Book on {site.name}</span>
                    </div>
                    {site.recommended && (
                      <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        Recommended
                      </span>
                    )}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <strong>Pro Tip:</strong> Compare prices across all sites - sometimes you can save an extra $20-50!
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mt-4 text-center">
              💡 All your passenger information is organized above. Simply copy-paste into the booking form!
            </p>
          </div>
        )}
        </div>
        {/* End of main content area */}
        </div>
        {/* End of flex container */}
      </div>

      {/* Sign In Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowSignInModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
              <p className="text-gray-600">Sign in to save your searches and bookings</p>
            </div>

            {/* OAuth Providers */}
            <div className="space-y-3">
              {/* Google */}
              <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all group">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-medium text-gray-700 group-hover:text-blue-600">Continue with Google</span>
              </button>

              {/* Facebook */}
              <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all group">
                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="font-medium text-gray-700 group-hover:text-blue-600">Continue with Facebook</span>
              </button>

              {/* Apple */}
              <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all group">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <span className="font-medium text-gray-700 group-hover:text-blue-600">Continue with Apple</span>
              </button>

              {/* Microsoft */}
              <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all group">
                <svg className="w-5 h-5" viewBox="0 0 23 23">
                  <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                  <path fill="#f35325" d="M1 1h10v10H1z"/>
                  <path fill="#81bc06" d="M12 1h10v10H12z"/>
                  <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                  <path fill="#ffba08" d="M12 12h10v10H12z"/>
                </svg>
                <span className="font-medium text-gray-700 group-hover:text-blue-600">Continue with Microsoft</span>
              </button>

              {/* Instagram */}
              <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all group">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <defs>
                    <radialGradient id="instagram-gradient" cx="30%" cy="107%">
                      <stop offset="0%" stopColor="#fdf497"/>
                      <stop offset="5%" stopColor="#fdf497"/>
                      <stop offset="45%" stopColor="#fd5949"/>
                      <stop offset="60%" stopColor="#d6249f"/>
                      <stop offset="90%" stopColor="#285AEB"/>
                    </radialGradient>
                  </defs>
                  <path fill="url(#instagram-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span className="font-medium text-gray-700 group-hover:text-blue-600">Continue with Instagram</span>
              </button>

              {/* TikTok */}
              <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all group">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#25F4EE" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  <path fill="#FE2C55" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" opacity=".9"/>
                  <path fill="#000000" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" opacity=".15"/>
                </svg>
                <span className="font-medium text-gray-700 group-hover:text-blue-600">Continue with TikTok</span>
              </button>

              {/* X (Twitter) */}
              <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all group">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="font-medium text-gray-700 group-hover:text-blue-600">Continue with X</span>
              </button>

              {/* Yahoo */}
              <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all group">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#5F01D1" d="M12.007 0C5.385 0 .007 5.378.007 12s5.378 12 11.999 12c6.622 0 12-5.378 12-12S18.629 0 12.007 0zm4.447 6.25l-3.662 6.702v3.817h-1.584v-3.817L7.545 6.25h1.756l2.706 5.091L14.714 6.25h1.74z"/>
                </svg>
                <span className="font-medium text-gray-700 group-hover:text-blue-600">Continue with Yahoo</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Email Sign In */}
            <button className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium">
              <Mail className="w-5 h-5" />
              Continue with Email
            </button>

            {/* Terms */}
            <p className="text-xs text-center text-gray-500 mt-6">
              By continuing, you agree to our{' '}
              <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Flight Card Component
function FlightCard({ flight, onSelect, isSelected, expandedTimeline, setExpandedTimeline, expandedJetLag, setExpandedJetLag }) {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 ${
      isSelected ? 'border-green-500 ring-2 ring-green-200' : 'border-transparent'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-2xl font-bold">{flight.type}</p>
          <p className="text-gray-600">{flight.airline}</p>
        </div>
        {isSelected && (
          <CheckCircle className="w-8 h-8 text-green-500" />
        )}
      </div>

      {/* Route */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <span className="font-medium">{flight.departure.airport}</span>
          <ArrowRight className="w-4 h-4" />
          <span className="font-medium">{flight.arrival.airport}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">{flight.departure.time}</span>
          <div className="flex-1 mx-3 border-t-2 border-dashed"></div>
          <span className="text-lg font-bold">{flight.arrival.time}</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">{flight.duration} • {flight.stops} stop</p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="text-sm">Comfort: {flight.comfort}/10</span>
        </div>
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-green-500" />
          <span className="text-sm">{flight.carbonFootprint}t CO₂</span>
        </div>
        {flight.hasWifi && (
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-blue-500" />
            <span className="text-sm">WiFi Available</span>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="mb-4 p-3 bg-green-50 rounded-lg">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-green-600">${flight.price}</span>
          {flight.discount > 0 && (
            <>
              <span className="text-lg text-gray-400 line-through">${flight.originalPrice}</span>
              <span className="text-sm text-green-600 font-medium">Save {flight.discount}%</span>
            </>
          )}
        </div>
      </div>

      {/* Price Prediction */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-sm">Price Prediction</span>
        </div>
        <p className="text-sm text-gray-700">{flight.pricePrediction.recommendation}</p>
        <p className="text-xs text-gray-600">{flight.pricePrediction.confidence}% confidence</p>
      </div>

      {/* Journey Timeline - Expandable */}
      <div className="mb-4">
        <button
          onClick={() => setExpandedTimeline(expandedTimeline === flight.id ? null : flight.id)}
          className="w-full flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="font-medium text-sm">View Journey Timeline</span>
          </div>
          {expandedTimeline === flight.id ? (
            <ChevronUp className="w-4 h-4 text-purple-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-purple-600" />
          )}
        </button>
        
        {expandedTimeline === flight.id && (
          <div className="mt-2 p-4 bg-gray-50 rounded-lg space-y-3">
            <h4 className="font-bold text-sm mb-3">Hour-by-Hour Journey</h4>
            
            <div className="space-y-2">
              <div className="flex gap-3">
                <div className="w-16 text-xs text-gray-600">{flight.departure.time}</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">✈️ Takeoff from {flight.departure.airport}</div>
                  <div className="text-xs text-gray-600">Boarding complete, prepare for departure</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-16 text-xs text-gray-600">+2h</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">🍽️ Meal Service</div>
                  <div className="text-xs text-gray-600">Enjoy your in-flight meal</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-16 text-xs text-gray-600">+6h</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">😴 Rest Period</div>
                  <div className="text-xs text-gray-600">Dim lights, good time to sleep</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-16 text-xs text-gray-600">+10h</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">☀️ Scenic View</div>
                  <div className="text-xs text-gray-600">Great views over the Atlantic</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-16 text-xs text-gray-600">{flight.arrival.time}</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">🛬 Landing at {flight.arrival.airport}</div>
                  <div className="text-xs text-gray-600">Prepare for arrival</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Jet Lag Optimizer - Expandable */}
      <div className="mb-4">
        <button
          onClick={() => setExpandedJetLag(expandedJetLag === flight.id ? null : flight.id)}
          className="w-full flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="font-medium text-sm">Jet Lag Optimizer</span>
          </div>
          {expandedJetLag === flight.id ? (
            <ChevronUp className="w-4 h-4 text-orange-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-orange-600" />
          )}
        </button>
        
        {expandedJetLag === flight.id && (
          <div className="mt-2 p-4 bg-gray-50 rounded-lg space-y-4">
            <div>
              <h4 className="font-bold text-sm mb-2">📅 Pre-Departure (3 days before)</h4>
              <div className="space-y-2 text-xs">
                <div className="flex gap-2">
                  <span className="font-medium">Day -3:</span>
                  <span className="text-gray-600">Sleep 30 min earlier, reduce caffeine after 2 PM</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium">Day -2:</span>
                  <span className="text-gray-600">Sleep 1 hour earlier, morning sunlight exposure</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium">Day -1:</span>
                  <span className="text-gray-600">Sleep 1.5 hours earlier, stay hydrated</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-sm mb-2">✈️ In-Flight Tips</h4>
              <div className="space-y-1 text-xs text-gray-600">
                <div>• Set watch to destination time immediately</div>
                <div>• Sleep during destination night hours</div>
                <div>• Stay hydrated (avoid alcohol)</div>
                <div>• Move around every 2 hours</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-sm mb-2">🌅 Post-Arrival</h4>
              <div className="space-y-2 text-xs">
                <div className="flex gap-2">
                  <span className="font-medium">Day 1:</span>
                  <span className="text-gray-600">Stay awake until 9 PM local, morning sunlight</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium">Day 2:</span>
                  <span className="text-gray-600">Normal sleep schedule, light exercise</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium">Day 3:</span>
                  <span className="text-gray-600">Fully adjusted! Enjoy your trip!</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Select Button */}
      <div className="space-y-2">
        <button
          onClick={onSelect}
          className={`w-full py-3 rounded-lg font-bold transition-all ${
            isSelected
              ? 'bg-green-500 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isSelected ? 'Selected ✓' : 'Select Flight →'}
        </button>
        
        {/* Direct Book Now Button */}
        <button
          onClick={() => {
            // Generate booking URL for this specific flight
            const criteria = {
              origin: flight.departure.airport,
              destination: flight.arrival.airport,
              departureDate: flight.departure.date,
              passengers: 1,
              class: 'economy',
              tripType: 'roundtrip'
            };
            
            // Skyscanner URL
            const origin = criteria.origin?.toLowerCase().replace(/\s+/g, '-') || 'origin';
            const destination = criteria.destination?.toLowerCase().replace(/\s+/g, '-') || 'destination';
            const url = `https://www.skyscanner.com/transport/flights/${origin}/${destination}`;
            
            window.open(url, '_blank');
          }}
          className="w-full py-3 rounded-lg font-bold transition-all bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Book Now on Skyscanner
        </button>
      </div>
    </div>
  );
}

export default App;
