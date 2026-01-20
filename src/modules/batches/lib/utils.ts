import { Injectable } from "@nestjs/common";

@Injectable()
export class EmailPromptService {
  buildNormalizeLeadsEmailsPrompt(
    leads: { leadId: string; emails: string[] }[],
  ): string {
    return `
SYSTEM ROLE:
You are a strict email normalization engine.

GLOBAL RULES:
- Process ALL leads in a single pass.
- Each lead has its own leadId and email list.
- NEVER mix emails between leads.
- Keep the leadId EXACTLY as provided.
- Be precise and conservative.

EMAIL NORMALIZATION RULES:
- Convert all emails to lowercase.
- Remove duplicates per lead.
- DO NOT invent emails.
- DO NOT explain anything.

PREFIX CLEANING RULES (CRITICAL):
- If the local-part of an email starts with a LONG numeric prefix
  (e.g. 11111, 999999, 123456),
  REMOVE ONLY the numeric prefix.
- Keep the rest of the local-part intact.
- Example:
  - 111111forwarding@pro.houzz.com → forwarding@pro.houzz.com
  - 9999info@domain.com → info@domain.com
- Do NOT remove letters or words after the numbers.
- Do NOT discard the email if it becomes valid after cleaning.

EMAIL VALIDATION RULES:
- After cleaning, keep the email ONLY if it matches a valid email format.
- If cleaning results in an invalid email, discard it.
- Fix ONLY obvious corruptions:
  - (at) → @
  - [at] → @
  - spaces around @ or .

OUTPUT FORMAT (MANDATORY):
Return ONLY valid JSON in this exact format:

{
  "leads": [
    {
      "leadId": "string",
      "emails": ["string"]
    }
  ]
}

If a lead has no valid emails, return an empty array for that lead.

INPUT LEADS:
${JSON.stringify(leads, null, 2)}
`;
  }
}
