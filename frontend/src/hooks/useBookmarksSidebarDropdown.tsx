import { useCallback, useMemo } from "react";
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";

import { BookmarksSidebarListType } from "types/bookmarks";

import type { MenuProps } from 'antd';
import { useBookmarksActionsContext } from 'contexts/BookmarksActionsContext';

/**
 * Хук для работы с dropdown меню сайдбара закладок
 * 
 * Предоставляет логику обработки действий и формирования пунктов меню
 * для коллекций, категорий и тегов.
 * 
 * @param type - тип сущности (collection, category, tag)
 * @param id - идентификатор сущности
 * @returns объект с обработчиком клика и списком пунктов меню
 */
export const useBookmarksSidebarDropdown = (
  type: BookmarksSidebarListType,
  id: string,
  title: string,
) => {
  const actions = useBookmarksActionsContext();

  /**
   * Обработчик клика по пункту меню
   */
  const handleMenuClick: MenuProps['onClick'] = useCallback((e: Parameters<NonNullable<MenuProps['onClick']>>[0]) => {
    e.domEvent.stopPropagation();
    
    switch (e.key) {
      case '0': // Создать категорию
        if (type === 'collection') {
          console.log(`actions.createCategoryInCollection(${id})`);
        }
        if (type === 'tags-collection') {
          console.log(`actions.createTag(${id})`);
        }
        break;
      case '1': // Переименовать
        if (type === 'collection') {
          console.log(`actions.renameCollection(${id})`);
        }
        if (type === 'category') {
          console.log(`actions.renameCategory(${id})`);
        }
        if (type === 'tag') {
          console.log(`actions.renameTag(${id})`);
        }
        break;
      case '2': // Поднять
        if (type === 'collection') {
          console.log(`actions.moveCollectionUp(${id})`);
        }
        if (type === 'category') {
          console.log(`actions.moveCategoryUp(${id})`);
        }
        break;
      case '3': // Опустить
        if (type === 'collection') {
          console.log(`actions.moveCollectionDown(${id})`);
        }
        if (type === 'category') {
          console.log(`actions.moveCategoryDown(${id})`);
        }
        break;
      case '4': // Удалить
        if (type === 'collection') {
          console.log(`actions.deleteCollection(${id})`);
        }
        if (type === 'category') {
          console.log(`actions.deleteCategory(${id})`);
        }
        if (type === 'tag') {
          console.log(`actions.deleteTag(${id})`);
        }
        break;
    }
  }, [type, id, actions]);

  /**
   * Формирует список пунктов меню в зависимости от типа сущности
   */
  const items: MenuProps['items'] = useMemo(() => {
    const baseItems = [
      { key: '1', label: "Переименовать", icon: <EditOutlined /> },
    ];

    if (type === 'tags-collection') {
      return [
        { key: '0', label: "Создать тег", icon: <PlusOutlined /> },
      ];
    }
    
    if (type === 'collection') {
      return [
        { key: '0', label: "Создать категорию", icon: <PlusOutlined /> },
        {
          type: 'divider',
        },        
        ...baseItems,
        { key: '2', label: "Поднять", icon: <ArrowUpOutlined /> },
        { key: '3', label: "Опустить", icon: <ArrowDownOutlined />, },
        { key: '4', danger: true, label: 'Удалить', icon: <DeleteOutlined />, },
      ];
    }
    
    if (type === 'category') {
      return [
        ...baseItems,
        { key: '2', label: "Поднять", icon: <ArrowUpOutlined /> },
        { key: '3', label: "Опустить", icon: <ArrowDownOutlined />, },
        { key: '4', danger: true, label: 'Удалить', icon: <DeleteOutlined />, },
      ];
    }
    
    // Для тегов - только переименовать и удалить
    return [
      ...baseItems,
      { key: '4', danger: true, label: 'Удалить', icon: <DeleteOutlined />, },
    ];
  }, [type]);

  return {
    items,
    handleMenuClick,
  };
};