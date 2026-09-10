import { Router } from "express";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import { createMatchSchema, listMatchesQuerySchema } from "../validation/matches.js";
import { getMatchStatus } from "../utils/match-status.js";

const matchRouter = Router();

matchRouter.get("/", async (req, res) => {
    const result = listMatchesQuerySchema.safeParse(req.query);
    if (!result.success) {
        return res.status(400).json({
            error: result.error.issues,
        });
    }

    const limit = Math.min(result.data.limit ?? 50, 100);

    try {
        const allMatches = await db.select().from(matches).limit(limit);
        return res.status(200).json(allMatches);
    } catch (error) {
        console.error("List matches error:", error);
        return res.status(500).json({
            error: "Internal server error",
        });
    }



});

matchRouter.post("/", async (req, res) => {
    try {
        // 1. Validate request body
        const result = createMatchSchema.safeParse(req.body);

        // 2. Validation failed
        if (!result.success) {
            return res.status(400).json({
                error: result.error.issues,
            });
        }

        // 3. Get validated data
        const matchData = result.data;

        // 4. Insert into database
        const [event] = await db
            .insert(matches)
            .values({
                ...matchData,

                startTime: new Date(matchData.startTime),
                endTime: new Date(matchData.endTime),

                homeScore: matchData.homeScore ?? 0,
                awayScore: matchData.awayScore ?? 0,

                status: getMatchStatus(
                    matchData.startTime,
                    matchData.endTime
                ),
            })
            .returning();

        // Broadcast the match creation event to WebSocket clients
        if (res.app.locals.broadcastMatchCreated) {
            res.app.locals.broadcastMatchCreated(event);
        }

        // 5. Return created match
        return res.status(201).json(event);

    } catch (error) {
        console.error("Create match error:", error);

        return res.status(500).json({
            error: "Internal server error",
        });
    }
});

export default matchRouter;