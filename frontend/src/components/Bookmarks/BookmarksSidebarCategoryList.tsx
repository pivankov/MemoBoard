import { BookmarksCategoriesGrouped, BookmarksSystemCounts } from "types/bookmarks";

import BookmarksSidebarList from "./BookmarksSidebarList";
import BookmarksSidebarListItem from "./BookmarksSidebarListItem";
import { SYSTEM_ROUTE_CONFIG } from 'constants/bookmarks';

interface BookmarksSidebarCategoryListProps {
  data: BookmarksCategoriesGrouped[];
  systemCounts: BookmarksSystemCounts;
}

const BookmarksSidebarCategoryList: React.FC<BookmarksSidebarCategoryListProps> = ({ data, systemCounts }) => {    
  return (
    <>
      <BookmarksSidebarList type="collection" id="__system__" title="">
        {(Object.entries(SYSTEM_ROUTE_CONFIG) as [string, typeof SYSTEM_ROUTE_CONFIG[keyof typeof SYSTEM_ROUTE_CONFIG]][]).map(([id, item]) => (
          <BookmarksSidebarListItem
            key={id}
            type="category"
            id={id}
            link={item.link}
            icon={item.icon}
            title={item.title}
            amount={systemCounts[id as keyof BookmarksSystemCounts] ?? 0}
            showDropdown={false}
          />
        ))}
      </BookmarksSidebarList>

      {data.map((parent) => (
        <BookmarksSidebarList key={parent.id} type="collection" id={parent.id} title={parent.title}>
          {parent.children.map((item) => (
            <BookmarksSidebarListItem
              key={item.id}
              type="category"
              id={item.id}
              link={`/bookmarks/category/${item.id}`}
              icon={item.icon}
              title={item.title}
              amount={item.amount}               
            />
          ))}
        </BookmarksSidebarList>
      ))}
    </>
  );
};

export default BookmarksSidebarCategoryList;
