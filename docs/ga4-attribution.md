# GA4 attribution setup

Boasted sends privacy-minimized campaign attribution on core funnel events. The code captures current-session `utm_*` values and preserves original acquisition values as `first_utm_*` event parameters.

## Core tracked events

- `sign_up`
- `accomplishment_created`
- `impact_receipt_created`

## Register first-touch attribution in GA4

In Google Analytics, open **Admin → Data display → Custom definitions → Custom dimensions → Create custom dimension**.

Create each item below with **Scope = Event**.

| Dimension name | Event parameter | Description |
| --- | --- | --- |
| First UTM Source | `first_utm_source` | Original campaign source that first brought the visitor to Boasted. |
| First UTM Medium | `first_utm_medium` | Original campaign medium. |
| First UTM Campaign | `first_utm_campaign` | Original campaign name. |
| First UTM Campaign ID | `first_utm_id` | Original campaign ID, when supplied. |
| First UTM Source Platform | `first_utm_source_platform` | Original source platform, when supplied. |
| First UTM Term | `first_utm_term` | Original campaign term, when supplied. |
| First UTM Content | `first_utm_content` | Original campaign content variant, when supplied. |
| First UTM Creative Format | `first_utm_creative_format` | Original creative format, when supplied. |
| First UTM Marketing Tactic | `first_utm_marketing_tactic` | Original marketing tactic, when supplied. |

Do not rename the **Event parameter** values. The display names can be changed later in GA4, but the parameter mapping is the contract with the frontend instrumentation.

## Recommended campaign convention

Example LinkedIn founder-launch URL:

```text
https://boasted.io/?utm_source=linkedin&utm_medium=organic_social&utm_campaign=beta_launch&utm_content=founder_post
```

Use stable lowercase values where possible so reporting does not fragment (`linkedin` vs `LinkedIn`, `organic_social` vs `social-organic`).

## Privacy guardrails

Boasted only reads the explicit UTM allowlist. It does not intentionally send email addresses, names, accomplishment text, evidence content, or arbitrary query-string values to GA4. Keep campaign tags free of personal information.

## Reporting

After GA4 has collected the parameters and the custom dimensions have been registered, allow approximately 24–48 hours for them to become available in reports and explorations.
