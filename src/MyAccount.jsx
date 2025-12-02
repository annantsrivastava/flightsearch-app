import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Calendar, MapPin, Plane, DollarSign, 
  LogOut, Settings, Clock, ArrowRight, CheckCircle,
  X
} from 'lucide-react';
import { supabase, signOut, getUserTrips } from '../supabaseClient';

function MyAccount({ user, onClose, onSignOut }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trips'); // 'trips' or 'profile'

  useEffect(() => {
    if (user) {
      loadUserTrips();
    }
  }, [user]);

  const loadUserTrips = async () => {
    setLoading(true);
    const { data, error } = await getUserTrips(user.id);
    if (!error && data) {
      setTrips(data);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    onSignOut();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 relative animate-in fade-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white rounded-t-2xl">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              {user?.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10" />
              )}
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
              </h2>
              <p className="text-white/80 flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" />
                {user?.email}
              </p>
              <p className="text-xs text-white/60 mt-2">
                Member since {new Date(user?.created_at).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex gap-8 px-8">
            <button
              onClick={() => setActiveTab('trips')}
              className={`py-4 font-medium transition-colors relative ${
                activeTab === 'trips' 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Trips ({trips.length})
              {activeTab === 'trips' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 font-medium transition-colors relative ${
                activeTab === 'profile' 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Profile Settings
              {activeTab === 'profile' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[60vh] overflow-y-auto">
          {activeTab === 'trips' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : trips.length === 0 ? (
                <div className="text-center py-12">
                  <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No trips yet!</h3>
                  <p className="text-gray-600 mb-6">
                    Start searching for flights and book your first trip!
                  </p>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Search Flights
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {trips.map((trip) => (
                    <div 
                      key={trip.id}
                      className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-all border border-gray-200"
                    >
                      {/* Trip Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg flex items-center gap-2">
                            {trip.airline}
                            {trip.flight_number && (
                              <span className="text-sm text-gray-600 font-normal">
                                {trip.flight_number}
                              </span>
                            )}
                          </h3>
                          <div className="flex items-center gap-2 text-gray-600 mt-1">
                            <MapPin className="w-4 h-4" />
                            <span className="font-medium">{trip.origin}</span>
                            <ArrowRight className="w-4 h-4" />
                            <span className="font-medium">{trip.destination}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          trip.status === 'confirmed' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {trip.status === 'confirmed' ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Confirmed
                            </span>
                          ) : trip.status}
                        </span>
                      </div>

                      {/* Trip Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Departure</p>
                          <p className="font-medium">{trip.departure_date}</p>
                        </div>
                        {trip.return_date && (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Return</p>
                            <p className="font-medium">{trip.return_date}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Passengers</p>
                          <p className="font-medium">{trip.passengers} traveler{trip.passengers > 1 ? 's' : ''}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Class</p>
                          <p className="font-medium capitalize">{trip.class}</p>
                        </div>
                      </div>

                      {/* Price and Booking Date */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold text-green-600">
                            ${trip.price}
                          </div>
                          <div className="text-xs text-gray-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Booked {new Date(trip.booking_date).toLocaleDateString()}
                          </div>
                        </div>
                        <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-4">Profile Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.user_metadata?.full_name || ''}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Save Changes
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="text-lg font-bold mb-4 text-red-600">Danger Zone</h3>
                <button className="px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium">
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyAccount;
