import { RouterProvider, createBrowserRouter } from "react-router";

import RootLayout from "./layouts/RootLayout"

import HomePage from "./pages/HomePage";
import EventsPage from "./pages/EventsPage";
import BookmarksPage from "./pages/BookmarksPage";

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
