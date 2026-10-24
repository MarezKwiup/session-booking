import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import { createApp } from './app';

async function main() {
    await connectDB(env.MONGODB_URI);

    const server = createApp().listen(env.PORT, () => {
        console.log(`Server listening on http://localhost:${env.PORT}`);
    });

    const shutdown = (signal: string) => {
        console.log(`${signal} received, shutting down...`);
        server.close(async () => {
            await disconnectDB();
            process.exit(0);
        });
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
    console.error('Failed to start: ', err);
    process.exit(1);
});