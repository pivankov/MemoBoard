import { Dropdown } from 'antd';
import { EllipsisOutlined } from "@ant-design/icons";

import { useBookmarksSidebarDropdown } from 'hooks/useBookmarksSidebarDropdown';
import { BookmarksSidebarListType } from "types/bookmarks";

import "./BookmarksSidebarDropdown.css";

interface BookmarksSidebarDropdownProps {
  type: BookmarksSidebarListType;
  id: string;
  title: string;
  icon?: string | null;
}

/**
 * Dropdown меню для действий с элементами сайдбара закладок
 * 
 * Отображает список доступных действий в зависимости от типа сущности.
 * Логика обработки действий вынесена в хук useBookmarksSidebarDropdown.
 */
const BookmarksSidebarDropdown: React.FC<BookmarksSidebarDropdownProps> = ({ type, id, title, icon }) => {
  const { items, handleMenuClick } = useBookmarksSidebarDropdown(type, id, title, icon);

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  return (
    <Dropdown menu={menuProps} trigger={['hover']}>
      <span 
        className="bookmarks-sidebar-dropdown" 
        onClick={(e) => e.preventDefault()}
      >
        <EllipsisOutlined />
      </span>
    </Dropdown>
  );
};

export default BookmarksSidebarDropdown;