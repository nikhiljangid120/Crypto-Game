// verify.js
const crypto = require('crypto');
const seed = "<seed_from_round_crash>";
console.log(crypto.createHash('sha256').update(seed).digest('hex'));