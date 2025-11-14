import { useMemo } from "react";
import { useParams } from "react-router";

import { useBookmarks } from 'hooks/useBookmarks';
import TwoColumnLayout from "layouts/TwoColumnLayout";
import { BookmarksListPanelHeader } from "types/bookmarks";

import BookmarksList from "./BookmarksList";
import BookmarksSidebarCategoryList from "./BookmarksSidebarCategoryList";
import BookmarksSidebarTagList from "./BookmarksSidebarTagList";

const Bookmarks: React.FC = () => {
  const { tagId, categoryId } = useParams<{ tagId?: string; categoryId?: string }>();
  const { bookmarks, tags, categories, loading, error } = useBookmarks({ tagId, categoryId });

  const panelHeader: BookmarksListPanelHeader = useMemo(() => {
    const currentCategory = categories.find((category) => category.id === categoryId);
    const currentTag = tags.find((tag) => tag.id === tagId);

    return {
      title: currentCategory?.title || currentTag?.title || '',
      icon: currentCategory?.icon || 'Tag',
    };
  }, [categories, tags, tagId, categoryId]);

  const groupedCategories = useMemo(() => {
    const collections = categories
      .filter((elem) => !elem.parentId)
      .sort((a, b) => a.position - b.position);

    return collections.map((collection) => {
      const children = categories
        .filter((category) => category.parentId === collection.id)
        .sort((a, b) => a.position - b.position);
  
      return {
        id: collection.id,
        title: collection.title,
        children,
      };
    });
  }, [categories]);

  const sidebar = (
    <>
      <BookmarksSidebarCategoryList data={groupedCategories} />
      <BookmarksSidebarTagList data={tags} />
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