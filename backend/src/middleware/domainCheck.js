const ALLOWED_DOMAINS = ['college.edu', 'university.ac.in'];

function domainCheck(email) {
    const domain = email.split('@')[1];
    return ALLOWED_DOMAINS.includes(domain);
}

module.exports = { domainCheck, ALLOWED_DOMAINS };
