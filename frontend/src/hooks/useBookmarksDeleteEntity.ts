import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';

import { SYSTEM_ROUTES } from 'constants/bookmarks';
import { useBookmarksActionsContext } from 'contexts/BookmarksActionsContext';

type EntityType = 'collection' | 'category' | 'tag';

/**
 * Хук для удаления сущностей с автоматической навигацией и обновлением данных
 * 
 * Инкапсулирует логику:
 * - Удаления сущности через API
 * - Навигации если удаляется текущая сущность
 * - Обновления данных если удаляется другая сущность
 */
export const useBookmarksDeleteEntity = () => {
  const navigate = useNavigate();
  const { tagId, categoryId } = useParams<{ tagId?: string; categoryId?: string }>();
  const { 
    refreshBookmarks, 
    deleteCollection, 
    deleteCategory, 
    deleteTag 
  } = useBookmarksActionsContext();

  const handleDelete = useCallback(async (
    entityType: EntityType,
    entityId: string
  ): Promise<void> => {
    switch (entityType) {
      case 'collection':
        await deleteCollection(entityId);
        break;

      case 'category':
        await deleteCategory(entityId);
        
        if (categoryId === entityId) {
          navigate(`/bookmarks/${SYSTEM_ROUTES.NOT_FOUND}`, { 
            replace: true,
            state: { entityType: 'category' }
          });
        } else {
          await refreshBookmarks();
        }
        break;

      case 'tag':
        await deleteTag(entityId);
        
        if (tagId === entityId) {
          navigate(`/bookmarks/${SYSTEM_ROUTES.NOT_FOUND}`, { 
            replace: true,
            state: { entityType: 'tag' }
          });
        } else {
          await refreshBookmarks();
        }
        break;
    }
  }, [
    categoryId, 
    tagId, 
    navigate, 
    deleteCollection, 
    deleteCategory, 
    deleteTag, 
    refreshBookmarks
  ]);

  return { handleDelete };
};