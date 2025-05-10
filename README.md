# Hostel Outpass Management System

A web-based digital outpass approval system for a university campus where students can request Market or Home outpasses, hostel admins can approve or reject requests, and gate security can scan barcodes to log exits and re-entries.

## Features

- Student Interface: Submit request, check status, download outpass
- Admin Interface: Approve/reject requests for their hostel only
- Gate Interface: Scan barcode for exit/entry logging
- Notifications: For parents (home outpass) and admins (late return)

## Tech Stack

- Frontend: Next.js with App Router, React, TailwindCSS
- Backend: Next.js API Routes
- Database: MySQL (Docker)
- Styling: Tailwind CSS with shadcn/ui components

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- Docker and Docker Compose

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/hostel-outpass-system.git
   cd hostel-outpass-system
