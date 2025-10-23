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

## Deployment on Railway.com

### Quick Deployment Steps

1. **Push code to GitHub:**
   - Create a new repository on GitHub
   - Push the `Mecha-Eg-Fullstack` folder to the repository

2. **Deploy on Railway:**
   - Go to [Railway.app](https://railway.app)
   - Sign in with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Click "Deploy Now"

3. **Get Your URL:**
   - Go to Settings → Domains
   - Click "Generate Domain"
   - Your app will be live at: `https://your-app.up.railway.app`

Railway will automatically:
- ✅ Detect Node.js project
- ✅ Run `npm run render-build` (build command)
- ✅ Start with `npm start`
- ✅ Provide HTTPS and custom domain support

### Configuration Files

The project includes Railway-specific configuration:
- `railway.json` - Railway deployment settings
- `nixpacks.toml` - Build configuration
- `Procfile` - Process definition

### Environment Variables

Railway automatically sets:
- `NODE_ENV=production`
- `PORT` (auto-assigned)

Add custom variables in Railway Dashboard → Variables tab if needed.

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
