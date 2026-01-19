import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { prisma } from "../server.js";

export async function authRoutes(app: FastifyInstance) {

    /**
     * ==========================
     * 1️⃣ REGISTER
     * ==========================
     */
    app.post("/auth/register", async (request: any, reply) => {
        const { email, password } = request.body;

        // 1. Validate input
        if (!email || !password) {
            return reply.code(400).send({
                message: "Email and password are required",
            });
        }

        if (password.length < 6) {
            return reply.code(400).send({
                message: "Password must be at least 6 characters",
            });
        }

        // 2. Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return reply.code(409).send({
                message: "User already exists",
            });
        }

        // 3. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Create user
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
            },
        });

        // 5. Generate LONG-LIVED JWT (mobile-friendly)
        const token = app.jwt.sign(
            { id: user.id },
            { expiresIn: "30d" } // ✅ No refresh tokens needed
        );

        // 6. Send response
        reply.code(201).send({
            token,
            user: {
                id: user.id,
                email: user.email,
            },
        });
    });

    /**
     * ==========================
     * 2️⃣ LOGIN
     * ==========================
     */
    app.post("/auth/login", async (request: any, reply) => {
        const { email, password } = request.body;

        // 1. Validate input
        if (!email || !password) {
            return reply.code(400).send({
                message: "Email and password are required",
            });
        }

        // 2. Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            return reply.code(401).send({
                message: "Invalid credentials",
            });
        }

        // 3. Compare password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return reply.code(401).send({
                message: "Invalid credentials",
            });
        }

        // 4. Generate LONG-LIVED JWT
        const token = app.jwt.sign(
            { id: user.id },
            { expiresIn: "30d" }
        );

        // 5. Send response
        reply.send({
            token,
            user: {
                id: user.id,
                email: user.email,
            },
        });
    });

    /**
     * ==========================
     * 3️⃣ LOGOUT
     * ==========================
     * Mobile logout is CLIENT-SIDE.
     * This endpoint exists only for semantic completeness.
     */
    app.post("/auth/logout", async () => {
        return { message: "Logged out successfully" };
    });

    /**
     * ==========================
     * 4️⃣ GET CURRENT USER
     * ==========================
     */
    app.get(
        "/auth/me",
        { preHandler: [app.authenticate] },
        async (request: any) => {
            const userId = request.user.id;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    createdAt: true,
                },
            });

            return { user };
        }
    );
}
