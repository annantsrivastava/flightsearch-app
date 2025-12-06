// Amadeus Flight Search API
// This function searches for flights using Amadeus Flight Offers Search API

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { origin, destination, departureDate, returnDate, adults, travelClass, nonStop } = req.body;

  // Validate required parameters
  if (!origin || !destination || !departureDate || !adults) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const API_KEY = process.env.VITE_AMADEUS_API_KEY;
  const API_SECRET = process.env.VITE_AMADEUS_API_SECRET;

  if (!API_KEY || !API_SECRET) {
    return res.status(500).json({ error: 'Amadeus credentials not configured' });
  }

  try {
    // Step 1: Get access token
    const authResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: API_KEY,
        client_secret: API_SECRET,
      }),
    });

    if (!authResponse.ok) {
      console.error('Amadeus auth failed');
      return res.status(500).json({ error: 'Authentication failed' });
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Step 2: Build flight search parameters
    const searchParams = new URLSearchParams({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departureDate,
      adults: adults.toString(),
      max: '10', // Limit to 10 results for better performance
      currencyCode: 'USD',
    });

    // Add optional parameters
    if (returnDate) {
      searchParams.append('returnDate', returnDate);
    }

    if (travelClass) {
      searchParams.append('travelClass', travelClass.toUpperCase());
    }

    if (nonStop) {
      searchParams.append('nonStop', 'true');
    }

    // Step 3: Search for flights
    const searchResponse = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?${searchParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error('Amadeus search error:', errorData);
      return res.status(searchResponse.status).json({ 
        error: 'Flight search failed',
        details: errorData 
      });
    }

    const searchData = await searchResponse.json();

    // Step 4: Transform Amadeus data to our format
    const transformedFlights = transformAmadeusData(searchData);

    return res.status(200).json({
      success: true,
      flights: transformedFlights,
      meta: {
        count: transformedFlights.length,
        currency: 'USD',
      },
    });

  } catch (error) {
    console.error('Error searching flights:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

// Transform Amadeus API response to our app's format
function transformAmadeusData(amadeusResponse) {
  if (!amadeusResponse.data || amadeusResponse.data.length === 0) {
    return [];
  }

  const flights = amadeusResponse.data.map((offer, index) => {
    const itinerary = offer.itineraries[0]; // Outbound flight
    const firstSegment = itinerary.segments[0];
    const lastSegment = itinerary.segments[itinerary.segments.length - 1];
    
    // Calculate total duration in minutes
    const duration = parseDuration(itinerary.duration);
    
    // Determine number of stops
    const stops = itinerary.segments.length - 1;
    const stopsLabel = stops === 0 ? 'Nonstop' : stops === 1 ? '1 stop' : `${stops} stops`;

    // Get airline name (from dictionaries)
    const carrierCode = firstSegment.carrierCode;
    const airlineName = getAirlineName(carrierCode, amadeusResponse.dictionaries);

    // Get aircraft type
    const aircraftCode = firstSegment.aircraft?.code || 'Unknown';
    const aircraftName = getAircraftName(aircraftCode);

    // Format times
    const departureTime = formatTime(firstSegment.departure.at);
    const arrivalTime = formatTime(lastSegment.arrival.at);

    // Calculate if arrival is next day
    const departureDate = new Date(firstSegment.departure.at);
    const arrivalDate = new Date(lastSegment.arrival.at);
    const dayDiff = Math.floor((arrivalDate - departureDate) / (1000 * 60 * 60 * 24));
    const arrivalDisplay = dayDiff > 0 ? `${arrivalTime} +${dayDiff}` : arrivalTime;

    return {
      id: index + 1,
      amadeusId: offer.id, // Keep Amadeus ID for booking later
      airline: airlineName,
      logo: getAirlineLogo(carrierCode),
      aircraft: aircraftName,
      from: firstSegment.departure.iataCode,
      to: lastSegment.arrival.iataCode,
      departure: departureTime,
      arrival: arrivalDisplay,
      duration: formatDuration(duration),
      stops: stopsLabel,
      price: parseFloat(offer.price.total),
      currency: offer.price.currency,
      emission: estimateCO2(duration, stops), // Estimated
      prediction: 'stable', // Will enhance with price prediction later
      predictionPercent: 0,
      predictionText: 'Price from live data',
      bookingUrl: '', // Will add affiliate links later
      numberOfBookableSeats: offer.numberOfBookableSeats || 9,
      segments: itinerary.segments, // Keep full segment data
      validatingAirlineCodes: offer.validatingAirlineCodes,
      jetLag: calculateJetLag(firstSegment.departure.iataCode, lastSegment.arrival.iataCode),
    };
  });

  return flights;
}

// Helper functions
function parseDuration(isoDuration) {
  // Parse ISO 8601 duration (e.g., "PT10H30M")
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?/);
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  return hours * 60 + minutes;
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

function getAirlineName(carrierCode, dictionaries) {
  if (dictionaries && dictionaries.carriers && dictionaries.carriers[carrierCode]) {
    return dictionaries.carriers[carrierCode];
  }
  
  // Fallback to common carriers
  const carriers = {
    'AA': 'American Airlines',
    'DL': 'Delta',
    'UA': 'United Airlines',
    'BA': 'British Airways',
    'LH': 'Lufthansa',
    'AF': 'Air France',
    'KL': 'KLM',
    'EK': 'Emirates',
    'QR': 'Qatar Airways',
  };
  
  return carriers[carrierCode] || carrierCode;
}

function getAirlineLogo(carrierCode) {
  // Return emoji for now - can be replaced with actual logos later
  const logos = {
    'AA': '🛫',
    'DL': '✈️',
    'UA': '🛫',
    'BA': '🛩️',
    'LH': '✈️',
    'AF': '🛫',
    'KL': '✈️',
    'EK': '🛩️',
    'QR': '🛫',
  };
  
  return logos[carrierCode] || '✈️';
}

function getAircraftName(aircraftCode) {
  const aircraft = {
    '320': 'Airbus A320',
    '321': 'Airbus A321',
    '319': 'Airbus A319',
    '330': 'Airbus A330',
    '350': 'Airbus A350',
    '380': 'Airbus A380',
    '737': 'Boeing 737',
    '747': 'Boeing 747',
    '757': 'Boeing 757',
    '767': 'Boeing 767',
    '777': 'Boeing 777',
    '787': 'Boeing 787',
  };
  
  return aircraft[aircraftCode] || `Aircraft ${aircraftCode}`;
}

function estimateCO2(durationMinutes, stops) {
  // Rough estimate: ~90kg CO2 per hour of flight
  const hours = durationMinutes / 60;
  const baseCO2 = Math.round(hours * 90);
  
  // Add extra for takeoff/landing per stop
  const stopPenalty = stops * 50;
  
  return `${baseCO2 + stopPenalty}kg`;
}

function calculateJetLag(origin, destination) {
  // Simplified jet lag calculation - can be enhanced
  return {
    severity: 'Moderate',
    timeDifference: 'Variable',
    tips: [
      'Stay hydrated during flight',
      'Adjust sleep schedule gradually',
      'Get sunlight upon arrival',
      'Avoid heavy meals before sleeping',
    ],
  };
}
