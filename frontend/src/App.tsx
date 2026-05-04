import { createBrowserRouter, RouterProvider } from "react-router";

import ProtectedRoute from 'components/ProtectedRoute/ProtectedRoute';
import RootLayout from "layouts/RootLayout";
import BookmarksPage from "pages/BookmarksPage";
import EventsPage from "pages/EventsPage";
import HomePage from "pages/HomePage";
import LoginPage from "pages/LoginPage";
import NotFoundPage from "pages/NotFoundPage";
import RegisterPage from "pages/RegisterPage";

import { AuthProvider } from 'providers/AuthProvider';
import { NotificationsProvider } from 'providers/NotificationsProvider';

const router = createBrowserRouter([
  // Публичные маршруты (без авторизации)
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  // Защищённые маршруты (требуют авторизации)
  {
    element: <ProtectedRoute />,
    children: [
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
                path: 'favorites',
                element: <BookmarksPage />,
              },
              {
                path: 'favorites/:bookmarkId/edit',
                element: <BookmarksPage />,
              },
              {
                path: 'unsorted',
                element: <BookmarksPage />,
              },
              {
                path: 'unsorted/:bookmarkId/edit',
                element: <BookmarksPage />,
              },
              {
                path: 'trash',
                element: <BookmarksPage />,
              },
              {
                path: 'trash/:bookmarkId/edit',
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
      },
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <RouterProvider router={router} />
      </NotificationsProvider>
    </AuthProvider>
  );
}

export default App;
