-- Insert sample data for testing

-- Sample students
INSERT INTO students (id, name, roll_no, room_no, hostel, contact, parent_contact) VALUES
('ST-001', 'John Doe', 'CS12345', 'A-101', 'A Block', '+91 9876543210', '+91 9876543211'),
('ST-002', 'Alice Johnson', 'CS12346', 'A-102', 'A Block', '+91 9876543212', '+91 9876543213'),
('ST-003', 'Bob Smith', 'CS12347', 'A-103', 'A Block', '+91 9876543214', '+91 9876543215'),
('ST-004', 'Charlie Davis', 'CS12348', 'B-101', 'B Block', '+91 9876543216', '+91 9876543217'),
('ST-005', 'Diana Evans', 'CS12349', 'B-102', 'B Block', '+91 9876543218', '+91 9876543219');

-- Sample admins
INSERT INTO admins (id, username, password, name, hostel, role) VALUES
('AD-001', 'admin', 'password', 'Admin User', 'A Block', 'hostel_admin'),
('AD-002', 'bblock', 'password', 'B Block Admin', 'B Block', 'hostel_admin'),
('AD-003', 'security', 'password', 'Security Officer', NULL, 'security'),
('AD-004', 'superadmin', 'password', 'Super Admin', NULL, 'super_admin');

-- Sample outpass requests
INSERT INTO outpass_requests (id, student_id, type, purpose, place, expected_date, expected_return_time, status, created_at, approved_by, approved_at) VALUES
('OP-001', 'ST-001', 'Market', 'Shopping', 'City Market', '2023-04-10', '18:00:00', 'Approved', '2023-04-08 10:30:00', 'AD-001', '2023-04-09 14:20:00'),
('OP-002',  '2023-04-10', '18:00:00', 'Approved', '2023-04-08 10:30:00', 'AD-001', '2023-04-09 14:20:00'),
('OP-002', 'ST-002', 'Home', 'Family function', 'Hometown', '2023-04-15', '20:00:00', 'Pending', '2023-04-09 14:20:00', NULL, NULL),
('OP-003', 'ST-003', 'Market', 'Groceries', 'Local Market', '2023-04-05', '19:30:00', 'Rejected', '2023-04-03 09:15:00', 'AD-001', '2023-04-04 10:00:00'),
('OP-004', 'ST-004', 'Market', 'Stationary', 'Book Store', '2023-04-02', '17:00:00', 'Returned', '2023-04-01 11:45:00', 'AD-002', '2023-04-01 15:30:00'),
('OP-005', 'ST-005', 'Home', 'Wedding', 'Home Town', '2023-04-20', '21:00:00', 'Pending', '2023-04-18 08:30:00', NULL, NULL);

-- Sample gate logs
INSERT INTO gate_logs (id, outpass_id, student_id, action, timestamp) VALUES
('GL-001', 'OP-001', 'ST-001', 'exit', '2023-04-10 14:30:00'),
('GL-002', 'OP-004', 'ST-004', 'exit', '2023-04-02 14:00:00'),
('GL-003', 'OP-004', 'ST-004', 'return', '2023-04-02 16:45:00');

-- Sample notifications
INSERT INTO notifications (id, type, recipient_id, outpass_id, message, status, sent_at) VALUES
('NOT-001', 'parent', 'ST-001', 'OP-001', 'Your child John Doe has been approved for a market outpass on 2023-04-10.', 'sent', '2023-04-09 14:30:00'),
('NOT-002', 'admin', 'AD-001', 'OP-001', 'Student John Doe (CS12345) is late for return. Expected: 2023-04-10 18:00, Current time: 2023-04-10 19:30.', 'sent', '2023-04-10 19:30:00');
