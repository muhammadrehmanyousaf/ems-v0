-- Database Schema for Payment Intent Management
-- Run these SQL commands to create the required tables

-- 1. Create payment_intents table
CREATE TABLE IF NOT EXISTS payment_intents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  stripe_payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
  payment_type ENUM('down_payment', 'remaining_payment', 'full_payment') NOT NULL,
  amount INT NOT NULL, -- Amount in cents
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_booking_id (booking_id),
  INDEX idx_stripe_payment_intent_id (stripe_payment_intent_id),
  INDEX idx_status (status),
  INDEX idx_payment_type (payment_type),
  INDEX idx_created_at (created_at)
);

-- 2. Create payments table (if not exists)
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  payment_intent_id VARCHAR(255) NOT NULL,
  amount INT NOT NULL, -- Amount in cents
  currency VARCHAR(3) DEFAULT 'usd',
  payment_type ENUM('down_payment', 'remaining_payment', 'full_payment') NOT NULL,
  status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL,
  stripe_payment_intent_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_booking_id (booking_id),
  INDEX idx_payment_intent_id (payment_intent_id),
  INDEX idx_stripe_payment_intent_id (stripe_payment_intent_id),
  INDEX idx_status (status),
  INDEX idx_payment_type (payment_type)
);

-- 3. Create bookings table (if not exists)
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(255),
  vendor_id INT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
  payment_method VARCHAR(50),
  down_payment DECIMAL(5,2) DEFAULT 20.00, -- Percentage
  additional_requests TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_customer_email (customer_email),
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_booking_date (booking_date),
  INDEX idx_status (status),
  INDEX idx_payment_status (payment_status)
);

-- 4. Add foreign key constraints (optional, uncomment if needed)
-- ALTER TABLE payment_intents ADD CONSTRAINT fk_payment_intents_booking_id FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
-- ALTER TABLE payments ADD CONSTRAINT fk_payments_booking_id FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_intents_booking_status ON payment_intents(booking_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_intents_booking_type ON payment_intents(booking_id, payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_booking_status ON payments(booking_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_booking_type ON payments(booking_id, payment_type);

-- 6. Sample data insertion (for testing)
-- INSERT INTO bookings (customer_name, customer_email, customer_phone, vendor_id, booking_date, booking_time, total_amount) 
-- VALUES ('John Doe', 'john@example.com', '+1234567890', 1, '2024-01-15', '14:00:00', 1000.00);

-- 7. Cleanup query to remove duplicate payment intents (run this to clean existing duplicates)
-- DELETE pi1 FROM payment_intents pi1
-- INNER JOIN payment_intents pi2 
-- WHERE pi1.id > pi2.id 
-- AND pi1.booking_id = pi2.booking_id 
-- AND pi1.payment_type = pi2.payment_type 
-- AND pi1.status IN ('requires_payment_method', 'requires_confirmation', 'requires_action')
-- AND pi2.status IN ('requires_payment_method', 'requires_confirmation', 'requires_action');
