"""Document this first-party Python module."""
from __future__ import annotations

# Extra domain prompts layered on top of the 12-question base bank.
# The goal is depth without a paid model call: each career receives a large,
# deterministic question bank that can be rotated across practice sessions.

FAMILY_DEEP_SCENARIOS = {
    "customer-contact-center": [
        "de-escalated an angry caller while keeping the conversation productive",
        "balanced call quality with handle-time or productivity expectations",
        "resolved an issue on the first contact without creating downstream work",
        "decided when to escalate a customer issue instead of continuing to troubleshoot",
        "handled back-to-back difficult contacts while keeping your tone professional",
        "used a CRM or case-management system to document a customer interaction accurately",
        "responded to coaching or a quality-assurance score and improved your performance",
        "protected sensitive customer information during a phone, chat, or account interaction",
        "handled a customer who repeatedly interrupted or refused the available options",
        "managed a queue or unusually high contact volume without sacrificing accuracy",
        "recognized an opportunity to retain a customer or prevent cancellation",
        "explained a policy the customer disliked while still preserving trust",
    ],
    "data-ai": [
        "wrote or debugged a query that produced an unexpected result",
        "reconciled two data sources that disagreed",
        "validated a metric before stakeholders used it for a decision",
        "handled missing, duplicated, or malformed data",
        "chose the right visualization for a difficult analytical message",
        "challenged a misleading KPI or dashboard interpretation",
        "translated an ambiguous stakeholder question into measurable analysis",
        "explained uncertainty, limitations, or statistical caveats clearly",
        "found an insight that changed the direction of a project or decision",
        "improved a recurring report, dashboard, or data workflow",
        "prioritized speed versus analytical rigor under a deadline",
        "reviewed someone else's analysis and caught a material issue",
    ],
    "business-finance": [
        "identified a risk before it became a larger problem",
        "assessed the likelihood and impact of a business or operational risk",
        "evaluated whether a control was actually effective",
        "challenged a stakeholder's risk assumption using evidence",
        "communicated a risk that leadership did not initially want to hear",
        "worked with incomplete information to make a defensible recommendation",
        "investigated a variance, discrepancy, or unusual financial pattern",
        "balanced business objectives with control, compliance, or risk requirements",
        "tracked remediation after a risk or control issue was identified",
        "used a KRI, KPI, trend, or threshold to detect a problem",
        "documented analysis so another reviewer could reproduce your reasoning",
        "presented technical financial or risk information to a nontechnical audience",
    ],
    "software-platform": [
        "diagnosed a production issue when the first hypothesis was wrong",
        "handled a deployment or release that did not go as planned",
        "improved observability so a future incident would be easier to diagnose",
        "made a build-versus-buy or architecture tradeoff",
        "reduced toil through automation while keeping a safe rollback path",
        "improved reliability without creating unnecessary complexity",
        "investigated performance degradation across multiple system layers",
        "worked through a dependency owned by another team",
        "reviewed a technical change and caught a meaningful risk",
        "made a difficult decision during an outage or production incident",
        "improved a developer workflow, CI/CD pipeline, or operational process",
        "explained a technical incident to a nontechnical stakeholder",
    ],
    "healthcare": [
        "noticed a change in a patient's condition and decided what to do next",
        "handled competing patient needs during a busy shift",
        "communicated a safety concern to another clinician",
        "responded to a patient or family member who was upset or frightened",
        "prevented a documentation, medication, or handoff error",
        "adapted care or communication for a patient's individual needs",
        "worked through disagreement within the care team",
        "maintained patient privacy in a difficult situation",
        "educated a patient or caregiver and confirmed understanding",
        "prioritized tasks when everything seemed urgent",
        "recognized when a situation exceeded your scope and escalated appropriately",
        "improved a process that affected patient safety or experience",
    ],
    "healthcare-clinical": [
        "recognized a clinical or safety change that required escalation",
        "handled a difficult patient interaction while preserving dignity",
        "prioritized care when several tasks became urgent at once",
        "followed a protocol while adapting to an unexpected situation",
        "communicated critical information during a handoff",
        "prevented an error through a safety check",
        "worked effectively with nurses, physicians, technicians, or support staff",
        "maintained accurate documentation under time pressure",
        "responded to feedback about your clinical technique or workflow",
        "protected confidentiality in a busy care environment",
        "explained a procedure or next step to a patient in plain language",
        "recognized when to stop and ask for help",
    ],
    "warehouse-logistics": [
        "handled an inventory discrepancy or missing shipment",
        "worked safely while productivity pressure was high",
        "prevented a picking, packing, receiving, or shipping error",
        "prioritized urgent orders when capacity was limited",
        "resolved a problem involving a carrier, vendor, or internal team",
        "improved inventory accuracy or location discipline",
        "handled equipment or system downtime without losing control of the workflow",
        "responded to a safety hazard on the floor",
        "trained or helped a teammate follow a process correctly",
        "managed a peak-volume period",
        "investigated the root cause of repeated fulfillment errors",
        "used data or counts to improve a warehouse or logistics process",
    ],
    "retail-service": [
        "handled an upset customer while protecting company policy",
        "managed a long line or rush while keeping service accurate",
        "prevented or corrected an inventory or cash-handling error",
        "recommended a product or solution based on a customer's actual need",
        "handled conflicting priorities between customers, stocking, and operations",
        "responded to suspected theft or a safety concern appropriately",
        "helped a teammate during a difficult shift",
        "learned a new product line, promotion, or system quickly",
        "recovered a poor customer experience",
        "maintained standards when staffing was short",
        "used feedback or sales results to improve your approach",
        "handled a return, complaint, or policy exception professionally",
    ],
    "hospitality-food": [
        "recovered a guest experience after something went wrong",
        "handled a rush while maintaining quality and accuracy",
        "managed an allergy, food-safety, or guest-safety concern",
        "worked through a mistake in an order, reservation, or room assignment",
        "handled a demanding guest professionally",
        "coordinated closely with front-of-house and back-of-house teammates",
        "prioritized several guests or tasks at the same time",
        "responded when staffing or supplies were unexpectedly limited",
        "maintained cleanliness or quality standards under pressure",
        "used guest feedback to improve service",
        "handled a payment, billing, or reservation discrepancy",
        "supported a teammate during a high-volume shift",
    ],
}

ROLE_SPECIFIC_TEMPLATES = [
    ("role-knowledge", "What does excellent performance look like for a {role}, and which measures or outcomes matter most?"),
    ("role-knowledge", "What are the most common mistakes a new {role} makes, and how do you avoid them?"),
    ("situational", "Imagine you are working as a {role} and two urgent priorities arrive at the same time. How would you decide what comes first?"),
    ("situational", "As a {role}, what would you do if you noticed a problem that was outside your direct responsibility but could affect the outcome?"),
    ("quality", "How do you check the quality and accuracy of your work as a {role} before you consider a task complete?"),
    ("communication", "Who does a {role} need to communicate with most effectively, and how do you adapt your communication for different audiences?"),
    ("problem-solving", "Walk me through how you would investigate an unfamiliar problem in a {role} position when the cause is not obvious."),
    ("prioritization", "How would you organize a very busy day as a {role} when several deadlines or people need your attention?"),
    ("learning", "Which knowledge, tools, systems, or procedures are most important for a {role} to keep current, and how do you stay sharp?"),
    ("ethics", "Describe an ethical, privacy, safety, or compliance issue a {role} might face. How would you handle it?"),
    ("teamwork", "Describe how a strong {role} contributes to the wider team beyond completing assigned tasks."),
    ("ownership", "Tell me about a time you took ownership of work closely related to a {role} even though nobody explicitly told you to do so."),
    ("customer-stakeholder", "What is the most difficult customer, client, patient, student, user, or stakeholder situation a {role} might encounter, and how would you approach it?"),
    ("improvement", "If you joined a team as a {role} and saw an inefficient process, how would you decide whether and how to improve it?"),
    ("judgment", "Tell me about a decision relevant to a {role} where there was no perfect option. How did you choose?"),
    ("feedback", "Tell me about feedback that changed how you perform work relevant to a {role}. What did you do differently afterward?"),
    ("conflict", "Describe a disagreement with a coworker or stakeholder that could realistically happen to a {role}. How would you resolve it?"),
    ("adaptability", "Tell me about a time priorities, tools, policies, or requirements changed suddenly. How did you adapt?"),
    ("impact", "What accomplishment best proves you can create meaningful impact as a {role}, and how do you know it mattered?"),
    ("stretch", "What is one complex situation that would challenge an experienced {role}, and how would you reason through it?"),
    ("leadership", "Even without a management title, how can a {role} demonstrate leadership? Give a real example if you have one."),
    ("failure", "Tell me about a time work relevant to a {role} did not go as planned. What did you change afterward?"),
    ("process", "Describe a repeatable process you use to stay organized and reliable in work like a {role}."),
    ("stakeholder", "How would you handle a stakeholder who wants a faster answer than you can responsibly provide as a {role}?"),
]


def expanded_question_specs(role: str, family: str) -> list[tuple[str, str, str, list[str], str]]:
    """Return 36 additional questions so every career reaches 48 total."""
    specs: list[tuple[str, str, str, list[str], str]] = []
    deep = FAMILY_DEEP_SCENARIOS.get(family, [])
    for index, scenario in enumerate(deep[:12], start=1):
        specs.append((
            f"domain-{index:02d}",
            f"Tell me about a time you {scenario}. What did you personally do, and what was the outcome?",
            "domain",
            ["role-knowledge", "ownership", "judgment", "impact"],
            "standard" if index <= 8 else "stretch",
        ))

    # Fill the remaining slots with role-aware prompts. For families with no custom
    # deep scenarios, this supplies the full 36-question expansion.
    needed = 36 - len(specs)
    templates = ROLE_SPECIFIC_TEMPLATES
    cycle = 0
    while needed > 0:
        for template_index, (category, template) in enumerate(templates, start=1):
            if needed <= 0:
                break
            cycle += 1
            text = template.format(role=role)
            if cycle > len(templates):
                text = f"For a {role} interview, {text[0].lower()}{text[1:]} Focus on a different example than you used earlier."
            specs.append((
                f"role-{cycle:02d}",
                text,
                category,
                ["role-alignment", "communication", "judgment"],
                "stretch" if category in {"stretch", "judgment", "leadership"} else "standard",
            ))
            needed -= 1
    return specs
