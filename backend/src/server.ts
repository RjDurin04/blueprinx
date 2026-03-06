import dotenv from 'dotenv';
import path from 'path';

// *** CRITICAL: Load .env BEFORE any other imports that read process.env ***
// .env is at c:\Cursor\planner\.env
// This file runs from c:\Cursor\planner\fullstack-monorepo\backend\
const possibleEnvPaths = [
    path.resolve(__dirname, '../../../.env'),     // from src/ -> backend/ -> monorepo/ -> planner/
    path.resolve(__dirname, '../../.env'),         // from src/ -> backend/ -> monorepo/.env
    path.resolve(process.cwd(), '../../.env'),     // from backend cwd
    path.resolve(process.cwd(), '../.env'),
    'c:\\Cursor\\planner\\.env',
];

let envLoaded = false;
for (const envPath of possibleEnvPaths) {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
        console.log(`[Server] Loaded .env from: ${envPath}`);
        envLoaded = true;
        break;
    }
}
if (!envLoaded) {
    console.warn("[Server] WARNING: Could not load .env from any known path.");
}

console.log("[Server] OPENROUTER_API_KEY loaded:", process.env.OPENROUTER_API_KEY ? "YES" : "NO");

// Now import everything else AFTER env is loaded
import express from 'express';
import cors from 'cors';
import aiRoutes from './modules/ai/ai.routes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/v1/ai', aiRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Global ErrorHandler]', err);
    res.status(500).json({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: err.message || 'An unexpected error occurred.',
        }
    });
});

app.listen(PORT, () => {
    console.log(`[Backend] Server listening on port ${PORT}`);
});
