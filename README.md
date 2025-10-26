# Prove Unify Express TypeScript Backend

Backend server for Prove Unify API integration.

## Prerequisites

- Node.js (v18 or higher)
- Prove API credentials

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set environment variables:

```bash
export PROVE_CLIENT_ID=your-client-id
export PROVE_CLIENT_SECRET=your-client-secret
```

Or create a `.env` file (see `.env.example`).

## Running

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

Server runs on `http://localhost:3000`

## API Endpoints

**POST /initialize** - Start Prove Unify session
**POST /verify** - Check session status
