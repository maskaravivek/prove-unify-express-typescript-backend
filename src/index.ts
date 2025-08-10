// src/index.ts
import express, { Request, Response } from 'express';
import { Proveapi } from "@prove-identity/prove-api";

const app = express();
const port = process.env.PORT || 3000;

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

interface UnifyBindRequest {
    correlationId: string;
    phoneNumber: string;
}

app.post('/unify', async (req: Request, res: Response) => {
    try {
        const { possessionType, phoneNumber, finalTargetUrl, smsMessage, clientCustomerId, clientRequestId, allowOTPRetry, rebind }: UnifyRequest = req.body;

        if (!possessionType) {
            return res.status(400).json({ error: 'possessionType is required' });
        }

        if (possessionType === 'desktop' && !finalTargetUrl) {
            return res.status(400).json({ error: 'finalTargetUrl is required for desktop possession type' });
        }

        const proveSdk = getProveSdk();
        const result = await proveSdk.v3.v3UnifyRequest({
            possessionType,
            phoneNumber,
            finalTargetUrl,
            smsMessage,
            clientCustomerId,
            clientRequestId,
            allowOTPRetry,
            rebind
        });

        res.json(result);
    } catch (error: any) {
        console.error('Unify error:', error);
        res.status(500).json({ error: error.message || 'Failed to initiate unify' });
    }
});

app.get('/unify/status/:correlationId', async (req: Request, res: Response) => {
    try {
        const { correlationId } = req.params;

        if (!correlationId) {
            return res.status(400).json({ error: 'correlationId is required' });
        }

        const proveSdk = getProveSdk();
        const result = await proveSdk.v3.v3UnifyStatusRequest({
            correlationId
        });

        res.json(result);
    } catch (error: any) {
        console.error('Unify status error:', error);
        res.status(500).json({ error: error.message || 'Failed to check unify status' });
    }
});

app.post('/unify/bind', async (req: Request, res: Response) => {
    try {
        const { correlationId, phoneNumber }: UnifyBindRequest = req.body;

        if (!correlationId || !phoneNumber) {
            return res.status(400).json({ error: 'correlationId and phoneNumber are required' });
        }

        const proveSdk = getProveSdk();
        const result = await proveSdk.v3.v3UnifyBindRequest({
            correlationId,
            phoneNumber
        });

        res.json(result);
    } catch (error: any) {
        console.error('Unify bind error:', error);
        res.status(500).json({ error: error.message || 'Failed to bind unify' });
    }
});

app.get('/', (_req: Request, res: Response) => {
    res.send('Prove Unify Server - Express with TypeScript');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});