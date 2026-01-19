import { app } from "./server.js";
import { authRoutes } from "./routes/auth.js";
import { taskRoutes } from "./routes/tasks.js";


async function start() {
    await app.register(authRoutes);
    await app.register(taskRoutes);


    app.listen({
        port: Number(process.env.PORT) || 3000,
        host: "0.0.0.0"
    }, (err, address) => {
        if (err) {
            app.log.error(err);
            process.exit(1);
        }
        console.log(`🚀 Server running at ${address}`);
    });
}

start();
