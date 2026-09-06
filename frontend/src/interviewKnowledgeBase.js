import { PROFESSION_FAMILIES } from "./professionInterviewFamilies.js";

export const CAREER_FAMILIES = {
  // Put profession-level matches before broad families so exact titles win ties.
  ...PROFESSION_FAMILIES,
  healthcare: {
    keywords: ["nurse", "nursing", "physician", "doctor", "medical", "healthcare", "therapist", "pharmacy", "pharmacist", "dental", "patient", "clinical", "caregiver", "emt", "paramedic"],
    competencies: ["judgment", "communication", "teamwork", "safety", "empathy", "prioritization"],
    roleQuestions: [
      "Tell me about a time you had to make a careful decision while caring for a patient or client.",
      "Describe a situation where you had to balance competing priorities while maintaining quality and safety.",
      "How do you communicate important information when the person receiving it is stressed or uncertain?",
    ],
  },
  technology: {
    keywords: ["software", "developer", "devops", "cloud", "security", "cyber", "data", "database", "docker", "kubernetes", "systems", "network", "programmer", "information technology"],
    competencies: ["problem_solving", "ownership", "communication", "reliability", "learning", "prioritization"],
    roleQuestions: [
      "Walk me through a difficult technical problem you diagnosed and how you narrowed down the cause.",
      "Tell me about a change you made that improved reliability, quality, security, or maintainability.",
      "Describe a time you had to explain a technical issue to someone with a different level of technical knowledge.",
    ],
  },
  education: {
    keywords: ["teacher", "education", "educator", "professor", "instructor", "school", "principal", "tutor", "student"],
    competencies: ["communication", "adaptability", "planning", "empathy", "leadership", "assessment"],
    roleQuestions: [
      "Tell me about a time you adapted your approach because someone was not learning or responding as expected.",
      "Describe how you have created an environment where people felt supported and accountable.",
      "Give an example of how you used feedback or results to improve your approach.",
    ],
  },
  finance: {
    keywords: ["accounting", "finance", "financial", "bank", "banking", "auditor", "investment", "payroll", "bookkeeper", "controller"],
    competencies: ["accuracy", "judgment", "communication", "analysis", "integrity", "prioritization"],
    roleQuestions: [
      "Tell me about a time you found an error, risk, or inconsistency that others had missed.",
      "Describe a decision you made using financial or quantitative information.",
      "How have you communicated complex numbers or financial information to a non-specialist?",
    ],
  },
  sales: {
    keywords: ["sales", "account executive", "business development", "customer success", "real estate", "agent", "fundraising"],
    competencies: ["communication", "influence", "resilience", "customer_focus", "planning", "results"],
    roleQuestions: [
      "Tell me about a time you earned trust with a difficult or hesitant customer, client, or stakeholder.",
      "Describe a goal you were responsible for and the specific actions you took to reach it.",
      "Tell me about a time you heard no, faced a setback, or lost an opportunity. What did you do next?",
    ],
  },
  operations: {
    keywords: ["operations", "logistics", "warehouse", "supply chain", "dispatcher", "transportation", "driver", "inventory", "manufacturing", "production", "quality", "procurement"],
    competencies: ["safety", "prioritization", "problem_solving", "quality", "teamwork", "efficiency"],
    roleQuestions: [
      "Tell me about a time an operational plan changed unexpectedly. How did you respond?",
      "Describe an improvement you made to a process, workflow, quality check, or handoff.",
      "Give an example of how you balanced speed, quality, and safety under pressure.",
    ],
  },
  trades: {
    keywords: ["electrician", "plumber", "mechanic", "technician", "welder", "carpenter", "construction", "hvac", "maintenance", "installer", "machinist", "repair"],
    competencies: ["safety", "diagnosis", "quality", "customer_focus", "planning", "craft"],
    roleQuestions: [
      "Tell me about a difficult fault, repair, or installation you diagnosed step by step.",
      "Describe a time you caught a safety or quality issue before it became a bigger problem.",
      "Give an example of how you handled an unexpected condition while keeping the work on track.",
    ],
  },
  hospitality: {
    keywords: ["hospitality", "hotel", "restaurant", "server", "chef", "cook", "barista", "retail", "store", "guest", "customer service", "front desk"],
    competencies: ["customer_focus", "communication", "teamwork", "prioritization", "resilience", "service"],
    roleQuestions: [
      "Tell me about a time you turned around a difficult customer or guest experience.",
      "Describe a busy period when several people needed your attention at once. How did you prioritize?",
      "Give an example of how you helped your team deliver better service under pressure.",
    ],
  },
  legal: {
    keywords: ["lawyer", "attorney", "legal", "paralegal", "court", "compliance", "contract", "claims", "case manager"],
    competencies: ["judgment", "analysis", "communication", "integrity", "detail", "prioritization"],
    roleQuestions: [
      "Tell me about a matter where careful research or attention to detail changed your approach.",
      "Describe a time you had to communicate a difficult or complex issue clearly to a client or stakeholder.",
      "Give an example of how you managed competing deadlines while protecting quality and accuracy.",
    ],
  },
  creative: {
    keywords: ["designer", "design", "writer", "editor", "marketing", "content", "creative", "artist", "photographer", "video", "producer", "social media", "brand"],
    competencies: ["creativity", "communication", "feedback", "customer_focus", "prioritization", "results"],
    roleQuestions: [
      "Tell me about a piece of work that changed significantly after feedback. How did you handle it?",
      "Describe a project where you had to balance creative quality with a deadline or business constraint.",
      "Give an example of work where you can point to a measurable audience, customer, or business result.",
    ],
  },
  management: {
    keywords: ["manager", "director", "supervisor", "lead", "executive", "vp ", "vice president", "chief", "head of", "owner"],
    competencies: ["leadership", "decision_making", "coaching", "communication", "strategy", "accountability"],
    roleQuestions: [
      "Tell me about a difficult decision you made when there was no perfect option.",
      "Describe a time you helped someone improve their performance or grow into greater responsibility.",
      "Give an example of how you aligned people with different priorities around a shared outcome.",
    ],
  },
  public_service: {
    keywords: ["government", "public service", "police", "firefighter", "social worker", "caseworker", "nonprofit", "community", "military", "emergency"],
    competencies: ["judgment", "service", "communication", "resilience", "integrity", "teamwork"],
    roleQuestions: [
      "Tell me about a time you had to make a sound decision while serving someone in a stressful situation.",
      "Describe a situation where policy, procedure, or public trust shaped what you did.",
      "Give an example of how you worked across roles or agencies to reach a better outcome.",
    ],
  },
};

export const CORE_QUESTIONS = [
  { id: "intro-role", competency: "motivation", types: ["mixed", "behavioral", "role-specific", "leadership"], text: "Walk me through your background and what makes you interested in this {role} opportunity." },
  { id: "why-role", competency: "motivation", types: ["mixed", "behavioral", "role-specific"], text: "Why this {role} role now, and what specifically are you looking for in your next opportunity?" },
  { id: "achievement", competency: "results", types: ["mixed", "behavioral", "role-specific", "leadership"], text: "What accomplishment are you most proud of that is relevant to a {role} role? What made it meaningful?" },
  { id: "strength", competency: "role_alignment", types: ["mixed", "behavioral", "role-specific"], text: "What is one strength you would bring to a {role} position, and what real example best proves it?" },
  { id: "growth-area", competency: "self_awareness", types: ["mixed", "behavioral", "leadership"], text: "What is a professional skill or habit you have been actively improving? What have you done to get better at it?" },
  { id: "problem", competency: "problem_solving", types: ["mixed", "behavioral", "role-specific"], text: "Tell me about a difficult problem you faced at work. What did you personally do, and what happened afterward?" },
  { id: "priority", competency: "prioritization", types: ["mixed", "behavioral", "role-specific", "leadership"], text: "Describe a time you had several important priorities competing for your attention. How did you decide what to do first?" },
  { id: "deadline", competency: "execution", types: ["mixed", "behavioral", "role-specific"], text: "Tell me about a time a deadline or commitment was at risk. What did you do to protect the outcome?" },
  { id: "conflict", competency: "communication", types: ["mixed", "behavioral", "leadership"], text: "Tell me about a disagreement with a coworker, customer, manager, or stakeholder. How did you handle it?" },
  { id: "failure", competency: "learning", types: ["mixed", "behavioral", "leadership"], text: "Tell me about something that did not go as planned. What did you learn, and what did you change afterward?" },
  { id: "change", competency: "adaptability", types: ["mixed", "behavioral", "role-specific", "leadership"], text: "Describe a significant change in priorities, tools, process, or expectations. How did you adapt?" },
  { id: "ownership", competency: "ownership", types: ["mixed", "behavioral", "role-specific", "leadership"], text: "Give me an example of a time you took ownership of something beyond simply completing the task you were given." },
  { id: "teamwork", competency: "teamwork", types: ["mixed", "behavioral", "role-specific"], text: "Tell me about a time collaboration was essential to getting a good result. What was your contribution?" },
  { id: "stakeholder", competency: "communication", types: ["mixed", "behavioral", "role-specific", "leadership"], text: "Tell me about a time you had to earn trust with a difficult customer, patient, student, client, or stakeholder." },
  { id: "feedback", competency: "learning", types: ["mixed", "behavioral", "leadership"], text: "Describe a piece of difficult feedback you received and what you did with it." },
  { id: "leadership", competency: "leadership", types: ["mixed", "leadership"], text: "Tell me about a time you influenced an outcome even when you did not have formal authority over everyone involved." },
  { id: "decision", competency: "decision_making", types: ["mixed", "role-specific", "leadership"], text: "Describe an important decision you made with incomplete information. How did you evaluate the tradeoffs?" },
  { id: "integrity", competency: "integrity", types: ["mixed", "behavioral", "role-specific", "leadership"], text: "Tell me about a time doing the right thing was less convenient than the easier option. How did you handle it?" },
  { id: "learning-new", competency: "learning", types: ["mixed", "behavioral", "role-specific"], text: "Tell me about a time you had to learn something unfamiliar quickly in order to perform well." },
  { id: "closing", competency: "motivation", types: ["mixed", "behavioral", "role-specific", "leadership"], text: "Why should we choose you for this {role} role, and what would you hope to contribute first?" },
];

export const FOLLOW_UPS = {
  context: "Set the scene a little more clearly. What was happening, and why did it matter?",
  action: "What did you personally do? Be specific about your decisions or actions rather than only describing what the team did.",
  result: "What happened as a result of your actions? What changed for the customer, patient, team, project, or organization?",
  quantification: "Can you make the result more concrete with a number, timeframe, scale, frequency, or before-and-after comparison if one genuinely exists?",
  specificity: "Can you give one concrete example or detail that makes this story easier to picture?",
  relevance: "Bring the answer back to the question. Which part of this example best demonstrates the skill or behavior being asked about?",
};

export const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Entry level / early career" },
  { value: "experienced", label: "Experienced" },
  { value: "senior", label: "Senior / specialist" },
  { value: "leadership", label: "Manager / leadership" },
];

export const INTERVIEW_TYPES = [
  { value: "mixed", label: "Mixed interview" },
  { value: "behavioral", label: "Behavioral" },
  { value: "role-specific", label: "Role specific" },
  { value: "leadership", label: "Leadership" },
];
