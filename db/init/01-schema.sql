-- Create database schema for Hostel Outpass Management System

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  roll_no VARCHAR(20) NOT NULL UNIQUE,
  room_no VARCHAR(10) NOT NULL,
  hostel VARCHAR(50) NOT NULL,
  contact VARCHAR(20) NOT NULL,
  parent_contact VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id VARCHAR(10) PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  hostel VARCHAR(50),
  role ENUM('hostel_admin', 'security', 'super_admin') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Outpass requests table
CREATE TABLE IF NOT EXISTS outpass_requests (
  id VARCHAR(10) PRIMARY KEY,
  student_id VARCHAR(10) NOT NULL,
  type ENUM('Market', 'Home') NOT NULL,
  purpose VARCHAR(200) NOT NULL,
  place VARCHAR(200) NOT NULL,
  expected_date DATE NOT NULL,
  expected_return_time TIME NOT NULL,
  status ENUM('Pending', 'Approved', 'Rejected', 'Exited', 'Returned', 'Late') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_by VARCHAR(10),
  approved_at TIMESTAMP NULL,
  reject_reason TEXT,
  actual_exit_time TIMESTAMP NULL,
  actual_return_time TIMESTAMP NULL,
  barcode_token VARCHAR(100),
  pdf_url VARCHAR(255),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (approved_by) REFERENCES admins(id)
);

-- Gate logs table
CREATE TABLE IF NOT EXISTS gate_logs (
  id VARCHAR(10) PRIMARY KEY,
  outpass_id VARCHAR(10) NOT NULL,
  student_id VARCHAR(10) NOT NULL,
  action ENUM('exit', 'return') NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (outpass_id) REFERENCES outpass_requests(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Notifications log table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(10) PRIMARY KEY,
  type ENUM('parent', 'admin') NOT NULL,
  recipient_id VARCHAR(10) NOT NULL,
  outpass_id VARCHAR(10) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('sent', 'failed') NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (outpass_id) REFERENCES outpass_requests(id)
);

-- Indexes for better performance
CREATE INDEX idx_students_hostel ON students(hostel);
CREATE INDEX idx_outpass_student ON outpass_requests(student_id);
CREATE INDEX idx_outpass_status ON outpass_requests(status);
CREATE INDEX idx_outpass_date ON outpass_requests(expected_date);
CREATE INDEX idx_gate_logs_outpass ON gate_logs(outpass_id);
CREATE INDEX idx_gate_logs_student ON gate_logs(student_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
