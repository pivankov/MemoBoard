/**
 * Консольная утилита для смены пароля пользователя.
 *
 * Использование:
 *   node scripts/set-password.js <email> <new-password>
 *
 * Пример:
 *   node scripts/set-password.js user@example.com 'NewStrongPassword123'
 */

import argon2 from 'argon2';
import { db } from '../db/initdb.js';

const MIN_PASSWORD_LENGTH = 8;

function printUsage() {
  console.log('Использование: node scripts/set-password.js <email> <new-password>');
  console.log('');
  console.log('Пароль сохраняется в БД в виде argon2-хеша.');
  console.log('');
  console.log('Пример:');
  console.log('  node scripts/set-password.js user@example.com "NewStrongPassword123"');
}

const [,, email, newPassword] = process.argv;

if (!email || !newPassword) {
  console.error('Ошибка: не указаны email или новый пароль.\n');
  printUsage();
  process.exit(1);
}

if (newPassword.length < MIN_PASSWORD_LENGTH) {
  console.error(`Ошибка: пароль должен содержать не менее ${MIN_PASSWORD_LENGTH} символов.`);
  process.exit(1);
}

async function main() {
  const user = db
    .prepare('SELECT id, email FROM users WHERE email = ? LIMIT 1')
    .get(email);

  if (!user) {
    console.error(`Ошибка: пользователь с email "${email}" не найден.`);
    process.exit(1);
  }

  const passwordHash = await argon2.hash(newPassword);

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
    passwordHash,
    user.id
  );

  console.log(`Готово: для пользователя ${email} установлен новый пароль.`);
}

main().catch((error) => {
  console.error(`Ошибка при смене пароля: ${error.message}`);
  process.exit(1);
});