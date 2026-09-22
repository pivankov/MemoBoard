import SingleColumnLayout from "layouts/SingleColumnLayout";

import { PAGE_TITLE_SUFFIX } from 'constants/strings';

import './HomePage.css';

function HomePage() {
  return (
    <>
      <title>{`Главная ${PAGE_TITLE_SUFFIX}`}</title>
    
      <SingleColumnLayout>
        <div className="home-page">
          <div className="home-page__header">
            <h1>Добро пожаловать в MemoBoard</h1>
            <p>MemoBoard — ваш личный помощник для важных дат и полезных ссылок в одном месте.</p>
          </div>

          <h3>📅 Календарь событий</h3>
          <ul>
            <li>Дни рождения, праздники и другие важные даты</li>
            <li>Разовые, ежемесячные и ежегодные напоминания</li>
            <li>Удобная группировка по месяцам</li>
            <li>Обзор недавних и просроченных событий</li>
          </ul>

          <h3>🔖 Закладки</h3>
          <ul>
            <li>Сохраняйте полезные ссылки с описанием</li>
            <li>Организуйте по категориям и тегам</li>
            <li>Восстанавливайте удалённое из корзины</li>
            <li>Смотрите превью страниц</li>
          </ul>

          <h3 className="mt-10">🆕 Что нового</h3>

          <div className="changelog">
            <div className="changelog__item">
              <div className="changelog__date">Сентябрь 2026</div>
              <ul>
                <li>Запуск проекта MemoBoard</li>
                <li>Расширение для браузера — сохраняйте закладки прямо со страниц</li>
                <li>Обновлённый дизайн страниц входа и регистрации</li>
              </ul>
            </div>

            <div className="changelog__item">
              <div className="changelog__date">Май — Июль 2026</div>
              <ul>
                <li>Административный раздел для управления пользователями</li>
                <li>Повышение стабильности интерфейса</li>
              </ul>
            </div>

            <div className="changelog__item">
              <div className="changelog__date">Апрель 2026</div>
              <ul>
                <li>Регистрация и вход по email и паролю</li>
                <li>Доступ к разделам только для авторизованных пользователей</li>
                <li>Безопасная сессия с автоматическим продлением</li>
                <li>Защита от подделки запросов (CSRF)</li>
                <li>Роли пользователей: обычный и администратор</li>
              </ul>
            </div>

            <div className="changelog__item">
              <div className="changelog__date">Февраль — Март 2026</div>
              <ul>
                <li>Корзина для закладок с возможностью восстановления</li>
                <li>Превью изображений для сохранённых ссылок</li>
                <li>Перемещение закладок между категориями</li>
                <li>Изменение порядка категорий</li>
              </ul>
            </div>

            <div className="changelog__item">
              <div className="changelog__date">Декабрь 2025</div>
              <ul>
                <li>Редактирование закладок</li>
                <li>Избранное — закрепляйте важные ссылки</li>
                <li>Управление категориями и тегами</li>
                <li>Диалоговые окна создания и удаления</li>
                <li>Страница «404 — не найдено»</li>
              </ul>
            </div>

            <div className="changelog__item">
              <div className="changelog__date">Октябрь — Ноябрь 2025</div>
              <ul>
                <li>Новый раздел «Закладки»</li>
                <li>Категории и теги для организации ссылок</li>
                <li>Фильтрация закладок по тегам</li>
                <li>Набор иконок для интерфейса</li>
              </ul>
            </div>

            <div className="changelog__item">
              <div className="changelog__date">Сентябрь 2025</div>
              <ul>
                <li>Старт проекта MemoBoard</li>
                <li>Раздел «События»: добавление, редактирование, удаление</li>
                <li>Группировка событий по месяцам</li>
                <li>Типы событий: праздники, дни рождения, повторяющиеся</li>
                <li>Отслеживание просроченных событий и счётчик</li>
                <li>Уведомления о действиях</li>
              </ul>
            </div>
          </div>
        </div>      
      </SingleColumnLayout>
    </>
  );
}

export default HomePage;
