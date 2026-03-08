-- Otto Reservation System Schema

-- Restaurants Table
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  resy_venue_id TEXT NOT NULL UNIQUE,
  location TEXT,
  enabled BOOLEAN DEFAULT true,
  release_pattern TEXT NOT NULL CHECK (release_pattern IN ('daily', 'weekly', 'manual')),
  release_day TEXT,
  release_time TIME,
  release_frequency_days INT,
  default_party_size INT DEFAULT 2,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Booking Preferences Table
CREATE TABLE booking_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  party_size INT DEFAULT 2,
  target_dates JSONB DEFAULT '[]'::JSONB,
  target_date_range JSONB,
  preferred_times JSONB,
  priority INT DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Activity Log Table
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  booking_preference_id UUID REFERENCES booking_preferences(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('release_detected', 'polling_started', 'booking_attempted', 'success', 'failed', 'rate_limited', 'conflict_skipped')),
  target_date DATE,
  target_time TIME,
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'skipped')),
  details JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Booked Confirmations Table
CREATE TABLE booked_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  booking_preference_id UUID REFERENCES booking_preferences(id) ON DELETE SET NULL,
  resy_booking_id TEXT,
  booked_date DATE NOT NULL,
  booked_time TIME NOT NULL,
  party_size INT NOT NULL,
  resy_confirmation_url TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'no-show')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  cancelled_at TIMESTAMP
);

-- Resy Credentials Table (encrypted)
CREATE TABLE resy_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT NOT NULL,
  auth_token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_restaurants_enabled ON restaurants(enabled);
CREATE INDEX idx_booking_preferences_restaurant ON booking_preferences(restaurant_id);
CREATE INDEX idx_activity_log_restaurant ON activity_log(restaurant_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX idx_booked_confirmations_restaurant ON booked_confirmations(restaurant_id);
CREATE INDEX idx_booked_confirmations_date ON booked_confirmations(booked_date DESC);
