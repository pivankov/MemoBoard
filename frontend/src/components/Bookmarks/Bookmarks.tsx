import { useMemo } from "react";
import { useParams } from "react-router";

import { useBookmarks } from 'hooks/useBookmarks';
import TwoColumnLayout from "layouts/TwoColumnLayout";
import { BookmarksListPanelHeader } from "types/bookmarks";

import BookmarksList from "./BookmarksList";
import BookmarksSidebarCategoryList from "./BookmarksSidebarCategoryList";
import BookmarksSidebarTagList from "./BookmarksSidebarTagList";

const Bookmarks: React.FC = () => {
  const params = useParams();
  const { bookmarks, tags, categories, loading, error } = useBookmarks();

  const panelHeader: BookmarksListPanelHeader = useMemo(() => {
    const currentTag = tags.find((tag) => tag.id === params.tagId);
    const currentCategory = categories.find((category) => category.id === params.categoryId);
    const icon = currentCategory?.icon || 'Tag';

    return {
      title: currentCategory?.title || currentTag?.title || '',
      icon,
    };
  }, [categories, tags, params]);


  const groupedCategories = useMemo(() => {
    const collections = categories.filter((elem) => !elem.parentId);
    const sortedCollections = collections.sort((a, b) => a.position - b.position);

    return sortedCollections.map((collection) => {
      const categoriesByCollection = categories.filter((category) => category.parentId === collection.id);
      const sortedCategories = categoriesByCollection.sort((a, b) => a.position - b.position);
  
      return {
        id: collection.id,
        title: collection.title,
        children: sortedCategories,
      }
    });
  }, [categories]);

  const sidebar = (
    <>
      <div className="bookmarks-list-sidebar__wrapper">
        <BookmarksSidebarCategoryList data={groupedCategories} />
      </div>

      <div className="bookmarks-list-sidebar__wrapper">
        <BookmarksSidebarTagList data={tags} />
      </div>    
    </>
  );

  return (
    <TwoColumnLayout
      sidebarHeader="Закладки"    
      sidebar={sidebar}
      content={<BookmarksList bookmarks={bookmarks} tags={tags} panelHeader={panelHeader} />}
    />
  );
};

export default Bookmarks;