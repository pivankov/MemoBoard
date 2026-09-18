/**
 * Консольная утилита для управления ролью и статусом пользователя.
 *
 * Использование:
 *   node scripts/set-role.js <email> <field> <value>
 *
 * Примеры:
 *   node scripts/set-role.js user@example.com role admin
 *   node scripts/set-role.js user@example.com role user
 *   node scripts/set-role.js user@example.com status blocked
 *   node scripts/set-role.js user@example.com status active
 */

import { db } from '../db/initdb.js';

const ALLOWED_FIELDS = {
  role:   ['user', 'admin'],
  status: ['active', 'blocked'],
};

function printUsage() {
  console.log('Использование: node scripts/set-role.js <email> <field> <value>');
  console.log('');
  console.log('Поля и допустимые значения:');
  for (const [field, values] of Object.entries(ALLOWED_FIELDS)) {
    console.log(`  ${field}: ${values.join(', ')}`);
  }
  console.log('');
  console.log('Примеры:');
  console.log('  node scripts/set-role.js user@example.com role admin');
  console.log('  node scripts/set-role.js user@example.com status blocked');
}

const [,, email, field, value] = process.argv;

if (!email || !field || !value) {
  console.error('Ошибка: не указаны все аргументы.\n');
  printUsage();
  process.exit(1);
}

if (!ALLOWED_FIELDS[field]) {
  console.error(`Ошибка: недопустимое поле "${field}". Допустимые: ${Object.keys(ALLOWED_FIELDS).join(', ')}.`);
  process.exit(1);
}

if (!ALLOWED_FIELDS[field].includes(value)) {
  console.error(`Ошибка: недопустимое значение "${value}" для поля "${field}". Допустимые: ${ALLOWED_FIELDS[field].join(', ')}.`);
  process.exit(1);
}

const user = db.prepare('SELECT id, email, role, status FROM users WHERE email = ? LIMIT 1').get(email);

if (!user) {
  console.error(`Ошибка: пользователь с email "${email}" не найден.`);
  process.exit(1);
}

const currentValue = user[field];
if (currentValue === value) {
  console.log(`Пользователь ${email}: поле "${field}" уже имеет значение "${value}". Изменений нет.`);
  process.exit(0);
}

db.prepare(`UPDATE users SET ${field} = ? WHERE id = ?`).run(value, user.id);

console.log(`Готово: пользователь ${email} — поле "${field}" изменено с "${currentValue}" на "${value}".`);
