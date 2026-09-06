import { PROFESSION_SPECIALTIES } from "./professionInterviewBank.js";

export const PROFESSION_FAMILIES = Object.fromEntries(
  Object.entries(PROFESSION_SPECIALTIES).map(([key, config]) => [
    key,
    {
      keywords: config.keywords,
      competencies: config.competencies,
      roleQuestions: config.questions,
      professionFamily: config.family,
      professionSpecific: true,
    },
  ]),
);
