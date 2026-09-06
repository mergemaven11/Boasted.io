import ResumeImportConfirmationV2 from "./ResumeImportConfirmationV2.jsx";

function derivedParseQuality({ draft, warnings = [], sections = {} }) {
  const roles = draft?.experience || [];
  const completeRoles = roles.filter((role) => role.company && role.title && (role.dates_raw || role.start_date)).length;
  const contact = draft?.contact || {};
  const contactFields = ["name", "email", "phone", "location", "linkedin", "github"].filter((key) => contact[key]).length;
  const recognizedSections = Object.values(sections || {}).filter((value) => Array.isArray(value) && value.length).length;
  const score = Math.max(0, Math.min(100, Math.round(
    (roles.length ? (completeRoles / roles.length) * 55 : recognizedSections ? 35 : 10)
    + Math.min(18, contactFields * 3)
    + Math.min(18, recognizedSections * 3)
    - Math.min(20, warnings.length * 4)
  )));
  return {
    score,
    role_count: roles.length,
    complete_role_count: completeRoles,
    contact_field_count: contactFields,
    recognized_section_count: recognizedSections,
    warning_count: warnings.length,
  };
}

export default function ResumeImportConfirmation(props) {
  try {
    sessionStorage.setItem("boasted_resume_supporting_sections_v1", JSON.stringify(props.sections || {}));
  } catch {
    // Saving still works with the fields explicitly provided by the parent.
  }
  return <ResumeImportConfirmationV2 {...props} parseQuality={derivedParseQuality(props)} />;
}
