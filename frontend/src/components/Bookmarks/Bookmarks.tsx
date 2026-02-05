import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router";

import { useBookmarks } from 'hooks/useBookmarks';
import TwoColumnLayout from "layouts/TwoColumnLayout";
import { BookmarksListPanelHeader } from "types/bookmarks";

import BookmarksEdit from "./BookmarksEdit";
import BookmarksList from "./BookmarksList";
import BookmarksSidebarCategoryList from "./BookmarksSidebarCategoryList";
import BookmarksSidebarHeader from "./BookmarksSidebarHeader"
import BookmarksSidebarTagList from "./BookmarksSidebarTagList";
import ModalManager from './modals/ModalManager';
import { BookmarksActionsProvider } from 'contexts/BookmarksActionsContext';
import { BookmarksModalProvider } from 'contexts/BookmarksModalContext';

const Bookmarks: React.FC = () => {
  const { tagId, categoryId, bookmarkId } = useParams<{ tagId?: string; categoryId?: string; bookmarkId?: string }>();
  const navigate = useNavigate();
  
  const { bookmarks, tags, categories, loading, error, refreshBookmarks } = useBookmarks({ tagId, categoryId });

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

  /**
   * Открывает панель редактирования через навигацию
   */
  const handleOpenEdit = useCallback((bookmarkId: string) => {
    navigate(`${bookmarkId}/edit`);
  }, [navigate]);

  /**
   * Закрывает панель редактирования через навигацию назад
   */
  const handleCloseEdit = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  /**
   * Определяет состояние открытия панели редактирования на основе URL
   */
  const isEditPanelOpen = !!bookmarkId;

  const sidebar = (
    <>
      <BookmarksSidebarHeader />
      <BookmarksSidebarCategoryList data={groupedCategories} />
      <BookmarksSidebarTagList data={tags} />
    </>
  );

  return (
    <BookmarksActionsProvider refreshBookmarks={refreshBookmarks}>
        <BookmarksModalProvider>
          <TwoColumnLayout
            sidebar={sidebar}
            content={
              <BookmarksList
                bookmarks={bookmarks}
                tags={tags}
                categoryId={categoryId}
                panelHeader={panelHeader}
                onEdit={handleOpenEdit}
              />
            }
          />

          <BookmarksEdit
            bookmarkId={bookmarkId}
            isOpen={isEditPanelOpen}
            onClose={handleCloseEdit}
          />

          <ModalManager />
        </BookmarksModalProvider>
    </BookmarksActionsProvider>    
  );
};

export default Bookmarks;