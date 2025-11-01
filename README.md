# QR Code Menu System

This is a web-based QR code menu system that allows customers to view the menu and place orders by scanning a QR code.

## Features

- QR code generation for menu access
- Digital menu display with images
- Cart functionality
- Order placement system
- Order tracking

## Setup Instructions

### Prerequisites

1. Node.js and npm installed
2. MongoDB installed and running locally

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the backend directory with:
   ```
   MONGODB_URI=mongodb://localhost:27017/qr-menu
   PORT=5000
   ```

4. Start the backend server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the frontend development server:
   ```
   npm start
   ```

## Deployment

### Backend Deployment (Heroku)

1. Create a Heroku account and install Heroku CLI
2. Login to Heroku CLI:
   ```
   heroku login
   ```
3. Create a new Heroku app:
   ```
   heroku create your-app-name
   ```
4. Add MongoDB Atlas connection string to Heroku config:
   ```
   heroku config:set MONGODB_URI=your_mongodb_atlas_uri
   ```
5. Deploy to Heroku:
   ```
   git push heroku main
   ```

### Frontend Deployment (Netlify/Vercel)

1. Build the frontend:
   ```
   cd frontend
   npm run build
   ```
2. Deploy the build folder to Netlify/Vercel through their respective platforms

## Usage

1. Access the homepage to generate a QR code
2. Scan the QR code with a mobile device to view the menu
3. Add items to cart and place orders
4. Track order status through the order tracking page

## Technologies Used

- Frontend: React.js
- Backend: Node.js, Express.js
- Database: MongoDB
- QR Code: react-qr-code
- Styling: CSS3
- HTTP Client: Axios"# QR_Menu_System" 
"# QR_Menu_System" 
