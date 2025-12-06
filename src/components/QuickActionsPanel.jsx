import React, { useState } from 'react';
import './QuickActionsPanel.css';

const QuickActionsPanel = ({ flightInfo, flights, onModify }) => {
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);
  const [showStopsDropdown, setShowStopsDropdown] = useState(false);

  // Find cheapest, fastest, and best value flights
  const getCheapestFlight = () => {
    if (flights.length === 0) return null;
    return flights.reduce((min, flight) => flight.price < min.price ? flight : min);
  };

  const getFastestFlight = () => {
    if (flights.length === 0) return null;
    return flights.reduce((fastest, flight) => {
      const getDuration = (dur) => {
        const [hours, mins] = dur.replace('h', '').replace('m', '').split(' ');
        return parseInt(hours) * 60 + parseInt(mins);
      };
      return getDuration(flight.duration) < getDuration(fastest.duration) ? flight : fastest;
    });
  };

  const getBestValueFlight = () => {
    if (flights.length === 0) return null;
    // Best value = good price + good duration
    return flights.reduce((best, flight) => {
      const getDuration = (dur) => {
        const [hours, mins] = dur.replace('h', '').replace('m', '').split(' ');
        return parseInt(hours) * 60 + parseInt(mins);
      };
      const bestScore = best.price + (getDuration(best.duration) / 60 * 50);
      const flightScore = flight.price + (getDuration(flight.duration) / 60 * 50);
      return flightScore < bestScore ? flight : best;
    });
  };

  const cheapest = getCheapestFlight();
  const fastest = getFastestFlight();
  const bestValue = getBestValueFlight();

  const handlePassengerChange = (value) => {
    onModify({ ...flightInfo, passengers: value });
    setShowPassengerDropdown(false);
  };

  const handleTripTypeToggle = () => {
    const newTripType = flightInfo.tripType === 'oneway' ? 'roundtrip' : 'oneway';
    onModify({ ...flightInfo, tripType: newTripType });
  };

  const handleStopsChange = (value) => {
    onModify({ ...flightInfo, stops: value });
    setShowStopsDropdown(false);
  };

  const getStopsLabel = () => {
    if (!flightInfo.stops || flightInfo.stops === 'any') return 'Any';
    if (flightInfo.stops === 'nonstop') return '0';
    if (flightInfo.stops === '1stop') return '1';
    return 'Any';
  };

  return (
    <div className="quick-actions-panel">
      {/* Left Side - Quick Action Chips */}
      <div className="quick-action-chips">
        <div className="action-chip">
          <span className="chip-label">Cheapest</span>
          <span className="chip-price">${cheapest?.price || '---'} At Booking.com</span>
          <button className="chip-book-btn">Book Now →</button>
        </div>
        
        <div className="action-chip">
          <span className="chip-label">Fastest</span>
          <span className="chip-price">${fastest?.price || '---'} At Booking.com</span>
          <button className="chip-book-btn">Book Now →</button>
        </div>
        
        <div className="action-chip">
          <span className="chip-label">Best Value</span>
          <span className="chip-price">${bestValue?.price || '---'} At Booking.com</span>
          <button className="chip-book-btn">Book Now →</button>
        </div>
      </div>

      {/* Right Side - Modify Controls */}
      <div className="modify-controls">
        <div className="modify-title">Modify</div>
        
        {/* Passengers */}
        <div className="modify-item">
          <span className="modify-label">No. Of Passengers</span>
          <div className="modify-value-wrapper">
            <button 
              className="modify-value-btn"
              onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
            >
              {flightInfo.passengers}
              <span className="modify-icon">▼</span>
            </button>
            {showPassengerDropdown && (
              <div className="modify-dropdown">
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <div 
                    key={num}
                    className="dropdown-item"
                    onClick={() => handlePassengerChange(num)}
                  >
                    {num} {num === 1 ? 'Passenger' : 'Passengers'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trip Type Toggle */}
        <div className="modify-item">
          <div className="trip-type-toggle">
            <button 
              className={`toggle-btn ${flightInfo.tripType === 'oneway' ? 'active' : ''}`}
              onClick={handleTripTypeToggle}
            >
              One-Way
            </button>
            <button 
              className={`toggle-btn ${flightInfo.tripType === 'roundtrip' ? 'active' : ''}`}
              onClick={handleTripTypeToggle}
            >
              Roundtrip
            </button>
          </div>
        </div>

        {/* Stops */}
        <div className="modify-item">
          <span className="modify-label">Stops</span>
          <div className="modify-value-wrapper">
            <button 
              className="modify-value-btn"
              onClick={() => setShowStopsDropdown(!showStopsDropdown)}
            >
              {getStopsLabel()}
              <span className="modify-icon">▼</span>
            </button>
            {showStopsDropdown && (
              <div className="modify-dropdown">
                <div 
                  className="dropdown-item"
                  onClick={() => handleStopsChange('any')}
                >
                  Any Number of Stops
                </div>
                <div 
                  className="dropdown-item"
                  onClick={() => handleStopsChange('nonstop')}
                >
                  Nonstop Only
                </div>
                <div 
                  className="dropdown-item"
                  onClick={() => handleStopsChange('1stop')}
                >
                  1 Stop Maximum
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsPanel;
