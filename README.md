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



### Production Build

Build the React app:
```bash
npm run build
```

Then start the server which will serve the built React app:
```bash
npm start
```

### Environment Variables

Railway automatically sets:
- `NODE_ENV=production`
- `PORT` (auto-assigned)


## API Endpoints

- `POST /api/fan-data/process` - Process fan data
- `POST /api/fan-data/numerical` - Numerical equation processing
- `POST /api/fan-data/filter` - Filter fan data


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
Kareem Tarek

Belal Elrashidy

## License

ISC
