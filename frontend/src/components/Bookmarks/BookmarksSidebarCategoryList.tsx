import { BookmarksCategoriesGrouped } from "types/bookmarks";

import BookmarksSidebarList from "./BookmarksSidebarList";
import BookmarksSidebarListItem from "./BookmarksSidebarListItem";

const BookmarksSidebarCategoryList: React.FC<{ data: BookmarksCategoriesGrouped[] }> = ({ data }) => {    
  return (
    <>
      {
        data.map((parent) => (
          <BookmarksSidebarList key={parent.id} type="collection" id={parent.id} title={parent.title}>
            {
              parent.children.map((item) => (
                <BookmarksSidebarListItem
                  key={item.id}
                  type="category"
                  id={item.id}
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