import { useNavigate } from 'react-router';
import { Button, Flex, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, RollbackOutlined, StarFilled, StarOutlined } from "@ant-design/icons";

import Icon from 'components/UI/Icon/Icon'
import type { BookmarksItem, BookmarksTagWithSelected } from "types/bookmarks";
import { formatDateString } from "utils/date";
import { getDomainName } from "utils/http";

import { API_STATIC_BASE_URL } from "constants/api";

import "./BookmarksListItem.css";

type BookmarksItemWithTags = Omit<BookmarksItem, 'tags'> & {
  tags: BookmarksTagWithSelected[];
  onEdit: (bookmarkId: string) => void;
  onDelete: (bookmarkId: string, isInTrash: boolean) => void;
  onRestore: (bookmarkId: string) => void;
  onToggleFavorite: (bookmarkId: string) => void;
};

const BookmarksListItem: React.FC<BookmarksItemWithTags> = ({ id, url, title, description, createdAt, tags, preview, favorite, inTrash, onEdit, onDelete, onRestore, onToggleFavorite }) => {
  const navigate = useNavigate();
  const siteName = getDomainName(url);
  const date = formatDateString(createdAt);
  const previewPath = preview ? `${API_STATIC_BASE_URL}${preview}` : undefined;
  const hasTags = tags.length > 0;

  const withStopEvent = <T extends any[]>(callback: (...args: T) => void) => (event: React.MouseEvent, ...args: T) => {
    event.stopPropagation();
    event.preventDefault();

    callback(...args);
  };

  const handleTagClick = withStopEvent((tagId: string) => {
    navigate(`/bookmarks/tag/${tagId}`);
  });

  const handleToggleFavorite = withStopEvent(() => {
    onToggleFavorite(id);
  });

  const handleClickEdit = withStopEvent(() => {
    onEdit(id);
  });

  const handleClickDelete = withStopEvent(() => {
    onDelete(id, inTrash ?? false);
  });

  const handleClickRestore = withStopEvent(() => {
    onRestore(id);
  });

  return (
    <a className="bookmarks-list-item" href={url} target="_blank" rel="noreferrer">
      <span className="bookmarks-list-item__preview">
        { previewPath ? (
            <img src={previewPath} alt="" />
          ) : (
            <Icon name="Photo" />
          ) }
      </span>
      <span className="bookmarks-list-item__container">
        <span className="bookmarks-list-item__title">
          {title} 
        </span>
        <span className="bookmarks-list-item__description">
          {description}
        </span>
        <span className="bookmarks-list-item__details">
          { favorite && (
            <span className="bookmarks-list-item__details-favorite">
              <StarFilled color="gold" />
            </span>
          ) }
          <span className="bookmarks-list-item__details-site">
            {siteName}
          </span>
          <span className="bookmarks-list-item__details-sep"></span>
          <span className="bookmarks-list-item__details-date">
            {date}
          </span>
        </span>
        { hasTags && (
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
        ) }
        <span className="bookmarks-list-item__buttons">
          <Flex wrap gap="small">
            { !inTrash && (
              <>
                <Button variant="solid" color="gold" shape="circle" icon={<StarOutlined />} onClick={handleToggleFavorite} />
                <Button variant="solid" color="cyan" shape="circle" icon={<EditOutlined />} onClick={handleClickEdit} />
              </>
            ) }
            { inTrash && (
              <Button variant="solid" color="green" shape="circle" icon={<RollbackOutlined />} onClick={handleClickRestore} />
            ) }
            <Button variant="solid" color="danger" shape="circle" icon={<DeleteOutlined />} onClick={handleClickDelete} />
          </Flex>
        </span>
      </span>
    </a>
  );
};

export default BookmarksListItem;