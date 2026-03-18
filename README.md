# Water Management Intelligence Portal

A premium, blockchain-inspired water management portal built with React, MUI, and Node.js.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js installed
- PostgreSQL installed and running

### 2. Backend Setup
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update the `.env` file with your PostgreSQL credentials:
   ```env
   DATABASE_URL=postgres://your_username:your_password@localhost:5432/water_management
   ```
4. Start the server:
   ```bash
   npm start
   ```
   *The server will automatically create the `complaints` table if it doesn't exist.*

### 3. Frontend Setup
1. From the root directory, install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

## 🛠️ Tech Stack
- **Frontend**: React, Material UI (MUI), Framer Motion, Leaflet Maps
- **Backend**: Node.js, Express, PostgreSQL (pg)
- **Features**: Real-time dashboard, Geo-location reporting, Image evidence upload, Responsive design.
