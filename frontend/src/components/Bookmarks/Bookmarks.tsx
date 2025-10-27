import TwoColumnLayout from "layouts/TwoColumnLayout";

import BookmarksList from "./BookmarksList";

const API_RESPONCE = {
  status: 200,
  data: [
    {
        id: "dSMicJ",
        categoryId: "ktGDhX",
        title: "Полный гайд на Резюме в IT - Как Правильно составить резюме программисту?",
        url: "https://www.youtube.com/watch?v=mU-MghntMxg",
        description: "Enjoy the videos and music that you love, upload original content and share it all with friends, family and the world on YouTube.",
        tags: [],
        preview: "",
        createdAt: "2025-06-30 02:38:20",
        updatedAt: "2025-06-30 02:38:27",
        transitionCounter: 1,
        isFavorite: false
    },
    {
        id: "UIje1I",
        categoryId: "ktGDhX",
        title: " Nest + Typia = Nestia. Доминация Typescript",
        url: "https://www.youtube.com/watch?v=eAFq35Z6z5I",
        description: "Enjoy the videos and music that you love, upload original content and share it all with friends, family and the world on YouTube.",
        tags: [],
        preview: "",
        createdAt: "2025-06-30 02:37:45",
        updatedAt: "2025-06-30 02:38:00",
        transitionCounter: 1,
        isFavorite: false
    },
    {
        id: "qRN4eu",
        categoryId: "ktGDhX",
        title: "\"Star Rail LIVE 2025\" Concert Full Recording | Honkai: Star Rail - YouTube",
        url: "https://www.youtube.com/watch?v=FAckVYINs8E",
        description: "The Official Recording of \"Star Rail LIVE\" Honkai: Star Rail Concert 2025 is Online — The Cosmos Resonates for You!Attention, passengers, the Express is abou...",
        tags: [],
        preview: "https://i.ytimg.com/vi/FAckVYINs8E/maxresdefault.jpg",
        createdAt: "2025-05-04 21:51:58",
        updatedAt: "2025-05-04 21:52:00",
        transitionCounter: null,
        isFavorite: false
    },
    {
        id: "NUjbfo",
        categoryId: "ktGDhX",
        title: "Lenovo Legion Y700 Как настроить планшет , установить русский язык , удалить китайские приложения - YouTube",
        url: "https://www.youtube.com/watch?v=EsyqqjnwOws",
        description: "Lenovo Legion Y700 Китайская версия с китайской оригинальной прошивкой с русским языком .Настрока планшета,установка русского языка,удаление китайских прилож...",
        tags: [],
        preview: "https://i.ytimg.com/vi/EsyqqjnwOws/maxresdefault.jpg?sqp=-oaymwEmCIAKENAF8quKqQMa8AEB-AH-CYAC0AWKAgwIABABGFcgWChlMA8=&rs=AOn4CLBUFjk2kmMryRmpuJJJ90k721l0HQ",
        createdAt: "2025-03-14 13:51:00",
        updatedAt: "2025-03-14 13:51:03",
        transitionCounter: 2,
        isFavorite: false
    },
    {
        id: "pIDIZR",
        categoryId: "ktGDhX",
        title: "Дмитрий Лаврик - YouTube",
        url: "https://www.youtube.com/@dmitrylavrik/videos",
        description: "Полезные материалы по программированию и веб-разработке",
        tags: [],
        preview: "https://yt3.googleusercontent.com/ytc/AIdro_kSO4ok-Ezl1xicKfrqMmRiKCuw_fg8cvpIO2LAXggJox4=s900-c-k-c0x00ffffff-no-rj",
        createdAt: "2025-03-07 19:02:06",
        updatedAt: "2025-03-07 19:02:10",
        transitionCounter: null,
        isFavorite: false
    },
    {
        id: "tqGXiv",
        categoryId: "ktGDhX",
        title: "Введение в Node.js. Часть 1. Знакомство с языком - YouTube",
        url: "https://www.youtube.com/watch?v=kkU_Lk8kdms",
        description: "- общие концепция Node- однопоточный или нет, идея event loop- ключевые отличия от Node от PHP- hello world server- почему сейчас я всё чаще выбираю node для...",
        tags: [],
        preview: "https://i.ytimg.com/vi/kkU_Lk8kdms/maxresdefault.jpg",
        createdAt: "2025-01-14 18:05:59",
        updatedAt: "2025-01-14 18:06:01",
        transitionCounter: null,
        isFavorite: false
    },
    {
        id: "5kvx9r",
        categoryId: "ktGDhX",
        title: "Ошибки приготовления кофе в воронке | Hario v60",
        url: "https://www.youtube.com/watch?v=VJ07UreDgII",
        description: "В этом видео наш оператор и арт-директор Федор впервые готовит кофе в воронке! \n\nИспользуя классику альтернативы — Hario v60, он попробует приготовить напиток по своему рецепту, а если что-то пойдёт не так, Николай внесёт свои корректировки. Или не внесёт?",
        tags: [
            "ymCVP"
        ],
        preview: "",
        createdAt: "2024-12-15 16:50:21",
        updatedAt: "2024-12-15 16:50:49",
        transitionCounter: null,
        isFavorite: false
    },
    {
        id: "hiqXlv",
        categoryId: "ktGDhX",
        title: "BMW k1600gtl полезный и бесполезный тюнинг - YouTube",
        url: "https://www.youtube.com/watch?v=U2oHuW47O8I",
        description: "Всем привет, в сегодняшнем видео я решил рассказать про доработки, которые планирую произвести к сезону со своим мотоциклом BMW k1600gtl. Также будет актуаль...",
        tags: [],
        preview: "https://i.ytimg.com/vi/U2oHuW47O8I/maxresdefault.jpg",
        createdAt: "2024-12-02 15:21:44",
        updatedAt: null,
        transitionCounter: null,
        isFavorite: false
    },
    {
        id: "WEhe8e",
        categoryId: "ktGDhX",
        title: "Будущие работы: какие навыки будут востребованы - YouTube",
        url: "https://www.youtube.com/watch?v=3N-cOhvR5Ro",
        description: "Программа для тех, кто хочет стать востребованным программистом: https://bit.ly/3w46rv5Закрытое сообщество единомышленников: https://t.me/NextgenSocialBotМой...",
        tags: [],
        preview: "https://i.ytimg.com/vi/3N-cOhvR5Ro/maxresdefault.jpg",
        createdAt: "2024-12-02 15:21:34",
        updatedAt: null,
        transitionCounter: 1,
        isFavorite: false
    },
    {
        id: "vdzTF8",
        categoryId: "ktGDhX",
        title: "По ту сторону изгороди (мультсериал, 2014) – смотреть онлайн все 10 видео от По ту сторону изгороди (мультсериал, 2014) в хорошем качестве на RUTUBE",
        url: "https://rutube.ru/plst/328979/",
        description: "Смотреть видеоподборку По ту сторону изгороди (мультсериал, 2014) канала  в хорошем качестве без регистрации и совершенно бесплатно на RUTUBE пользователя По ту сторону изгороди (мультсериал, 2014) (328979).",
        tags: [],
        preview: "https://pic.rutubelist.ru/video/1b/42/1b42df069c5e871abfa2ccc7e9e4e02f.jpg",
        createdAt: "2024-11-05 12:24:03",
        updatedAt: "2024-11-05 12:24:07",
        transitionCounter: null,
        isFavorite: false
    },
    {
        id: "kv4hrR",
        categoryId: "ktGDhX",
        title: "ИИ Спасение Или Трагедия Для Человека? Ольга Ускова.",
        url: "https://www.youtube.com/watch?v=F8eZKKQFTZM",
        description: "",
        tags: [],
        preview: "",
        createdAt: "2024-10-16 00:11:04",
        updatedAt: "2024-10-16 00:11:13",
        transitionCounter: null,
        isFavorite: false
    },
    {
        id: "snr8n6",
        categoryId: "ktGDhX",
        title: "Установка на Smart TV – Telegraph",
        url: "https://telegra.ph/Ustanovka-na-Smart-TV-09-25",
        description: "",
        tags: [],
        preview: "",
        createdAt: "2024-08-30 18:48:56",
        updatedAt: "2024-08-30 18:48:59",
        transitionCounter: 3,
        isFavorite: false
    },
    {
        id: "Pf902Q",
        categoryId: "ktGDhX",
        title: "FAQ по приложению для Android и Android TV (12.07.2024)",
        url: "https://kpdl.cc/faq.html",
        description: "",
        tags: [],
        preview: "",
        createdAt: "2024-08-30 18:43:51",
        updatedAt: "2024-08-30 18:43:59",
        transitionCounter: null,
        isFavorite: false
    },
    {
        id: "3UXxE5",
        categoryId: "ktGDhX",
        title: "Приложение для Smart TV — Teletype",
        url: "https://teletype.in/@puh.i.toska/all",
        description: "Инструкция по установке приложения через Media station x (для всех Smart TV, вне зависимости от производителя)",
        tags: [],
        preview: "https://img4.teletype.in/files/b0/49/b049881c-2e7d-4e39-b4ce-b5ca40449dbd.png",
        createdAt: "2024-08-30 18:41:56",
        updatedAt: "2024-08-30 18:41:59",
        transitionCounter: 2,
        isFavorite: false
    },
    {
        id: "mzy2eY",
        categoryId: "ktGDhX",
        title: "Закреп КИНОПАБ",
        url: "https://t.me/c/1904043486/49/37208",
        description: "",
        tags: [],
        preview: "",
        createdAt: "2024-08-30 18:33:30",
        updatedAt: "2024-08-30 18:33:40",
        transitionCounter: 2,
        isFavorite: false
    },
    {
        id: "oIBRx4",
        categoryId: "ktGDhX",
        title: "ЖИЗНЬ И СМЕРТЬ. ЛЮБОВЬ И СТРАХ - YouTube",
        url: "https://www.youtube.com/watch?v=a7Fwfd_Ft1M",
        description: "Большая встреча и серьёзный разговор о том, что такое любовь, почему она противоположна страху, и том, как это связано с жизнью и смертью. Разговор о Христе,...",
        tags: [],
        preview: "https://i.ytimg.com/vi/a7Fwfd_Ft1M/maxresdefault.jpg",
        createdAt: "2024-07-06 12:27:42",
        updatedAt: null,
        transitionCounter: 3,
        isFavorite: false
    },
    {
        id: "IiVc5y",
        categoryId: "ktGDhX",
        title: "ОБ ЭМОЦИЯХ, КРИТИКЕ И ТЩЕСЛАВИИ (священник Павел Островский) | ДИАЛОГИ - YouTube",
        url: "https://www.youtube.com/watch?v=42KFr3TIgFM",
        description: "О чипировании и искусственном интеллекте. О священниках в интернете и конструктивной критике. О темах, которые волнуют молодежь, и семейных ценностях. Возмож...",
        tags: [],
        preview: "https://i.ytimg.com/vi/42KFr3TIgFM/maxresdefault.jpg",
        createdAt: "2024-07-05 22:20:50",
        updatedAt: null,
        transitionCounter: 1,
        isFavorite: false
    },
    {
        id: "DUSBBh",
        categoryId: "ktGDhX",
        title: "10 НАВЫКОВ которые можно тренировать ВЕЗДЕ - YouTube",
        url: "https://www.youtube.com/watch?v=wrN4vFz3dzo",
        description: "🔥Пройдите бесплатный тест от Skillfactory и узнайте какая IT-профессия вам подойдет: https://go.skillfactory.ru/l-8mOgРаспродажа в магазине Pro-Bike https:/...",
        tags: [],
        preview: "https://i.ytimg.com/vi/wrN4vFz3dzo/maxresdefault.jpg",
        createdAt: "2024-05-30 13:19:54",
        updatedAt: null,
        transitionCounter: 1,
        isFavorite: false
    },
    {
        id: "qLnZXH",
        categoryId: "ktGDhX",
        title: "Обучение катанию в горах | Маунтинбайк - YouTube",
        url: "https://www.youtube.com/watch?v=spRqFoQOZoo",
        description: "Этим летом проводил обучающий лагерь выходного дня в Карелии. Ребята сделали отличное видео, которым я не могу не поделиться. Уверен, что многим будет полезн...",
        tags: [],
        preview: "https://i.ytimg.com/vi/spRqFoQOZoo/maxresdefault.jpg",
        createdAt: "2024-05-23 11:50:56",
        updatedAt: null,
        transitionCounter: null,
        isFavorite: false
    },
    {
        id: "hpOwUB",
        categoryId: "ktGDhX",
        title: "Первый Алгоритм Для Изучения в 2024 - YouTube",
        url: "https://www.youtube.com/watch?v=kzPUYPfzT9A",
        description: "Разбираем алгоритм, который поможет решать задачи на собеседованиях в крупные айти компании.Подписывайтесь на мой Телеграм канал: https://t.me/saschalukinЭта...",
        tags: [],
        preview: "https://i.ytimg.com/vi/kzPUYPfzT9A/maxresdefault.jpg",
        createdAt: "2024-04-29 18:17:16",
        updatedAt: null,
        transitionCounter: null,
        isFavorite: false
    },
    {
        id: "CoQ2Ry",
        categoryId: "ktGDhX",
        title: "Watch Games of the Future 2024 Opening Ceremony. Anthem of Russia. Putin''s speech. #games - YouTube",
        url: "https://www.youtube.com/watch?v=h75iJ9u6L1Q",
        description: "#gameplay #game #future Nyilvánosságra hozták a 2024-es Future Games 107 résztvevő országának listáját.Jelenleg Kazanyban zajlik a Jövő Játékai - 2024 multis...",
        tags: [],
        preview: "https://i.ytimg.com/vi/h75iJ9u6L1Q/maxresdefault.jpg",
        createdAt: "2024-02-26 10:53:24",
        updatedAt: null,
        transitionCounter: 1,
        isFavorite: false
    },
    {
        id: "svc6tk",
        categoryId: "ktGDhX",
        title: "80 лет со дня снятия блокады Ленинграда /// ЭМПАТИЯ МАНУЧИ - YouTube",
        url: "https://www.youtube.com/watch?v=IBc-j1as9Fo",
        description: "Сегодня в день, когда мы публикуем этот выпуск, важная дата. 27 января 2024 года исполняется 80 лет со дня полного освобождения Ленинграда от фашистской блок...",
        tags: [],
        preview: "https://i.ytimg.com/vi/IBc-j1as9Fo/maxresdefault.jpg",
        createdAt: "2024-01-28 00:06:31",
        updatedAt: null,
        transitionCounter: null,
        isFavorite: false
    },
    {
        id: "S2qWWx",
        categoryId: "ktGDhX",
        title: "Встреча во ВГИКе. Отец Андрей Ткачёв - YouTube",
        url: "https://www.youtube.com/watch?v=geJVpU9aEZk",
        description: "Благодарность отцу Андрею: https://yoomoney.ru/to/410016173385332Каналы отца Андрея на других ресурсах:канал Царьград: https://tsargrad.tv Telegram канал: ht...",
        tags: [],
        preview: "https://i.ytimg.com/vi/geJVpU9aEZk/maxresdefault.jpg",
        createdAt: "2024-01-16 18:55:38",
        updatedAt: null,
        transitionCounter: null,
        isFavorite: false
    },
    {
        id: "rLQ5wX",
        categoryId: "ktGDhX",
        title: "Enhance your Coding with JSDoc - YouTube",
        url: "https://www.youtube.com/watch?v=3RIaH0NnG64&list=LL&index=2",
        description: "JSDoc is a great tool to help developers form lasting good habits. It has great integration with VSCode, encourages you to follow good practices when coding,...",
        tags: [],
        preview: "https://i.ytimg.com/vi/3RIaH0NnG64/maxresdefault.jpg",
        createdAt: "2023-11-16 10:32:13",
        updatedAt: null,
        transitionCounter: null,
        isFavorite: false
    },
    {
        id: "b8bNaM",
        categoryId: "ktGDhX",
        title: "Почему нельзя делить на ноль? – Алексей Савватеев | Лекции по математике | Научпоп - YouTube",
        url: "https://www.youtube.com/watch?v=IDPLTOYsKEY",
        description: "Каково математическое определение такой «привычной» нам операции, как деление? Почему невозможно получить результат деления на ноль? Можно ли разделить ноль ...",
        tags: [],
        preview: "https://i.ytimg.com/vi/IDPLTOYsKEY/maxresdefault.jpg",
        createdAt: "2023-11-14 11:43:15",
        updatedAt: null,
        transitionCounter: null,
        isFavorite: false
    },
    {
        id: "33NCsQ",
        categoryId: "ktGDhX",
        title: "Зачем в России вводят цифровой рубль? /// ЭМПАТИЯ МАНУЧИ - YouTube",
        url: "https://www.youtube.com/watch?v=BD7Cs1egrOc",
        description: "Индивидуальный подарок при бронировании оздоровительных программ в международном центре здоровья Verba Mayr*. Промокод «Манучи». Выбирайте программу: https:/...",
        tags: [],
        preview: "https://i.ytimg.com/vi/BD7Cs1egrOc/maxresdefault.jpg",
        createdAt: "2023-11-01 16:26:16",
        updatedAt: null,
        transitionCounter: null,
        isFavorite: false
    },
    {
        id: "tcnXkY",
        categoryId: "ktGDhX",
        title: "Phantom Liberty - РАЗБОР НОВЫХ НАВЫКОВ и БОЕВЫХ ИЗМЕНЕНИЙ 2.0 | Cyberpunk 2077 - YouTube",
        url: "https://www.youtube.com/watch?v=_0rQfd7Ilbk",
        description: "🔥 Купить Cyberpunk 2077 Phantom Liberty и другие игры на GGsel - https://ggsel.net/b/EvoiceErebus_4Обновление 2.0 для Киберпанк 2077 полностью изменит систе...",
        tags: [],
        preview: "https://i.ytimg.com/vi/_0rQfd7Ilbk/maxresdefault.jpg",
        createdAt: "2023-10-20 12:08:10",
        updatedAt: null,
        transitionCounter: null,
        isFavorite: false
    },
    {
        id: "fv0vmX",
        categoryId: "ktGDhX",
        title: "Сенсационное раскаяние Запашного - YouTube",
        url: "https://www.youtube.com/watch?v=m34JHxaDsO4",
        description: "Официальное заявление Аскольда Запашного в связи с появлением в сети Интернет скандального видео о драках с тиграми.",
        tags: [],
        preview: "https://i.ytimg.com/vi/m34JHxaDsO4/maxresdefault.jpg",
        createdAt: "2023-10-19 11:53:18",
        updatedAt: null,
        transitionCounter: 2,
        isFavorite: false
    },
  ],
  success: true
};

const SIDEBAR = (
  <>
    SIDEBAR<br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
  </> 
);


const Bookmarks: React.FC = () => {
  return (
    <TwoColumnLayout
      sidebar={SIDEBAR}
      sidebarHeader="Закладки"
      content={<BookmarksList data={API_RESPONCE.data} />}
    />
  );
};

export default Bookmarks;