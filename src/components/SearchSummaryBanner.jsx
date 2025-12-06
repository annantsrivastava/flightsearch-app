import React from 'react';
import './SearchSummaryBanner.css';

const SearchSummaryBanner = ({ flightInfo }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    // Simple date formatting - can be enhanced later
    return dateStr;
  };

  const getAirportCode = (city) => {
    // Simple mapping - will be replaced with real data from Amadeus
    const codes = {
      'new york': 'JFK',
      'london': 'LHR',
      'los angeles': 'LAX',
      'chicago': 'ORD',
      'miami': 'MIA',
      'san francisco': 'SFO',
      'paris': 'CDG',
      'tokyo': 'NRT',
      'dubai': 'DXB'
    };
    return codes[city?.toLowerCase()] || city;
  };

  const fromCode = getAirportCode(flightInfo.from);
  const toCode = getAirportCode(flightInfo.to);
  const classLabel = flightInfo.class.charAt(0).toUpperCase() + flightInfo.class.slice(1);

  return (
    <div className="search-summary-banner">
      <span className="summary-text">
        <strong>Your current selection:</strong> {fromCode} to {toCode}
        {flightInfo.departDate && ` Departure: ${formatDate(flightInfo.departDate)}`}
        {flightInfo.returnDate && flightInfo.tripType === 'roundtrip' && ` Return: ${formatDate(flightInfo.returnDate)}`}
        {` ${classLabel} Class`}
        {` ${flightInfo.passengers} Passenger${flightInfo.passengers > 1 ? 's' : ''}`}.
      </span>
    </div>
  );
};

export default SearchSummaryBanner;
