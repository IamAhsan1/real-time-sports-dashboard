import { z } from "zod";

export const MATCH_STATUS = {
  SCHEDULED: "scheduled",
  LIVE: "live",
  FINISHED: "finished",
};

const isoDateString = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return false;
  }

  const parsedDate = new Date(value);
  return !Number.isNaN(parsedDate.getTime());
};

const nonEmptyString = z.string().trim().min(1);
const nonNegativeInteger = z.coerce.number().int().nonnegative();

export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createMatchSchema = z
  .object({
    sport: nonEmptyString,
    homeTeam: nonEmptyString,
    awayTeam: nonEmptyString,
    startTime: z.string().refine(isoDateString, "startTime must be a valid ISO date string"),
    endTime: z.string().refine(isoDateString, "endTime must be a valid ISO date string"),
    homeScore: nonNegativeInteger.optional(),
    awayScore: nonNegativeInteger.optional(),
  })
  .superRefine((match, context) => {
    if (new Date(match.endTime) <= new Date(match.startTime)) {
      context.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "endTime must be after startTime",
      });
    }
  });

export const updateScoreSchema = z.object({
  homeScore: nonNegativeInteger,
  awayScore: nonNegativeInteger,
});