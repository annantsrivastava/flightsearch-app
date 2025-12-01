# ✈️ FlightFinder - AI-Powered Flight Search

An intelligent flight search chatbot that helps users find the best flight options using natural language queries.

## 🌟 Features

- **AI-Powered Search**: Natural language flight search using Claude AI
- **Smart Filters**: Modern sidebar with click-to-select filters
  - Class selection (Economy, Premium, Business, First)
  - Trip type (One-way, Round-trip)
  - Stops preference
  - Baggage options
  - Departure time slots
- **Social Authentication**: Login with Google, Facebook, Yahoo, Instagram, TikTok
- **User Account Management**: 
  - Search history tracking
  - Profile management
  - Saved preferences
- **Affiliate Booking Model**: Kayak-style meta-search with affiliate links
- **Beautiful UI**: Modern, responsive design with Tailwind CSS
- **Conversation Memory**: Context-aware follow-up questions

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation

```bash
# Clone or download the project
cd flightsearch-app

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see your app!

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

## 📦 Project Structure

```
flightsearch-app/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind CSS config
└── DEPLOYMENT.md        # Deployment guide
```

## 🎨 Technology Stack

- **Frontend**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI**: Claude Sonnet 4 API
- **Deployment**: Vercel/Netlify/Railway (see DEPLOYMENT.md)

## 🔑 Environment Variables

For Amadeus API integration (Phase 2):

```env
VITE_AMADEUS_API_KEY=your_api_key
VITE_AMADEUS_API_SECRET=your_api_secret
```

## 📱 Features in Detail

### 1. Natural Language Search
Users can type queries like:
- "I need a flight from Houston to New Delhi on December 15th"
- "Show me cheap flights to Paris next month"
- "Business class tickets to Tokyo for 2 adults"

### 2. Modern Filter System
- Click-to-select text-based filters
- Multi-select support
- Expandable filter categories
- Apply filters to refine results

### 3. Social Authentication
- Google, Facebook, Yahoo, Instagram, TikTok login
- Guest mode available
- Profile management
- Search history for logged-in users

### 4. Affiliate Integration
- "Select This Flight" buttons link to booking partners
- Earn 3-5% commission per booking
- No IATA license required
- No payment processing needed

## 🗺️ Roadmap

### Phase 1 (Current) - Meta-Search ✅
- [x] Beautiful UI
- [x] AI chatbot
- [x] Filter system
- [x] Social login
- [x] Affiliate links

### Phase 2 (Next) - Real Flight Data
- [ ] Amadeus API integration
- [ ] Real-time flight prices
- [ ] Availability checking
- [ ] Multiple booking partner affiliates

### Phase 3 (Future) - Direct Booking
- [ ] Payment processing
- [ ] Ticket issuance
- [ ] Customer support system
- [ ] Email notifications

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy with Vercel:**
```bash
npm install -g vercel
vercel
```

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

## 📄 License

MIT License - feel free to use this project as inspiration for your own flight search app!

## 🆘 Support

For issues or questions:
1. Check the DEPLOYMENT.md guide
2. Review build logs
3. Test locally with `npm run dev`

## 🎯 Business Model

FlightFinder operates as a meta-search engine (like Kayak):
- Search flights from multiple sources
- Display aggregated results
- Send users to booking partners via affiliate links
- Earn commission/CPC fees
- No IATA license required
- No direct booking responsibility

---

Built with ❤️ using React, Vite, and Claude AI
