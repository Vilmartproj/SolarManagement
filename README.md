# ☀️ Solar Management System

A full-stack web application for managing solar installation projects, invoices, inventory, and maintenance requests.

## Features

### Employee Portal
- **Project Entry** — Create and manage solar project details (customer info, system specs, timelines)
- **Maintenance Requests** — Submit service requests and connect with Local Electricians or DWCRA Group

### Admin Portal
- **Dashboard** — Overview with KPIs: total projects, active installs, revenue, alerts
- **Project Management** — Full CRUD with search and status filtering
- **Invoice Generation** — Create itemized invoices with tax calculation, print/export
- **Inventory Tracking** — Track solar panels, inverters, batteries, wiring; low-stock alerts
- **Maintenance Management** — Assign technicians, schedule repairs, track resolution
- **Employee Directory** — View all registered employees

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Axios |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Auth | JWT + bcrypt |

## Prerequisites

- **Node.js** 18+
- **MySQL** 8.0+

## Setup & Installation

### 1. Clone & Install

```bash
cd solar-management

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
```

### 2. Configure Database

Edit `server/.env` with your MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=solar_management
JWT_SECRET=change_this_to_a_random_secret
```

Make sure MySQL is running. The database and tables are auto-created on server start.

### 3. Start the Application

```bash
# Terminal 1 — Start backend
cd server && npm run dev

# Terminal 2 — Start frontend
cd client && npm start
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

### 4. Default Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@solar.com | admin123 |

Register new employees through the login page.

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | — | Register new user |
| POST | /api/auth/login | — | Login |
| GET | /api/auth/profile | User | Get profile |
| GET | /api/projects | User | List projects |
| POST | /api/projects | User | Create project |
| GET | /api/projects/dashboard | User | Dashboard stats |
| GET | /api/invoices | Admin | List invoices |
| POST | /api/invoices | Admin | Create invoice |
| GET | /api/inventory | User | List inventory |
| POST | /api/inventory | Admin | Add inventory item |
| GET | /api/maintenance | User | List requests |
| POST | /api/maintenance | User | Create request |

## Project Structure

```
solar-management/
├── server/
│   ├── src/
│   │   ├── config/         # DB config, schema, initialization
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/      # Auth middleware
│   │   ├── routes/          # Express routes
│   │   └── index.js         # Server entry point
│   ├── .env
│   └── package.json
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/       # Dashboard, Invoices, Inventory, Employees
│   │   │   ├── auth/        # Login/Register
│   │   │   ├── employee/    # Projects
│   │   │   ├── maintenance/ # Maintenance requests
│   │   │   └── shared/      # Sidebar, Layout
│   │   ├── context/         # AuthContext
│   │   ├── utils/           # API client
│   │   └── styles/          # CSS
│   └── package.json
└── README.md
```
