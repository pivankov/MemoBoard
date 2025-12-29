import { useCallback, useMemo, useState } from "react";
import { Tag } from 'antd';

import { BookmarksItem, BookmarksListPanelHeader, BookmarksTag, BookmarksTagWithSelected } from "types/bookmarks";

import BookmarksListItem from "./BookmarksListItem";
import BookmarksListPanel from "./BookmarksListPanel";
import { useBookmarksActionsContext } from 'contexts/BookmarksActionsContext';

import "./BookmarksList.css";

interface BookmarksListProps {
  bookmarks: BookmarksItem[];
  tags: BookmarksTag[];
  panelHeader: BookmarksListPanelHeader;
  /** Коллбэк открытия редактирования закладки */
  onEdit: (bookmarkId: string) => void;
}

const BookmarksList: React.FC<BookmarksListProps> = ({ bookmarks, tags, panelHeader, onEdit }) => {
  const { removeBookmark, toggleBookmarkFavorite } = useBookmarksActionsContext();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const tagById = useMemo(() => new Map(tags.map((t) => [t.id, t] as const)), [tags]);
  const selectedTagsSet = useMemo(() => new Set(selectedTags), [selectedTags]);

  /**
   * Преобразует ID тегов в объекты тегов с флагом выбора
   * @param bookmarkTags - массив ID тегов закладки
   * @returns массив тегов с флагом selected
   */
  const mapTagIdsToTags = useCallback((bookmarkTags: string[]): BookmarksTagWithSelected[] => {
    return bookmarkTags.flatMap((tagId) => {
      const tag = tagById.get(tagId);
      
      return tag ? [{
        ...tag,
        selected: selectedTagsSet.has(tagId)
      }] : [];
    });
  }, [tagById, selectedTagsSet]);

  const handleClickTag = useCallback((id: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(id)) {
        return prev.filter((t) => t !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const handleResetTags = useCallback(() => {
    setSelectedTags([]);
  }, []);

  const handleDelete = useCallback((bookmarkId: string, categoryId: string) => {
    removeBookmark(bookmarkId, categoryId);
  }, [removeBookmark]);

  const handleEdit = useCallback((bookmarkId: string) => {
    onEdit(bookmarkId);
  }, [onEdit]);

  const handleToggleFavorite = useCallback((bookmarkId: string) => {
    toggleBookmarkFavorite(bookmarkId);
  }, [toggleBookmarkFavorite]);

  /**
   * Активные теги с подсчетом количества закладок для каждого тега
   */
  const activeTagsWithCount = useMemo(() => {
    const tagCounts = new Map<string, number>();
    
    bookmarks.forEach((bookmark) => {
      bookmark.tags.forEach((tagId) => {
        tagCounts.set(tagId, (tagCounts.get(tagId) || 0) + 1);
      });
    });

    return tags
      .filter((tag) => tagCounts.has(tag.id))
      .map((tag) => ({
        ...tag,
        count: tagCounts.get(tag.id) || 0
      }));
  }, [bookmarks, tags]);  


  /**
   * Сортировка закладок по избранному (без мутации исходного массива)
   * @returns массив закладок, где сначала идут избранные (favorite = true)
   */
  const sortedBookmarks = useMemo(() => {
    return [...bookmarks].sort((a, b) => Number(b.favorite) - Number(a.favorite));
  }, [bookmarks]);

  /**
   * Фильтрация отсортированных закладок по выбранным тегам
   * @returns отфильтрованный массив или все закладки, если теги не выбраны
   */
  const filteredBookmarks = useMemo(() => {
    if (!selectedTags.length) {
      return sortedBookmarks;
    }
    
    return sortedBookmarks.filter((bookmark) => 
      bookmark.tags.some((tagId) => selectedTagsSet.has(tagId))
      // Вариант фильтрации(AND), когда отображаются закладки включающие в себя все выбранные теги 
      // selectedTags.every((tagId) => bookmark.tags.includes(tagId))
    );
  }, [sortedBookmarks, selectedTags, selectedTagsSet]);

  return (
    <>
      <BookmarksListPanel header={panelHeader} onResetFilters={selectedTags.length > 0 ? handleResetTags : undefined}>
        {
          activeTagsWithCount.map((tag) => (
            <Tag 
              key={tag.id} 
              onClick={() => handleClickTag(tag.id)} 
              color={selectedTags.includes(tag.id) ? "blue" : ""}
              style={{ cursor: 'pointer' }}
            >
              {tag.title} ({tag.count})
            </Tag>
          ))
        }  
      </BookmarksListPanel>
      
      <div className="bookmarks-list">
        {
          filteredBookmarks.map((bookmark) => (
            <BookmarksListItem 
              key={bookmark.id} 
              {...bookmark} 
              tags={mapTagIdsToTags(bookmark.tags)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}              
            />
          ))
        }
      </div>
    </>
  );
};

export default BookmarksList;