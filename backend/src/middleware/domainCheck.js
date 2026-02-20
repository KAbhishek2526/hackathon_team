/**
 * College email domain check.
 * Accepts any email ending in:
 *   .edu          — US/international university standard
 *   .ac.in        — Indian university standard
 *   .edu.in       — Indian university variant
 *   .ac.uk        — UK university standard
 *   .ac.nz        — NZ university standard
 *   .edu.au       — Australian university standard
 *
 * Also still accepts the original exact-match whitelist for demo accounts.
 */

const EXACT_WHITELIST = ['college.edu', 'university.ac.in'];

const COLLEGE_SUFFIXES = ['.edu', '.ac.in', '.edu.in', '.ac.uk', '.ac.nz', '.edu.au'];

function domainCheck(email) {
    if (!email || !email.includes('@')) return false;
    const domain = email.split('@')[1].toLowerCase();

    // Allow hardcoded demo domains
    if (EXACT_WHITELIST.includes(domain)) return true;

    // Allow any domain that ends with a recognised college TLD/suffix
    return COLLEGE_SUFFIXES.some((suffix) => domain.endsWith(suffix));
}

module.exports = { domainCheck, COLLEGE_SUFFIXES };
