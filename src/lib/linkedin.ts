/**
 * LinkedIn-specific constants shared between the editor, preview, and meters.
 * Numbers here are approximations based on observed LinkedIn behavior; tweak
 * over time if their UI changes.
 */

/** Max characters LinkedIn accepts in a single post. */
export const CHAR_LIMIT = 3000;

/** Warn threshold — flips the counter color near the cap. */
export const CHAR_WARN_AT = Math.floor(CHAR_LIMIT * 0.9);

/**
 * Roughly where LinkedIn collapses the post behind a "see more" link on the
 * mobile feed. The real cutoff varies with viewport width and emoji width;
 * this is a sensible default that errs on "show the user the worst case."
 */
export const FOLD_THRESHOLD = 210;
