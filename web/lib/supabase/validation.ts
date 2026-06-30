// SkillGig.id — zod-free input validation for server actions.
// Keeps each action's schema next to its consumer without pulling in zod.

/**
 * P2-B apply flow: cover_letter only. Min 50 characters.
 * gigId is required as a non-empty UUID-shaped string.
 */
export const COVER_LETTER_MIN = 50;

export type ApplyInput = {
  gigId: string;
  coverLetter: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ValidationOk<T> = { success: true; data: T };
type ValidationErr = { success: false; error: string };
type ValidationResult<T> = ValidationOk<T> | ValidationErr;

export function applyToGigSchema(input: ApplyInput): ValidationResult<ApplyInput> {
  const gigId = (input.gigId ?? '').trim();
  const coverLetter = (input.coverLetter ?? '').trim();

  if (!UUID_RE.test(gigId)) {
    return { success: false, error: 'Gig ID tidak valid.' };
  }
  if (coverLetter.length < COVER_LETTER_MIN) {
    return { success: false, error: `Cover letter minimal ${COVER_LETTER_MIN} karakter.` };
  }
  return { success: true, data: { gigId, coverLetter } };
}
