# Mecha-Eg Fullstack Application

A full-stack application for processing fan data with React frontend and Express backend.

## Project Structure

```
Mecha-Eg-Fullstack/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   └── package.json
├── server/                 # Express backend
│   ├── modules/
│   │   └── FanData/
│   ├── index.js
│   ├── output.json
│   └── MotorData.json
├── package.json           # Root package.json
├── render.yaml           # Render.com configuration
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Local Development

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Copy data files:**
   - Copy `output.json` from `Mecha-Eg-Backend` to `server/` folder
   - Copy `MotorData.json` from `Mecha-Eg-Backend` to `server/` folder
   - Copy entire `Mecha-Eg-Frontend` contents to `client/` folder (excluding node_modules and .git)

3. **Run backend server:**
   ```bash
   npm start
   ```
   Server runs on port 5001 (or PORT environment variable)

4. **Run frontend (in development):**
   ```bash
   npm run client
   ```
   Frontend runs on port 3000

### Production Build

Build the React app:
```bash
npm run build
```

Then start the server which will serve the built React app:
```bash
npm start
```

## Deployment on Render.com

### Option 1: Using Render Dashboard

1. **Push code to GitHub:**
   - Create a new repository on GitHub
   - Push the `Mecha-Eg-Fullstack` folder to the repository

2. **Create Web Service on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name:** mecha-eg-fullstack
     - **Environment:** Node
     - **Build Command:** `npm run render-build`
     - **Start Command:** `npm start`
     - **Instance Type:** Free (or your preferred tier)

3. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically build and deploy your app

### Option 2: Using render.yaml (Infrastructure as Code)

1. Push your code with the `render.yaml` file to GitHub
2. In Render Dashboard:
   - Click "New +" → "Blueprint"
   - Connect your repository
   - Render will automatically detect and use the `render.yaml` configuration

### Environment Variables

If needed, add environment variables in Render Dashboard:
- `NODE_ENV=production` (automatically set)
- `PORT` (automatically set by Render)

## API Endpoints

- `POST /api/fan-data/process` - Process fan data
- `POST /api/fan-data/numerical` - Numerical equation processing
- `POST /api/fan-data/filter` - Filter fan data

## Manual File Copy Instructions

Since automated copying failed, please manually copy these files:

1. **Copy Frontend Files:**
   - Copy all files from `Mecha-Eg-Frontend/` to `Mecha-Eg-Fullstack/client/`
   - Exclude: `node_modules/`, `.git/`

2. **Copy Backend Data Files:**
   - Copy `output.json` from `Mecha-Eg-Backend/` to `Mecha-Eg-Fullstack/server/`
   - Copy `MotorData.json` from `Mecha-Eg-Backend/` to `Mecha-Eg-Fullstack/server/`

3. **Copy Backend Test Files (if needed):**
   - Copy `test/` folder from `Mecha-Eg-Backend/` to `Mecha-Eg-Fullstack/server/test/`

## Technologies Used

### Frontend
- React 19
- Chakra UI
- Framer Motion
- React Icons

### Backend
- Express.js
- Node.js
- Cubic Spline interpolation
- XLSX processing

## Author

Belal Elrashidy

## License

ISC
