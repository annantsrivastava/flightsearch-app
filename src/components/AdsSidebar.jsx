import React from 'react';
import './AdsSidebar.css';

function AdsSidebar() {
  return (
    <div className="ads-sidebar">
      {/* Banner Ad 1 - Hotel Booking */}
      <div className="ad-unit">
        <div className="ad-label">Sponsored</div>
        <div className="ad-banner ad-banner-hotel">
          <h4>🏨 Book Hotels</h4>
          <p>Save up to 40% on hotels worldwide. Free cancellation available!</p>
          <button className="ad-btn">Find Hotels →</button>
        </div>
      </div>

      {/* Display Ad 2 - Travel Insurance */}
      <div className="ad-unit">
        <div className="ad-label">Advertisement</div>
        <div className="ad-image-placeholder">🛡️</div>
        <div className="ad-title">Travel Insurance</div>
        <div className="ad-description">
          Protect your trip with comprehensive travel insurance. Cancel for any reason coverage available.
        </div>
        <button className="ad-cta">Get Quote</button>
      </div>

      {/* Banner Ad 3 - Car Rental */}
      <div className="ad-unit">
        <div className="ad-label">Sponsored</div>
        <div className="ad-banner ad-banner-car">
          <h4>🚗 Rent a Car</h4>
          <p>Compare prices from top rental companies. Best price guarantee!</p>
          <button className="ad-btn">Search Cars →</button>
        </div>
      </div>

      {/* Display Ad 4 - Credit Card */}
      <div className="ad-unit">
        <div className="ad-label">Advertisement</div>
        <div className="ad-image-placeholder">💳</div>
        <div className="ad-title">Travel Credit Card</div>
        <div className="ad-description">
          Earn 3X points on travel purchases. $0 annual fee first year. Apply today and get bonus miles!
        </div>
        <button className="ad-cta">Learn More</button>
      </div>

      {/* Banner Ad 5 - Tours & Activities */}
      <div className="ad-unit">
        <div className="ad-label">Sponsored</div>
        <div className="ad-banner ad-banner-insurance">
          <h4>🎫 Tours & Activities</h4>
          <p>Book unique experiences at your destination. Skip-the-line tickets!</p>
          <button className="ad-btn">Explore →</button>
        </div>
      </div>

      {/* Google AdSense Placeholder */}
      <div className="ad-unit">
        <div className="ad-label">Google AdSense</div>
        <div className="adsense-placeholder">
          <div className="adsense-placeholder-icon">📢</div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>300x250</div>
          <div style={{ fontSize: '12px', marginTop: '5px' }}>Google Ad Unit</div>
          <div style={{ fontSize: '11px', marginTop: '8px', color: '#9ca3af' }}>
            Replace with your AdSense code
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdsSidebar;
