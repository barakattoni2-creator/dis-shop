#!/usr/bin/env node
// Usage: node scripts/hash-password.js "your-chosen-password"
// Prints a bcrypt hash to paste into ADMIN_PASSWORD_HASH in .env.local
const bcrypt = require("bcryptjs");

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.js "your-chosen-password"');
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  console.log(hash);
});
