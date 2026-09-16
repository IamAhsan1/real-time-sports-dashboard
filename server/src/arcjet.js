import 'dotenv/config';
import arcjet, { detectBot, shield, slidingWindow } from '@arcjet/node';

const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.ARCJET_MODE === 'DRY_RUN' ? 'DRY_RUN' : 'LIVE';

if (!arcjetKey) {
    throw new Error('ARCJET_KEY environment variable is not set');
}

const securityRules = (rateLimit) => [
    shield({ mode: arcjetMode }),
    detectBot({ mode: arcjetMode, allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'] }),
    slidingWindow({ mode: arcjetMode, ...rateLimit })
];

export const httpArcjet = arcjet({
    key: arcjetKey,
    rules: securityRules({ interval: 10, max: 50 })
});

export const wsArcjet = arcjet({
    key: arcjetKey,
    rules: securityRules({ interval: 2, max: 5 })
});

function handleDenial(res, decision) {
    if (decision.reason.isRateLimit()) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    if (decision.reason.isBot()) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    if (decision.reason.isShield()) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    return res.status(403).json({ error: 'Forbidden' });
}

export async function httpSecurityMiddleware(req, res, next) {
    try {
        const decision = await httpArcjet.protect(req);

        if (decision.isErrored()) {
            console.error('Arcjet errored, failing open:', decision.reason);
            return next(); // change to res.status(500)... if you'd rather fail closed
        }

        if (decision.isDenied()) {
            return handleDenial(res, decision);
        }

    } catch (err) {
        console.error('Arcjet error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
    next();
}

export async function wsSecurityMiddleware(req, res, next) {
    try {
        const decision = await wsArcjet.protect(req);

        if (decision.isErrored()) {
            console.error('Arcjet WS errored, failing open:', decision.reason);
            return next();
        }

        if (decision.isDenied()) {
            return handleDenial(res, decision);
        }
    } catch (err) {
        console.error('Arcjet WS error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
    next();
}