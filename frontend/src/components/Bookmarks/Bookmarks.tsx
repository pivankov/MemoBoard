import { useCallback, useEffect, useMemo } from "react";
import { useLocation, useMatch, useNavigate, useParams } from "react-router";

import { useBookmarks } from 'hooks/useBookmarks';
import TwoColumnLayout from "layouts/TwoColumnLayout";
import { BookmarksListPanelHeader } from "types/bookmarks";

import BookmarksEdit from "./BookmarksEdit";
import BookmarksList from "./BookmarksList";
import BookmarksNotFound from './BookmarksNotFound';
import BookmarksSidebarCategoryList from "./BookmarksSidebarCategoryList";
import BookmarksSidebarHeader from "./BookmarksSidebarHeader"
import BookmarksSidebarTagList from "./BookmarksSidebarTagList";
import ModalManager from './modals/ModalManager';
import { SYSTEM_ROUTES } from 'constants/bookmarks';
import { BookmarksActionsProvider } from 'contexts/BookmarksActionsContext';
import { BookmarksModalProvider } from 'contexts/BookmarksModalContext';

const Bookmarks: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tagId, categoryId, bookmarkId } = useParams<{ tagId?: string; categoryId?: string; bookmarkId?: string }>();
  const { bookmarks, tags, categories, loading, error, refreshBookmarks } = useBookmarks({ tagId, categoryId });

  const panelHeader: BookmarksListPanelHeader = useMemo(() => {
    const currentCategory = categories.find((category) => category.id === categoryId);
    const currentTag = tags.find((tag) => tag.id === tagId);

    return {
      title: currentCategory?.title || currentTag?.title || '',
      icon: currentCategory?.icon || 'Tag',
    };
  }, [categories, tags, tagId, categoryId]);

  const isNotFoundRoute = useMatch(`/bookmarks/${SYSTEM_ROUTES.NOT_FOUND}`);

  const isEntityNotFound = useMemo(() => {
    if (isNotFoundRoute) {
      return true
    };

    if (loading) {
      return false
    };
    
    if (categoryId && categories.length > 0) {
      return !categories.some(cat => cat.id === categoryId);
    }
    
    if (tagId && tags.length > 0) {
      return !tags.some(tag => tag.id === tagId);
    }
    
    return false;
  }, [isNotFoundRoute, loading, categoryId, tagId, categories, tags]);
  
  const notFoundType: 'category' | 'tag' | null = useMemo(() => {
    if (!isEntityNotFound) return null;
    
    if (isNotFoundRoute) {
      return (location.state as { entityType?: 'category' | 'tag' })?.entityType || 'category';
    }
    
    return categoryId ? 'category' : 'tag';
  }, [isEntityNotFound, isNotFoundRoute, location.state, categoryId]);  

  useEffect(() => {
    if (loading || isNotFoundRoute) return;

    if (isEntityNotFound) {
      navigate(`/bookmarks/${SYSTEM_ROUTES.NOT_FOUND}`, { 
        replace: true,
        state: { entityType: categoryId ? 'category' : 'tag' }
      });
    }
  }, [loading, isNotFoundRoute, isEntityNotFound, categoryId, navigate]);

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
            content={isEntityNotFound && notFoundType ? (
              <BookmarksNotFound type={notFoundType} />
            ) : (
              <BookmarksList
                bookmarks={bookmarks}
                tags={tags}
                categoryId={categoryId}
                panelHeader={panelHeader}
                onEdit={handleOpenEdit}
              />
            )}
          />

          <BookmarksEdit
            bookmarkId={bookmarkId}
            isOpen={isEditPanelOpen}
            onClose={handleCloseEdit}
            groupedCategories={groupedCategories}
          />

          <ModalManager />
        </BookmarksModalProvider>
    </BookmarksActionsProvider>    
  );
};

export default Bookmarks;