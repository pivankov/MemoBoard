import { useCallback } from "react";
import { DeleteOutlined, EditOutlined, PartitionOutlined, PictureOutlined, PlusOutlined } from "@ant-design/icons";

import { BookmarksSidebarListType } from "types/bookmarks";

import type { MenuProps } from 'antd';
import { useBookmarksModalContext } from 'contexts/BookmarksModalContext';

type MenuItem = NonNullable<MenuProps['items']>[number];

const RENAME_ITEM: MenuItem = { key: '1', label: "Переименовать", icon: <EditOutlined /> };
const MOVE_ITEM: MenuItem = { key: '2', label: "Переместить", icon: <PartitionOutlined /> };
const DELETE_ITEM: MenuItem = { key: '3', danger: true, label: 'Удалить', icon: <DeleteOutlined /> };
const CHANGE_ITEM_ICON: MenuItem = { key: '4', label: 'Сменить иконку', icon: <PictureOutlined /> };

/** Карта пунктов меню по типу сущности */
const MENU_ITEMS: Record<BookmarksSidebarListType, MenuItem[]> = {
  'tags-collection': [
    { key: '0', label: "Создать тег", icon: <PlusOutlined /> },
  ],
  'collection': [
    { key: '0', label: "Создать категорию", icon: <PlusOutlined /> },
    { type: 'divider' },
    RENAME_ITEM,
    MOVE_ITEM,
    DELETE_ITEM,
  ],
  'category': [
    RENAME_ITEM,
    CHANGE_ITEM_ICON,
    MOVE_ITEM,
    DELETE_ITEM,
  ],
  'tag': [
    RENAME_ITEM,
    DELETE_ITEM,
  ],
};

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
  icon?: string | null,
) => {
  const { openModal } = useBookmarksModalContext();

  /**
   * Обработчик клика по пункту меню
   */
  const handleMenuClick: MenuProps['onClick'] = useCallback((e: Parameters<NonNullable<MenuProps['onClick']>>[0]) => {
    e.domEvent.stopPropagation();
    
    switch (e.key) {
      case '0': // Создать категорию
        if (type === 'collection') {
          openModal({ 
            type: 'create-entity', 
            entityType: 'category',
            collectionId: id,
          });          
        }
        if (type === 'tags-collection') {
          openModal({ 
            type: 'create-entity', 
            entityType: 'tag' 
          });
        }
        break;
      case '1': // Переименовать
        if (type === 'collection') {
          openModal({ 
            type: 'rename-entity',
            entityType: 'collection',
            entityId: id,
            currentTitle: title,
          });          
        }
        if (type === 'category') {
          openModal({ 
            type: 'rename-entity',
            entityType: 'category',
            entityId: id,
            currentTitle: title,
          });          
        }
        if (type === 'tag') {
          openModal({ 
            type: 'rename-entity',
            entityType: 'tag',
            entityId: id,
            currentTitle: title,
          });          
        }
        break;
      case '2': // Переместить
        if (type === 'collection') {
          openModal({ 
            type: 'move-entity',
            entityType: 'collection',
            entityId: id,
          });
        }
        if (type === 'category') {
          openModal({ 
            type: 'move-entity',
            entityType: 'category',
            entityId: id,
          });          
        }
        break;
      case '3': // Удалить
        if (type === 'collection') {
          openModal({ 
            type: 'delete-confirm',
            entityType: 'collection',
            entityId: id,
            entityName: title,
          });    
        }
        if (type === 'category') {
          openModal({ 
            type: 'delete-confirm',
            entityType: 'category',
            entityId: id,
            entityName: title,
          });          
        }
        if (type === 'tag') {
          openModal({ 
            type: 'delete-confirm',
            entityType: 'tag',
            entityId: id,
            entityName: title,
          });    
        }
        break;
      case '4': // Сменить иконку
      if (type === 'category') {
        openModal({ 
          type: 'change-category-icon',
          categoryId: id,
          currentIcon: icon,
        });    
      }
        break;
    }
  }, [type, id, title, icon]);

  const items: MenuProps['items'] = MENU_ITEMS[type];

  return {
    items,
    handleMenuClick,
  };
};