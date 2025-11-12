import { createBrowserRouter,RouterProvider } from "react-router";

import RootLayout from "layouts/RootLayout"
import BookmarksPage from "pages/BookmarksPage";
import EventsPage from "pages/EventsPage";
import HomePage from "pages/HomePage";

import { NotificationsProvider } from 'providers/NotificationsProvider';

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    id: "root",
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "events",
        children: [
          {
            index: true,
            element: <EventsPage />,
          }
        ],
      },
      {
        path: "bookmarks",
        children: [
          {
            index: true,
            element: <BookmarksPage />,
          },
          {
            path: 'tag/:tagId',
            element: <BookmarksPage />,
          }
        ],
      },
    ],
  }
]);

function App() {
  return (
    <NotificationsProvider>
      <RouterProvider router={router} />
    </NotificationsProvider>
  );
}

export default App;
