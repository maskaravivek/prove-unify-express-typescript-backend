// src/index.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import { Proveapi } from "@prove-identity/prove-api";
import { randomUUID } from 'crypto';

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'], // Add your frontend URLs
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use((err: any, _req: Request, res: Response, _next: any) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

export const DEVICE_API_BASE_URL = process.env.DEVICE_API_BASE_URL || '';
export const PROVE_CLIENT_ID = process.env.PROVE_CLIENT_ID;
export const PROVE_CLIENT_SECRET = process.env.PROVE_CLIENT_SECRET;

export function getProveSdk(): Proveapi {
    if (!PROVE_CLIENT_ID || !PROVE_CLIENT_SECRET) {
        throw new Error('PROVE_CLIENT_ID and PROVE_CLIENT_SECRET environment variables are required');
    }
    
    return new Proveapi({
        server: 'uat-us',
        security: {
            clientID: PROVE_CLIENT_ID,
            clientSecret: PROVE_CLIENT_SECRET,
        },
    });
}

interface UnifyRequest {
    possessionType: 'mobile' | 'desktop' | 'none';
    phoneNumber?: string;
    finalTargetUrl?: string;
    smsMessage?: string;
    clientCustomerId?: string;
    clientRequestId?: string;
    allowOTPRetry?: boolean;
    rebind?: boolean;
}

// Initialize endpoint - this is what the frontend calls first to get an authToken
app.post('/initialize', async (req: Request, res: Response) => {
    try {
        const { possessionType, phoneNumber }: UnifyRequest = req.body;

        if (!possessionType) {
            return res.status(400).json({ error: 'possessionType is required' });
        }

        if (possessionType === 'desktop' && !req.body.finalTargetUrl) {
            return res.status(400).json({ error: 'finalTargetUrl is required for desktop possession type' });
        }

        const proveSdk = getProveSdk();
        const result = await proveSdk.v3.v3UnifyRequest({
            possessionType,
            phoneNumber,
            finalTargetUrl: req.body.finalTargetUrl,
            smsMessage: req.body.smsMessage,
            clientCustomerId: req.body.clientCustomerId,
            clientRequestId: req.body.clientRequestId || randomUUID(),
            allowOTPRetry: req.body.allowOTPRetry,
            rebind: req.body.rebind
        });

        // Return the response in the format expected by the frontend
        res.json({
            authToken: result.v3UnifyResponse?.authToken,
            correlationId: result.v3UnifyResponse?.correlationId,
            success: result.v3UnifyResponse?.success
        });
    } catch (error: any) {
        console.error('Initialize error:', error);
        res.status(500).json({ error: error.message || 'Failed to initialize' });
    }
});

// Verify endpoint - called by frontend after possession check completes
app.post('/verify', async (req: Request, res: Response) => {
    try {
        const { correlationId } = req.body;

        if (!correlationId) {
            return res.status(400).json({ error: 'correlationId is required' });
        }

        const proveSdk = getProveSdk();
        const result = await proveSdk.v3.v3UnifyStatusRequest({
            correlationId
        });

        res.json(result);
    } catch (error: any) {
        console.error('Verify error:', error);
        res.status(500).json({ error: error.message || 'Failed to verify' });
    }
});

app.get('/', (_req: Request, res: Response) => {
    res.send('Prove Unify Server - Express with TypeScript');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
