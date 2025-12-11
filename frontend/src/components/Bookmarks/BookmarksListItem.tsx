import { useNavigate } from 'react-router';
import { Button, Flex, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, StarOutlined } from "@ant-design/icons";

import Icon from 'components/UI/Icon/Icon'
import type { BookmarksItem, BookmarksTagWithSelected } from "types/bookmarks";
import { formatDateString } from "utils/date";
import { getDomainName } from "utils/http";

import "./BookmarksListItem.css";

type BookmarksItemWithTags = Omit<BookmarksItem, 'tags'> & {
  tags: BookmarksTagWithSelected[];
  onDelete: (bookmarkId: string, categoryId: string) => void;
  onEdit: (bookmarkId: string) => void;
};

const BookmarksListItem: React.FC<BookmarksItemWithTags> = ({ id, categoryId, url, title, description, createdAt, tags, onDelete, onEdit }) => {
  const navigate = useNavigate();
  const siteName = getDomainName(url);
  const date = formatDateString(createdAt);

  const withStopEvent = <T extends any[]>(callback: (...args: T) => void) => (event: React.MouseEvent, ...args: T) => {
    event.stopPropagation();
    event.preventDefault();

    callback(...args);
  };

  const handleTagClick = withStopEvent((tagId: string) => {
    navigate(`/bookmarks/tag/${tagId}`);
  });

  const handleClickPin = withStopEvent(() => {
    console.log("pin", id);
  });

  const handleClickEdit = withStopEvent(() => {
    onEdit(id);
  });

  const handleClickDelete = withStopEvent(() => {
    onDelete(id, categoryId);
  });

  return (
    <a className="bookmarks-list-item" href={url} target="_blank" rel="noreferrer">
      <span className="bookmarks-list-item__preview">
        <div className="bookmarks-list-item__preview-blank">
          <Icon name="Photo" />
        </div>
      </span>
      <span className="bookmarks-list-item__container">
        <span className="bookmarks-list-item__title">
          {title} 
        </span>
        <span className="bookmarks-list-item__description">
          {description}
        </span>
        <span className="bookmarks-list-item__details">
          <span className="bookmarks-list-item__details-site">
            {siteName}
          </span>
          <span className="bookmarks-list-item__details-sep"></span>
          <span className="bookmarks-list-item__details-date">
            {date}
          </span>
        </span>
        <span className="bookmarks-list-item__tags">
          {
            tags.map((tag) => (
              <Tag 
                key={tag.id} 
                onClick={(e) => handleTagClick(e, tag.id)} 
                color={tag.selected ? "blue" : ""}
                style={{ cursor: 'pointer' }}
              >
                {tag.title}
              </Tag>
            ))
          }
        </span>
        <span className="bookmarks-list-item__buttons">
          <Flex wrap gap="small">
            <Button variant="solid" color="gold" shape="circle" icon={<StarOutlined />} onClick={handleClickPin} />
            <Button variant="solid" color="cyan" shape="circle" icon={<EditOutlined />} onClick={handleClickEdit} />
            <Button variant="solid" color="danger" shape="circle" icon={<DeleteOutlined />} onClick={handleClickDelete} />
          </Flex>
        </span>
      </span>
    </a>
  );
};

export default BookmarksListItem;