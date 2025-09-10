module.exports = {
  root: true,
  extends: [
    'react-app',
    'react-app/jest',
    'prettier',
  ],
  plugins: [
    'simple-import-sort',
    'import',
  ],
  rules: {
    // Сортировка и группировка импортов simple-import-sort
    'simple-import-sort/imports': ['error', {
      groups: [
        // 1. Сайд-эффектные импорты (включая CSS сбросы и пр.)
        ['^\\u0000'],

        // 2. Node builtin (на фронте редко, но правило общее)
        ['^node:(.*)$'],

        // 3. React, ключевые внешние библиотеки
        ['^react$', '^react-dom$', '^react-router(-dom)?$', '^antd$', '^@ant-design/(.*)$'],

        // 4. Прочие внешние зависимости
        ['^@?\\w'],

        // 5. Абсолютные алиасы проекта (если появятся)
        ['^@/'],

        // 6. Относительные импорты: родительские и соседние
        ['^\.\.(?!/?$)', '^\.\./?$', '^\./(?=.*/)(?!/?$)', '^\.(?!/?$)', '^\./?$'],

        // 7. Стили и ассеты в самом конце
        ['.*\\.(css|scss|sass|less|svg|png|jpg|jpeg|gif)$'],
      ],
    }],

    // Упорядочивание экспортов (если где-то есть barrel файлы)
    'simple-import-sort/exports': 'error',

    // Дубликаты импортов и небольшие улучшения
    'import/no-duplicates': 'error',
    'import/first': 'error',
    'import/newline-after-import': ['error', { count: 1 }],
  },
};


