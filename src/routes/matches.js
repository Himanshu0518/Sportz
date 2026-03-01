import {Router} from "express";
import {createMatchSchema, listMatchesQuerySchema} from "../validation/matches.js";
import {matches} from "../db/schema.js";
import { desc } from 'drizzle-orm';
import {db} from "../db/db.js";
import { getMatchStatus } from "../utils/matchStatus.js";

export const matchesRouter = Router();
const MAX_LIMIT = 100;

// Placeholder for matches routes
matchesRouter.get('/', async(req, res) => {
   
    const parsed = listMatchesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
    }

    const limit = Math.min(parsed.data.limit ? 50 : MAX_LIMIT, MAX_LIMIT);

    try{
        const data = await db.select().from(matches).orderBy((desc(matches.createdAt))).limit(limit);

        return res.status(200).json({data});
    }catch (err) {
        return res.status(500).json({ error: err.message });
    }
});


matchesRouter.post('/', async (req, res) => {
   
    const parsed = createMatchSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
    }

    const {data: {startTime, endTime, homeScore, awayScore}} = parsed;

    try{
         const [event] = await db.insert(matches).values({
            ...parsed.data,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            homeScore: homeScore || 0,
            awayScore: awayScore || 0,
            status:getMatchStatus(startTime, endTime)
    }).returning() ;

    if(req.app.locals.broadcastMatchCreation){
        req.app.locals.broadcastMatchCreation(event);
    }

    res.status(201).json({data: event});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});