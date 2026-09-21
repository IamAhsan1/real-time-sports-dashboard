import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import {
    createCommentarySchema,
    listCommentaryQuerySchema,
} from "../validation/commentary.js";
import { matchIdParamSchema } from "../validation/matches.js";

const commentaryRouter = Router({ mergeParams: true });
const MAX_LIMIT = 100;

commentaryRouter.get("/", async (req, res) => {
    try {
        const paramsResult = matchIdParamSchema.safeParse(req.params);
        const queryResult = listCommentaryQuerySchema.safeParse(req.query);

        if (!paramsResult.success || !queryResult.success) {
            return res.status(400).json({
                error: [
                    ...(paramsResult.success ? [] : paramsResult.error.issues),
                    ...(queryResult.success ? [] : queryResult.error.issues),
                ],
            });
        }

        const limit = Math.min(queryResult.data.limit ?? MAX_LIMIT, MAX_LIMIT);
        const commentaryEvents = await db
            .select()
            .from(commentary)
            .where(eq(commentary.matchId, paramsResult.data.id))
            .orderBy(desc(commentary.createdAt))
            .limit(limit);

        return res.status(200).json(commentaryEvents);
    } catch (error) {
        console.error("List commentary error:", error);

        return res.status(500).json({
            error: "Internal server error",
        });
    }
});

commentaryRouter.post("/", async (req, res) => {
    try {
        const paramsResult = matchIdParamSchema.safeParse(req.params);
        console.log("Params validation result:", paramsResult);
        const bodyResult = createCommentarySchema.safeParse(req.body);
        console.log("Body validation result:", bodyResult);

        if (!paramsResult.success || !bodyResult.success) {
            return res.status(400).json({
                error: [
                    ...(paramsResult.success ? [] : paramsResult.error.issues),
                    ...(bodyResult.success ? [] : bodyResult.error.issues),
                ],
            });
        }

        const [createdCommentary] = await db
            .insert(commentary)
            .values({
                matchId: paramsResult.data.id,
                ...bodyResult.data,
            })
            .returning();

            if(res.app.locals.broadcastCommentary){
               res.app.locals.broadcastCommentary(createdCommentary.matchId,createdCommentary)
            }

        return res.status(201).json(createdCommentary);
    } catch (error) {
        console.error("Create commentary error:", error);

        return res.status(500).json({
            error: "Internal server error",
        });
    }
});

export default commentaryRouter;


