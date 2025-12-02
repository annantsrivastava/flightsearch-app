import { createClient } from '@supabase/supabase-js'

// Your Supabase credentials
const supabaseUrl = 'https://qqbiynrdarphatlpfipl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYml5bnJkYXJwaGF0bHBmaXBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MzMyNzIsImV4cCI6MjA4MDIwOTI3Mn0.oyGV-dLHEKoqAt177oTxav-ltFR7_UVn_v_oR7uAonI'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for common operations

// Get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Get user's booked trips
export const getUserTrips = async (userId) => {
  const { data, error } = await supabase
    .from('booked_trips')
    .select('*')
    .eq('user_id', userId)
    .order('booking_date', { ascending: false })
  
  return { data, error }
}

// Save a new trip
export const saveTrip = async (userId, tripData) => {
  const { data, error } = await supabase
    .from('booked_trips')
    .insert([{
      user_id: userId,
      ...tripData
    }])
  
  return { data, error }
}

// Get user profile
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  return { data, error }
}

// Create or update user profile
export const upsertUserProfile = async (userId, profileData) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      ...profileData
    })
  
  return { data, error }
}
