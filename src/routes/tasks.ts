import { FastifyInstance } from "fastify";
import { prisma } from "../server.js";

export async function taskRoutes(app: FastifyInstance) {

  // 🔐 Protect all task routes
  app.addHook("preHandler", app.authenticate);

  /**
   * CREATE TASK
   */
  app.post("/tasks", async (req: any) => {
    const { title, completed, priority, deadline, category } = req.body;

    return prisma.task.create({
      data: {
        title,
        completed: completed ?? false,
        priority: priority ?? 1,
        deadline: deadline ? new Date(deadline) : null,
        category,
        userId: req.user.id,
      },
    });
  });

  /**
   * GET TASKS
   */
  app.get("/tasks", async (req: any) => {
    return prisma.task.findMany({
      where: { userId: req.user.id },
      orderBy: { id: "desc" },
    });
  });

  /**
   * UPDATE TASK
   */
  app.put("/tasks/:id", async (req: any) => {
    const { id } = req.params;

    return prisma.task.update({
      where: { id },
      data: req.body,
    });
  });

  /**
   * DELETE TASK
   */
  app.delete(
    "/tasks/:id",
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
      },
    },
    async (req: any, reply) => {
      const userId = req.user.id;
      const { id } = req.params;

      await prisma.task.deleteMany({
        where: {
          id,
          userId, // 🔐 critical
        },
      });

      reply.code(204).send();
    }
  );

}
