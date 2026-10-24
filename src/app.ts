import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import routes from './routes';

export function createApp() {
    const app = express();

    app.disable('x-powered-by');
    app.use(express.json({ limit: '100kb' }));
    app.use(morgan('dev'));

    app.get('/health', (_req, res) => {
        const dbUp = mongoose.connection.readyState === 1;
        res.status(dbUp ? 200 : 503).json({
            status: dbUp ? 'ok' : 'degraded',
            db: dbUp ? 'up' : 'down'
        });
    })
    app.use(routes);
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}