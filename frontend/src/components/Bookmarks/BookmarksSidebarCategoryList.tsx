import { BookmarksCategoriesGrouped } from "types/bookmarks";

import BookmarksSidebarList from "./BookmarksSidebarList";
import BookmarksSidebarListItem from "./BookmarksSidebarListItem";

const BookmarksSidebarCategoryList: React.FC<{ data: BookmarksCategoriesGrouped[] }> = ({ data }) => {
  return (
    <>
      {
        data.map((parent) => (
          <BookmarksSidebarList title={parent.title} key={parent.id}>
            {
              parent.children.map((item) => (
                <BookmarksSidebarListItem
                  key={item.id}
                  link={`/bookmarks/category/${item.id}`}
                  icon={item.icon}
                  title={item.title}
                  amount={item.amount}
                />
              ))
            }
          </BookmarksSidebarList>
        ))
      }
    </>
  );
};

export default BookmarksSidebarCategoryList;