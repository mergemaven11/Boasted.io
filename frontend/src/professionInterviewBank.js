// Profession-specific interview prompts for Aisha Jordan.
// Design basis: job-related, competency-based, open-ended behavioral/situational
// questions. Coverage is intentionally broad and falls back to career-family,
// job-description, and exact-role prompts when a title is not listed here.

export const PROFESSION_SPECIALTIES = {
  nursing: {
    family: "healthcare",
    keywords: ["registered nurse", "rn", "licensed practical nurse", "lpn", "nurse practitioner", "nursing", "nurse"],
    competencies: ["clinical_judgment", "patient_safety", "communication", "prioritization"],
    questions: [
      "Tell me about a shift when a patient's condition changed unexpectedly. What did you notice, what did you do, and what happened next?",
      "Describe a time you had competing patient-care priorities. How did you decide what needed attention first while protecting safety?",
      "Give me an example of a difficult handoff or family conversation. How did you communicate clearly and confirm understanding?",
    ],
  },
  physician: {
    family: "healthcare",
    keywords: ["physician", "medical doctor", "doctor", "hospitalist", "surgeon", "pediatrician", "internist"],
    competencies: ["clinical_judgment", "diagnosis", "communication", "teamwork"],
    questions: [
      "Walk me through a case where the initial presentation was ambiguous. How did you narrow the differential and decide on the next step?",
      "Tell me about a time you changed a clinical plan after new evidence or a specialist's input emerged.",
      "Describe how you handled a difficult conversation about risk, uncertainty, or treatment options with a patient or family.",
    ],
  },
  pharmacy: {
    family: "healthcare",
    keywords: ["pharmacist", "pharmacy technician", "pharmacy", "pharmd"],
    competencies: ["accuracy", "patient_safety", "communication", "judgment"],
    questions: [
      "Tell me about a medication-order problem, interaction, or discrepancy you caught. How did you verify it and resolve it?",
      "Describe a time you had to explain medication use or risk to someone who was confused or concerned.",
      "Give me an example of how you maintained accuracy during a high-volume or high-pressure period.",
    ],
  },
  mental_health: {
    family: "healthcare",
    keywords: ["therapist", "psychologist", "mental health counselor", "counselor", "behavioral health", "psychiatric"],
    competencies: ["assessment", "empathy", "boundaries", "communication"],
    questions: [
      "Tell me about a time a client presented with competing needs or risks. How did you assess the situation and choose your next step?",
      "Describe a situation where you had to maintain professional boundaries while still building trust.",
      "Give me an example of adapting your communication or intervention when your first approach was not effective.",
    ],
  },
  allied_health: {
    family: "healthcare",
    keywords: ["physical therapist", "occupational therapist", "speech therapist", "radiology", "radiologic technologist", "respiratory therapist", "medical assistant", "sonographer"],
    competencies: ["assessment", "patient_safety", "communication", "adaptability"],
    questions: [
      "Tell me about a patient or client whose needs required you to adjust your usual approach.",
      "Describe a time you noticed a safety, quality, or documentation issue and what you did about it.",
      "Give me an example of coordinating care with another discipline to improve the outcome.",
    ],
  },
  dental: {
    family: "healthcare",
    keywords: ["dentist", "dental hygienist", "dental assistant", "orthodontist", "dental"],
    competencies: ["patient_safety", "precision", "communication", "service"],
    questions: [
      "Tell me about a patient who was anxious or hesitant about treatment. How did you handle the interaction?",
      "Describe a time you caught a clinical, sterilization, or documentation issue before it affected care.",
      "Give me an example of balancing efficiency with careful, high-quality patient care during a busy schedule.",
    ],
  },
  software_engineering: {
    family: "technology",
    keywords: ["software engineer", "software developer", "application developer", "frontend engineer", "front end developer", "backend engineer", "back end developer", "full stack", "programmer"],
    competencies: ["problem_solving", "design", "quality", "collaboration"],
    questions: [
      "Walk me through a difficult software defect or design problem you solved. How did you isolate the cause and validate the fix?",
      "Tell me about a technical tradeoff you made between speed, maintainability, performance, or complexity. Why did you choose that approach?",
      "Describe a code review or design discussion where you changed your mind or influenced the team's implementation.",
    ],
  },
  devops_platform: {
    family: "technology",
    keywords: ["devops", "site reliability", "sre", "platform engineer", "cloud engineer", "infrastructure engineer", "kubernetes engineer"],
    competencies: ["reliability", "incident_response", "automation", "risk_management"],
    questions: [
      "Tell me about a production reliability problem you diagnosed. What signals did you use and how did you prove the root cause?",
      "Describe an automation or platform change that reduced operational risk or repetitive work. How did you measure whether it helped?",
      "Walk me through a risky infrastructure change. How did you plan rollout, observability, rollback, and stakeholder communication?",
    ],
  },
  cybersecurity: {
    family: "technology",
    keywords: ["security analyst", "cybersecurity", "security engineer", "soc analyst", "incident responder", "penetration tester", "iam", "grc analyst"],
    competencies: ["security_judgment", "investigation", "risk", "communication"],
    questions: [
      "Tell me about a suspicious event or security finding you investigated. How did you separate signal from noise and decide what to do?",
      "Describe a security control or detection you improved after identifying a gap or recurring failure mode.",
      "Give me an example of explaining a security risk to a stakeholder who had competing business priorities.",
    ],
  },
  data_analytics: {
    family: "technology",
    keywords: ["data analyst", "business intelligence", "bi analyst", "analytics engineer", "data scientist", "data engineer", "machine learning engineer"],
    competencies: ["analysis", "data_quality", "communication", "decision_support"],
    questions: [
      "Tell me about a dataset or analysis that initially pointed you in the wrong direction. How did you detect and correct the issue?",
      "Describe an analysis that changed a business or operational decision. How did you make the result understandable and trustworthy?",
      "Give me an example of improving a data pipeline, query, model, or reporting process for accuracy, speed, or maintainability.",
    ],
  },
  it_support_network: {
    family: "technology",
    keywords: ["technical support engineer", "support engineer", "help desk", "service desk", "desktop support", "network engineer", "network administrator", "systems administrator", "sysadmin", "it support"],
    competencies: ["troubleshooting", "customer_focus", "communication", "escalation"],
    questions: [
      "Walk me through a difficult technical issue you troubleshot when the first explanation was wrong or incomplete.",
      "Tell me about a frustrated user or customer you supported. How did you communicate while still driving the issue toward resolution?",
      "Describe a recurring issue you prevented from coming back through documentation, automation, monitoring, or a permanent fix.",
    ],
  },
  product_management: {
    family: "management",
    keywords: ["product manager", "product owner", "product management", "growth product"],
    competencies: ["prioritization", "customer_insight", "decision_making", "influence"],
    questions: [
      "Tell me about a product decision where customer needs, business value, and engineering constraints pointed in different directions.",
      "Describe a feature or initiative you decided not to pursue. What evidence shaped that decision?",
      "Give me an example of aligning stakeholders around a product direction when you did not have direct authority over them.",
    ],
  },
  project_program_management: {
    family: "management",
    keywords: ["project manager", "program manager", "project coordinator", "scrum master", "pmo", "delivery manager"],
    competencies: ["planning", "risk_management", "stakeholder_management", "delivery"],
    questions: [
      "Tell me about a project that started slipping. How did you identify the real constraint and recover the plan?",
      "Describe a time stakeholders wanted conflicting outcomes or timelines. How did you create alignment?",
      "Give me an example of a risk you surfaced early and how your action changed the eventual project outcome.",
    ],
  },
  accounting: {
    family: "finance",
    keywords: ["accountant", "staff accountant", "senior accountant", "bookkeeper", "controller", "accounts payable", "accounts receivable", "payroll accountant"],
    competencies: ["accuracy", "controls", "analysis", "integrity"],
    questions: [
      "Tell me about a reconciliation, close, or reporting discrepancy you uncovered. How did you trace and correct it?",
      "Describe a process or control you improved to reduce errors, rework, or audit risk.",
      "Give me an example of handling an accounting deadline when important information was incomplete or late.",
    ],
  },
  financial_services: {
    family: "finance",
    keywords: ["financial analyst", "investment analyst", "banker", "banking", "credit analyst", "portfolio analyst", "treasury", "financial advisor"],
    competencies: ["analysis", "risk", "communication", "judgment"],
    questions: [
      "Tell me about a financial recommendation you made when the data did not point to an obvious answer.",
      "Describe a time you identified a material risk or assumption that changed your analysis or recommendation.",
      "Give me an example of explaining a complex financial conclusion to someone without your technical background.",
    ],
  },
  sales: {
    family: "sales",
    keywords: ["account executive", "sales representative", "sales manager", "business development", "sales development", "sdr", "bdr"],
    competencies: ["discovery", "influence", "resilience", "results"],
    questions: [
      "Tell me about a deal or customer opportunity you won because of something you learned during discovery.",
      "Describe a time you lost an opportunity. What did you learn and what did you change in your approach afterward?",
      "Give me an example of managing a difficult pipeline or quota period. Which actions had the biggest impact on the result?",
    ],
  },
  customer_success: {
    family: "sales",
    keywords: ["customer success", "customer success manager", "customer experience", "account manager", "client success"],
    competencies: ["customer_focus", "retention", "communication", "problem_solving"],
    questions: [
      "Tell me about an at-risk customer relationship you improved. What signals did you notice and what actions did you take?",
      "Describe a time a customer wanted something your product or team could not provide. How did you handle expectations and next steps?",
      "Give me an example of helping a customer adopt a product or process more successfully and how you knew it was working.",
    ],
  },
  recruiting_hr: {
    family: "management",
    keywords: ["recruiter", "talent acquisition", "human resources", "hr generalist", "people operations", "hr business partner", "hrbp"],
    competencies: ["judgment", "communication", "stakeholder_management", "confidentiality"],
    questions: [
      "Tell me about a difficult hiring or people decision where you had to balance speed, fairness, and stakeholder expectations.",
      "Describe a time you influenced a hiring manager or leader to change their approach based on evidence or policy.",
      "Give me an example of handling sensitive employee or candidate information while still moving work forward effectively.",
    ],
  },
  marketing: {
    family: "creative",
    keywords: ["marketing manager", "marketing specialist", "growth marketer", "digital marketing", "demand generation", "seo", "paid media", "brand manager", "product marketing"],
    competencies: ["customer_insight", "experimentation", "communication", "results"],
    questions: [
      "Tell me about a campaign or experiment that did not perform as expected. How did you diagnose why and what did you change?",
      "Describe a marketing decision you made from customer, market, or performance data rather than intuition alone.",
      "Give me an example of translating a complex product or idea into a message that moved the intended audience to act.",
    ],
  },
  ux_design: {
    family: "creative",
    keywords: ["ux designer", "user experience designer", "product designer", "ui designer", "interaction designer", "ux researcher"],
    competencies: ["user_research", "design_judgment", "collaboration", "accessibility"],
    questions: [
      "Tell me about a design where research or testing contradicted your initial assumption. What did you change?",
      "Describe a time engineering, product, and user needs created competing constraints. How did you make the design decision?",
      "Give me an example of improving accessibility or usability and how you validated the improvement.",
    ],
  },
  teaching_k12: {
    family: "education",
    keywords: ["elementary teacher", "middle school teacher", "high school teacher", "teacher", "special education teacher", "school teacher"],
    competencies: ["instruction", "classroom_management", "assessment", "communication"],
    questions: [
      "Tell me about a lesson or unit where students were not mastering the concept. How did you diagnose the gap and adjust instruction?",
      "Describe a difficult classroom-management situation and how you maintained expectations while supporting the student or class.",
      "Give me an example of using assessment evidence to change what you taught or how you taught it.",
    ],
  },
  higher_education: {
    family: "education",
    keywords: ["professor", "lecturer", "college instructor", "academic advisor", "higher education", "university administrator"],
    competencies: ["instruction", "mentoring", "communication", "program_improvement"],
    questions: [
      "Tell me about a time you changed instruction, advising, or programming because learner outcomes were not where you expected.",
      "Describe a difficult student or stakeholder conversation and how you handled both support and accountability.",
      "Give me an example of improving a course, program, research process, or student-service workflow using evidence.",
    ],
  },
  legal_practice: {
    family: "legal",
    keywords: ["attorney", "lawyer", "paralegal", "legal assistant", "litigation", "corporate counsel", "public defender", "prosecutor"],
    competencies: ["analysis", "judgment", "advocacy", "detail"],
    questions: [
      "Tell me about a matter where a fact, authority, or document changed your initial legal analysis.",
      "Describe a time you had to deliver difficult legal guidance to a client or stakeholder who wanted a different answer.",
      "Give me an example of managing competing deadlines or matters without sacrificing accuracy or professional obligations.",
    ],
  },
  compliance_risk: {
    family: "legal",
    keywords: ["compliance analyst", "risk analyst", "risk manager", "compliance manager", "privacy analyst", "aml", "kyc", "governance risk compliance", "grc"],
    competencies: ["risk_assessment", "controls", "judgment", "communication"],
    questions: [
      "Tell me about a risk or control gap you identified before it became a larger problem. How did you validate and communicate it?",
      "Describe a situation where policy, regulation, and business practicality pulled in different directions. How did you approach it?",
      "Give me an example of improving a control, review, monitoring, or evidence process and how you knew it became more reliable.",
    ],
  },
  supply_chain_logistics: {
    family: "operations",
    keywords: ["supply chain", "logistics manager", "logistics coordinator", "procurement", "buyer", "inventory manager", "warehouse manager", "dispatcher"],
    competencies: ["planning", "supplier_management", "problem_solving", "efficiency"],
    questions: [
      "Tell me about a supply, inventory, or delivery disruption. How did you prioritize the response and reduce downstream impact?",
      "Describe a process change that improved lead time, inventory accuracy, cost, or service level.",
      "Give me an example of resolving a difficult vendor, carrier, or cross-functional handoff issue.",
    ],
  },
  manufacturing_quality: {
    family: "operations",
    keywords: ["manufacturing engineer", "production supervisor", "quality engineer", "quality inspector", "plant manager", "production manager", "lean", "six sigma"],
    competencies: ["quality", "safety", "continuous_improvement", "root_cause"],
    questions: [
      "Tell me about a production or quality problem you traced to its root cause. What evidence led you there?",
      "Describe an improvement you made that increased throughput, quality, safety, or consistency without creating a new problem elsewhere.",
      "Give me an example of stopping or changing work because a safety or quality risk was unacceptable.",
    ],
  },
  engineering_nonsoftware: {
    family: "technology",
    keywords: ["mechanical engineer", "electrical engineer", "civil engineer", "chemical engineer", "industrial engineer", "aerospace engineer", "engineer"],
    competencies: ["technical_judgment", "design", "analysis", "safety"],
    questions: [
      "Tell me about an engineering problem where test results or field conditions forced you to revise the design or analysis.",
      "Describe a technical tradeoff involving cost, safety, performance, manufacturability, or schedule. How did you decide?",
      "Give me an example of finding a design, specification, or implementation risk before it caused a larger failure.",
    ],
  },
  construction_trades: {
    family: "trades",
    keywords: ["electrician", "plumber", "hvac technician", "carpenter", "welder", "construction manager", "construction superintendent", "journeyman", "apprentice"],
    competencies: ["safety", "diagnosis", "craft", "planning"],
    questions: [
      "Tell me about a difficult installation, repair, or site condition that was not what you expected. How did you diagnose and adapt?",
      "Describe a time you stopped or changed work because of a safety, code, or quality concern.",
      "Give me an example of keeping a job on track when materials, access, scope, or another trade created a delay.",
    ],
  },
  automotive: {
    family: "trades",
    keywords: ["automotive technician", "auto mechanic", "mechanic", "diesel technician", "service technician", "service advisor"],
    competencies: ["diagnosis", "quality", "customer_focus", "safety"],
    questions: [
      "Walk me through a vehicle problem where the obvious repair was not the real cause. How did you diagnose it?",
      "Tell me about a comeback, quality issue, or mistake you found. How did you correct it and prevent a repeat?",
      "Describe how you explain repair priorities, risk, and cost to a customer who is uncertain about what to approve.",
    ],
  },
  hospitality_food: {
    family: "hospitality",
    keywords: ["restaurant manager", "hotel manager", "front desk", "server", "bartender", "chef", "cook", "food service", "hospitality"],
    competencies: ["service", "prioritization", "teamwork", "recovery"],
    questions: [
      "Tell me about a guest or customer experience that was going badly. What did you do to recover it?",
      "Describe a very busy service period. How did you prioritize while maintaining quality and teamwork?",
      "Give me an example of handling a staffing, inventory, reservation, or kitchen problem without letting service collapse.",
    ],
  },
  retail: {
    family: "hospitality",
    keywords: ["retail manager", "store manager", "retail associate", "sales associate", "cashier", "merchandiser"],
    competencies: ["customer_focus", "sales", "operations", "loss_prevention"],
    questions: [
      "Tell me about a difficult customer interaction you turned into a better outcome while following store policy.",
      "Describe a time you balanced customer service with stocking, checkout, merchandising, or another operational priority.",
      "Give me an example of noticing a shrink, safety, inventory, or process problem and what you did about it.",
    ],
  },
  public_safety: {
    family: "public_service",
    keywords: ["police officer", "law enforcement", "firefighter", "fire department", "emt", "paramedic", "emergency dispatcher", "corrections officer"],
    competencies: ["judgment", "safety", "communication", "composure"],
    questions: [
      "Tell me about a high-pressure situation where you had to make a decision quickly with incomplete information.",
      "Describe a difficult interaction where de-escalation and clear communication were critical.",
      "Give me an example of following procedure while still adapting to conditions that changed in real time.",
    ],
  },
  social_work_nonprofit: {
    family: "public_service",
    keywords: ["social worker", "caseworker", "case manager", "community organizer", "nonprofit", "human services", "family services"],
    competencies: ["service", "boundaries", "resourcefulness", "communication"],
    questions: [
      "Tell me about a client or community situation where needs exceeded the resources immediately available. How did you proceed?",
      "Describe a time you had to balance empathy with policy, boundaries, or accountability.",
      "Give me an example of coordinating across agencies, providers, or stakeholders to improve an outcome.",
    ],
  },
  science_research_lab: {
    family: "technology",
    keywords: ["scientist", "research scientist", "research associate", "laboratory", "lab technician", "chemist", "biologist", "microbiologist", "researcher"],
    competencies: ["experimental_design", "analysis", "quality", "documentation"],
    questions: [
      "Tell me about an experiment or analysis that failed or produced an unexpected result. How did you investigate what happened?",
      "Describe a time you improved reproducibility, data quality, sample handling, or documentation in a research workflow.",
      "Give me an example of changing your hypothesis or approach because the evidence did not support your original assumption.",
    ],
  },
  administrative_office: {
    family: "operations",
    keywords: ["administrative assistant", "executive assistant", "office manager", "office administrator", "coordinator", "receptionist"],
    competencies: ["organization", "prioritization", "communication", "discretion"],
    questions: [
      "Tell me about a day when several urgent requests arrived at once. How did you decide what to handle first?",
      "Describe a process, calendar, document, or communication workflow you improved to reduce confusion or delays.",
      "Give me an example of handling sensitive information or a difficult stakeholder request with discretion.",
    ],
  },
  insurance: {
    family: "finance",
    keywords: ["underwriter", "claims adjuster", "claims examiner", "insurance agent", "insurance analyst", "actuary", "claims"],
    competencies: ["judgment", "analysis", "customer_focus", "documentation"],
    questions: [
      "Tell me about a claim, risk, or underwriting decision where the facts were incomplete or conflicting. How did you reach a defensible conclusion?",
      "Describe a difficult customer or claimant conversation where you had to explain a decision clearly and professionally.",
      "Give me an example of catching a documentation, fraud, coverage, or process issue that required deeper investigation.",
    ],
  },
  real_estate: {
    family: "sales",
    keywords: ["real estate agent", "realtor", "broker", "property manager", "leasing agent", "real estate"],
    competencies: ["client_service", "negotiation", "market_knowledge", "organization"],
    questions: [
      "Tell me about a client whose expectations did not match the market or transaction realities. How did you handle it?",
      "Describe a difficult negotiation or transaction issue and the role you personally played in moving it forward.",
      "Give me an example of managing multiple clients, listings, properties, or deadlines without letting important details slip.",
    ],
  },
  transportation: {
    family: "operations",
    keywords: ["truck driver", "driver", "bus driver", "delivery driver", "fleet manager", "transportation manager", "courier"],
    competencies: ["safety", "reliability", "planning", "customer_service"],
    questions: [
      "Tell me about a route, delivery, or operating situation where conditions changed unexpectedly. How did you protect safety and service?",
      "Describe a time you identified a vehicle, load, schedule, or compliance concern before starting or continuing work.",
      "Give me an example of handling a delay or customer issue while keeping communication clear and professional.",
    ],
  },
  agriculture: {
    family: "operations",
    keywords: ["farmer", "agriculture", "agricultural", "farm manager", "agronomist", "horticulture", "ranch"],
    competencies: ["planning", "safety", "problem_solving", "resource_management"],
    questions: [
      "Tell me about a weather, equipment, crop, livestock, or supply problem that forced you to adjust the plan quickly.",
      "Describe a decision where you balanced yield, quality, safety, cost, and long-term resource use.",
      "Give me an example of improving a farm, field, greenhouse, or production process based on observed results.",
    ],
  },
  veterinary: {
    family: "healthcare",
    keywords: ["veterinarian", "veterinary technician", "vet tech", "veterinary assistant", "animal hospital"],
    competencies: ["clinical_judgment", "animal_welfare", "communication", "prioritization"],
    questions: [
      "Tell me about an animal case where symptoms or history were unclear. How did you decide what to assess or do next?",
      "Describe a difficult conversation with an owner about treatment options, cost, prognosis, or expectations.",
      "Give me an example of prioritizing multiple urgent patients while maintaining safety and communication.",
    ],
  },
  media_journalism: {
    family: "creative",
    keywords: ["journalist", "reporter", "editor", "producer", "news producer", "copy editor", "communications specialist", "public relations", "pr specialist"],
    competencies: ["accuracy", "storytelling", "deadline_management", "judgment"],
    questions: [
      "Tell me about a story, piece, or communication where new information changed your angle or message close to deadline.",
      "Describe a time you had to verify a disputed fact or source before publishing or communicating publicly.",
      "Give me an example of balancing speed, clarity, audience needs, and accuracy under deadline pressure.",
    ],
  },
  architecture: {
    family: "creative",
    keywords: ["architect", "architectural designer", "interior architect", "urban planner", "landscape architect"],
    competencies: ["design_judgment", "coordination", "codes", "client_communication"],
    questions: [
      "Tell me about a design that changed because of site, code, budget, constructability, or client constraints.",
      "Describe a coordination issue with consultants or contractors and how you resolved it before it became a larger problem.",
      "Give me an example of explaining a difficult design tradeoff to a client or stakeholder and gaining alignment.",
    ],
  },
  energy_utilities: {
    family: "operations",
    keywords: ["utility", "power plant", "energy analyst", "lineman", "lineworker", "renewable energy", "solar technician", "wind technician", "grid operator"],
    competencies: ["safety", "reliability", "technical_judgment", "incident_response"],
    questions: [
      "Tell me about an equipment, reliability, or service issue where safety and continuity both mattered.",
      "Describe a time operating conditions changed quickly. How did you decide whether to continue, isolate, escalate, or stop work?",
      "Give me an example of improving preventive maintenance, monitoring, operating procedure, or reliability based on evidence.",
    ],
  },
  aviation: {
    family: "operations",
    keywords: ["pilot", "airline pilot", "flight attendant", "aircraft mechanic", "aviation maintenance", "air traffic controller", "aviation"],
    competencies: ["safety", "crew_resource_management", "judgment", "communication"],
    questions: [
      "Tell me about an aviation situation where conditions changed and you had to reassess the plan while maintaining safety margins.",
      "Describe a time clear crew or operational communication prevented confusion or reduced risk.",
      "Give me an example of identifying a maintenance, procedure, weather, passenger, or operational concern and how you handled it.",
    ],
  },
  executive_leadership: {
    family: "management",
    keywords: ["chief executive", "ceo", "chief operating officer", "coo", "chief technology officer", "cto", "vice president", "vp", "executive director", "general manager"],
    competencies: ["strategy", "leadership", "decision_making", "accountability"],
    questions: [
      "Tell me about a consequential decision you made when the available options all had meaningful downside risk.",
      "Describe a strategy or organizational change that initially faced resistance. How did you create alignment and accountability?",
      "Give me an example of a result that required you to change priorities, structure, investment, or leadership approach based on evidence.",
    ],
  },
};

export const PROFESSION_BANK_METADATA = {
  methodology: "competency-based behavioral and situational prompts",
  coverage_strategy: "profession specialty -> career family -> job description -> exact role fallback",
  source_frameworks: [
    "O*NET-SOC occupational taxonomy and content model",
    "U.S. Office of Personnel Management structured interview guidance",
  ],
};
