import TwoColumnLayout from "layouts/TwoColumnLayout";

import BookmarksList from "./BookmarksList";
import BookmarksSidebarTagList from "./BookmarksSidebarTagList";

const API_RESPONCE_BOOKMARKS = {
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
        favorite: false
    },
  ],
  success: true
};

const API_RESPONCE_TAGS = {
  status: 200,
  success: true,
  data: [
      {
          id: "GE20b",
          title: "Срочно",
          amount: 0
      },
      {
          id: "7t78v",
          title: "Крылышки",
          amount: 1
      },
      {
          id: "8GN6p",
          title: "Xbox",
          amount: 0
      },
      {
          id: "fM6YW",
          title: "Курица",
          amount: 2
      },
      {
          id: "x78IZ",
          title: "Ребрышки",
          amount: 5
      },
      {
          id: "NSMjl",
          title: "Playstation",
          amount: 3
      },
      {
          id: "ent7g",
          title: "Node",
          amount: 0
      },
      {
          id: "xU4PD",
          title: "SQLite",
          amount: 2
      },
      {
          id: "1fFZi",
          title: "Javascript",
          amount: 0
      },
      {
          id: "Wsw8g",
          title: "JSON",
          amount: 0
      },
      {
          id: "ulV4b",
          title: "Свинина",
          amount: 1
      },
      {
          id: "S7XFX",
          title: "Картофель",
          amount: 5
      },
      {
          id: "7Mjrx",
          title: "nvm",
          amount: 1
      },
      {
          id: "gY5YF",
          title: "SQL",
          amount: 1
      },
      {
          id: "Pe8tG",
          title: "Git",
          amount: 1
      },
      {
          id: "CyVhI",
          title: "Хочу приготовить",
          amount: 5
      },
      {
          id: "mgjD0",
          title: "Сэндвич",
          amount: 3
      },
      {
          id: "ZJf5O",
          title: "Стейк",
          amount: 0
      },
      {
          id: "e0C39",
          title: "Яйца",
          amount: 1
      },
      {
          id: "ymCVP",
          title: "Кофе",
          amount: 1
      },
      {
          id: "IN7Ob",
          title: "Ростбиф",
          amount: 1
      },
      {
          id: "XtI6V",
          title: "Android",
          amount: 7
      }
  ]
}

const Bookmarks: React.FC = () => {
  const sidebar = (
    <div className="bookmarks-list-sidebar__wrapper">
      <BookmarksSidebarTagList data={API_RESPONCE_TAGS.data} />
    </div>
  );

  return (
    <TwoColumnLayout
      sidebarHeader="Закладки"    
      sidebar={sidebar}
      content={<BookmarksList data={API_RESPONCE_BOOKMARKS.data} />}
    />
  );
};

export default Bookmarks;