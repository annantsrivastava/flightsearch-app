import React, { useState } from 'react';
import './PriceAlertBanner.css';

const PriceAlertBanner = ({ betterPrice, currentPrice, betterDate, daysOffset }) => {
  const [showAlternateFlight, setShowAlternateFlight] = useState(false);
  
  const savings = currentPrice - betterPrice;

  // Mock alternate flight data - will be replaced with real Amadeus data
  const alternateFlight = {
    airline: 'Delta',
    logo: '🛫',
    aircraft: 'Boeing 777',
    from: 'JFK',
    to: 'LHR',
    departure: '6:45 PM',
    arrival: '11:30 AM +1',
    duration: '7h 45m',
    stops: 'Nonstop',
    price: betterPrice,
    emission: '1,850kg',
    prediction: 'stable',
    jetLag: 'Moderate',
    date: betterDate
  };

  const handleSeeFlightClick = () => {
    setShowAlternateFlight(!showAlternateFlight);
  };

  return (
    <>
      <div className="price-alert-banner">
        <span className="alert-icon">💡</span>
        <span className="alert-text">
          Just {Math.abs(daysOffset)} days {daysOffset > 0 ? 'after' : 'before'} your desired departure date 
          the price is showing lowest at <strong>${betterPrice}</strong> on {betterDate}. 
          <button className="see-flight-link" onClick={handleSeeFlightClick}>
            {showAlternateFlight ? 'Hide the Flight' : 'See the Flight'}
          </button>
        </span>
      </div>

      {/* Inline Alternate Flight Card */}
      {showAlternateFlight && (
        <div className="alternate-flight-container">
          <div className="alternate-flight-header">
            <span className="savings-badge">💰 Save ${savings} by flying on {betterDate}</span>
            <button className="close-alternate-btn" onClick={() => setShowAlternateFlight(false)}>
              ✕
            </button>
          </div>

          <div className="alternate-flight-card">
            <div className="flight-card-header">
              <div className="airline-info">
                <span className="airline-logo">{alternateFlight.logo}</span>
                <div>
                  <div className="airline-name">{alternateFlight.airline}</div>
                  <div className="aircraft-type">{alternateFlight.aircraft}</div>
                </div>
              </div>
              <div className="flight-price">
                <div className="price-amount">${alternateFlight.price}</div>
                <div className="price-label">Total</div>
              </div>
            </div>

            <div className="flight-card-body">
              <div className="flight-times">
                <div className="time-block">
                  <div className="time">{alternateFlight.departure}</div>
                  <div className="airport">{alternateFlight.from}</div>
                </div>

                <div className="flight-duration">
                  <div className="duration-line">
                    <span className="duration-text">{alternateFlight.duration}</span>
                  </div>
                  <div className="stops-info">{alternateFlight.stops}</div>
                </div>

                <div className="time-block">
                  <div className="time">{alternateFlight.arrival}</div>
                  <div className="airport">{alternateFlight.to}</div>
                </div>
              </div>

              <div className="flight-details-row">
                <div className="detail-item">
                  <span className="detail-icon">✈️</span>
                  <span className="detail-text">{alternateFlight.aircraft}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">🌍</span>
                  <span className="detail-text">{alternateFlight.emission} CO₂</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">😴</span>
                  <span className="detail-text">Jet Lag: {alternateFlight.jetLag}</span>
                </div>
              </div>
            </div>

            <div className="flight-card-footer">
              <button className="book-alternate-btn">
                Book This Flight for ${alternateFlight.price}
              </button>
              <button className="keep-search-btn" onClick={() => setShowAlternateFlight(false)}>
                Keep My Original Search
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PriceAlertBanner;
