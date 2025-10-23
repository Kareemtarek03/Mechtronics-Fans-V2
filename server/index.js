import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fanDataRoutes from "./modules/FanData/fanData.route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Simple CORS middleware to allow cross-origin requests and handle preflight
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept, Authorization"
	);
	// Handle preflight
	if (req.method === "OPTIONS") {
		res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
		return res.sendStatus(204);
	}
	next();
});

// Register API routes
app.use("/api/fan-data", fanDataRoutes);

// Serve static files from the React app build directory
const clientBuildPath = path.join(__dirname, "..", "client", "build");
app.use(express.static(clientBuildPath));

// The "catchall" handler: for any request that doesn't match API routes,
// send back the React app's index.html file.
app.use((req, res, next) => {
	// Only serve index.html for GET requests that don't start with /api
	if (req.method === 'GET' && !req.path.startsWith('/api')) {
		res.sendFile(path.join(clientBuildPath, "index.html"));
	} else {
		next();
	}
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
