import { createBrowserRouter,RouterProvider } from "react-router";

import RootLayout from "layouts/RootLayout"
import BookmarksPage from "pages/BookmarksPage";
import EventsPage from "pages/EventsPage";
import HomePage from "pages/HomePage";

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
        element: <BookmarksPage />,
      },
    ],
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
