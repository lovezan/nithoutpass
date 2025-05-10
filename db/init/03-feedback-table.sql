-- Create feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    outpass_id VARCHAR(50) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    feedback_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',
    admin_response TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by VARCHAR(50),
    FOREIGN KEY (outpass_id) REFERENCES outpass(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_feedback_outpass_id ON feedback(outpass_id);
CREATE INDEX IF NOT EXISTS idx_feedback_student_id ON feedback(student_id);
