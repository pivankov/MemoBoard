import { useCallback, useEffect, useState } from 'react';

import { BookmarksCategoriesReorderItem,BookmarksCategory } from 'types/bookmarks';

import { API_BOOKMARKS_BASE_URL } from 'constants/api';
import { SYSTEM_CATEGORIES } from 'constants/bookmarks';
import { useBookmarksActionsContext } from 'contexts/BookmarksActionsContext';
import { useBookmarksModalContext } from 'contexts/BookmarksModalContext';

type ListType = 'collections' | 'categories';

/**
 * Возвращаемое значение хука useMoveEntityModal
 */
interface UseMoveEntityModalReturn {
  /** Флаг загрузки начальных данных */
  loading: boolean;
  /** Флаг выполнения submit-запроса */
  isSubmitting: boolean;
  /** Сообщение об ошибке загрузки или null */
  error: string | null;
  /** Список коллекций в текущем порядке */
  localCollections: BookmarksCategory[];
  /** Список категорий выбранной коллекции в текущем порядке */
  localCategories: BookmarksCategory[];
  /** ID выбранной коллекции (только для entityType=category) */
  selectedCollectionId: string | null;
  /** Меняет выбранную коллекцию и пересчитывает список категорий */
  handleCollectionChange: (collectionId: string) => void;
  /** Перемещает элемент на одну позицию вверх или вниз в указанном списке */
  handleMoveItem: (listType: ListType, index: number, direction: 'up' | 'down') => void;
  /** Флаг наличия несохранённых изменений */
  isDirty: boolean;
  /** Формирует payload и отправляет изменения на бэкенд */
  handleSubmit: () => Promise<void>;
}

/**
 * Хук для управления логикой модального окна перемещения категории/коллекции
 *
 * Загружает все категории, формирует производные списки для отображения
 * и предоставляет методы для изменения порядка и сохранения результата.
 *
 * @param entityId - UID перемещаемой сущности
 * @param entityType - тип сущности: 'collection' | 'category'
 */
export const useMoveEntityModal = (
  entityId: string,
  entityType: 'collection' | 'category',
): UseMoveEntityModalReturn => {
  const { reorderCategories } = useBookmarksActionsContext();
  const { closeModal } = useBookmarksModalContext();

  const [allCategories, setAllCategories] = useState<BookmarksCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetched, setIsFetched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [localCollections, setLocalCollections] = useState<BookmarksCategory[]>([]);
  const [localCategories, setLocalCategories] = useState<BookmarksCategory[]>([]);
  const [originalCategories, setOriginalCategories] = useState<BookmarksCategory[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [originalParentId, setOriginalParentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BOOKMARKS_BASE_URL}/categories`);

        if (!response.ok) {
          throw new Error(`Ошибка загрузки категорий: ${response.status} ${response.statusText}`);
        }

        const payload = await response.json();
        const list: BookmarksCategory[] = Array.isArray(payload?.data) ? payload.data : [];

        setAllCategories(list);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Не удалось загрузить категории';

        setError(message);
        console.error('Ошибка загрузки категорий:', err);
      } finally {
        setLoading(false);
        setIsFetched(true);
      }
    };

    fetchCategories();
  }, []);

  // Инициализируем производные списки после завершения загрузки.
  // Используем isFetched вместо allCategories.length === 0,
  // чтобы корректно обрабатывать случай пустых данных.
  useEffect(() => {
    if (!isFetched) return;

    const collections = allCategories
      .filter(c => c.parentId === null)
      .sort((a, b) => a.position - b.position);

    setLocalCollections(collections);

    if (entityType === 'category') {
      const entity = allCategories.find(c => c.id === entityId);
      const parentId = entity?.parentId ?? null;

      setSelectedCollectionId(parentId);
      setOriginalParentId(parentId);

      const categories = allCategories
        .filter(c => c.parentId === parentId)
        .sort((a, b) => a.position - b.position);

      setLocalCategories(categories);
      setOriginalCategories(categories);
    }
  }, [isFetched, allCategories, entityId, entityType]);

  /**
   * Меняет выбранную коллекцию.
   * При возврате к исходной коллекции восстанавливает оригинальный порядок категорий.
   * При переходе к новой коллекции добавляет перемещаемую категорию в конец списка.
   */
  const handleCollectionChange = useCallback((collectionId: string) => {
    setSelectedCollectionId(collectionId);
    setIsDirty(true);

    if (collectionId === originalParentId) {
      setLocalCategories(originalCategories);
      return;
    }

    const entity = allCategories.find(c => c.id === entityId);
    const baseCategories = allCategories
      .filter(c => c.parentId === collectionId && c.id !== entityId)
      .sort((a, b) => a.position - b.position);

    setLocalCategories(entity ? [...baseCategories, entity] : baseCategories);
  }, [allCategories, entityId, originalParentId, originalCategories]);

  /**
   * Перемещает элемент на одну позицию вверх или вниз через swap соседних элементов.
   * Не выполняется для крайних позиций.
   */
  const handleMoveItem = useCallback((
    listType: ListType,
    index: number,
    direction: 'up' | 'down',
  ) => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    const swap = (items: BookmarksCategory[]): BookmarksCategory[] => {
      if (swapIndex < 0 || swapIndex >= items.length) return items;
      const next = [...items];
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next;
    };

    if (listType === 'collections') {
      setLocalCollections(prev => swap(prev));
    } else {
      setLocalCategories(prev => swap(prev));
    }

    setIsDirty(true);
  }, []);

  /**
   * Формирует payload из текущего состояния списков и отправляет на бэкенд.
   *
   * Для category при смене коллекции:
   * — добавляет parentId к перемещаемой сущности
   * — включает пересчитанные позиции оставшихся категорий старой коллекции,
   *   чтобы устранить позиционный пробел после удаления элемента
   */
  const handleSubmit = useCallback(async () => {
    if (!isDirty) return;

    setIsSubmitting(true);

    try {
      let payload: BookmarksCategoriesReorderItem[];

      if (entityType === 'collection') {
        // Системная коллекция присутствует в localCollections для корректного
        // маппинга позиций (index = position), но в payload не включается —
        // её позиция не должна изменяться
        payload = localCollections
          .map((item, index) => ({ id: item.id, position: index }))
          .filter(entry => entry.id !== SYSTEM_CATEGORIES.SYSTEM);
      } else {
        payload = localCategories.map((item, index) => {
          const entry: BookmarksCategoriesReorderItem = { id: item.id, position: index };

          if (item.id === entityId && selectedCollectionId !== originalParentId) {
            entry.parentId = selectedCollectionId ?? undefined;
          }

          return entry;
        });

        // При смене коллекции пересчитываем позиции оставшихся категорий
        // в исходной коллекции, чтобы закрыть позиционный пробел
        if (selectedCollectionId !== originalParentId) {
          const remainingFromOriginal = originalCategories
            .filter(c => c.id !== entityId)
            .map((item, index) => ({ id: item.id, position: index }));

          payload = [...payload, ...remainingFromOriginal];
        }
      }

      await reorderCategories(payload);
      closeModal();
    } catch (err) {
      console.error('Ошибка при сохранении порядка:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isDirty,
    entityType,
    entityId,
    localCollections,
    localCategories,
    selectedCollectionId,
    originalParentId,
    originalCategories,
    reorderCategories,
    closeModal,
  ]);

  return {
    loading,
    isSubmitting,
    isDirty,
    error,
    localCollections,
    localCategories,
    selectedCollectionId,
    handleCollectionChange,
    handleMoveItem,
    handleSubmit,
  };
};
