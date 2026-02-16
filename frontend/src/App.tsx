import { createBrowserRouter,RouterProvider } from "react-router";

import RootLayout from "layouts/RootLayout"
import BookmarksPage from "pages/BookmarksPage";
import EventsPage from "pages/EventsPage";
import HomePage from "pages/HomePage";
import NotFoundPage from "pages/NotFoundPage";

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
            path: 'not-found',
            element: <BookmarksPage />,
          },          
          {
            path: ':bookmarkId/edit',
            element: <BookmarksPage />,
          },          
          {
            path: 'category/:categoryId',
            element: <BookmarksPage />,
          },
          {
            path: 'category/:categoryId/:bookmarkId/edit',
            element: <BookmarksPage />,
          },
          {
            path: 'tag/:tagId',
            element: <BookmarksPage />,
          },
          {
            path: 'tag/:tagId/:bookmarkId/edit',
            element: <BookmarksPage />,
          }
        ],
      },
      {
        path: "*",
        element: <NotFoundPage />,
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
