import { useNavigate } from 'react-router';
import { Tag } from 'antd';

import Icon from 'components/UI/Icon/Icon'
import type { BookmarksItem, BookmarksTagWithSelected } from "types/bookmarks";
import { formatDateString } from "utils/date";
import { getDomainName } from "utils/http";

import "./BookmarksListItem.css";

type BookmarksItemWithTags = Omit<BookmarksItem, 'tags'> & {
  tags: BookmarksTagWithSelected[];
};

const BookmarksListItem: React.FC<BookmarksItemWithTags> = ({ url, title, description, createdAt, tags }) => {
  const navigate = useNavigate();
  const siteName = getDomainName(url);
  const date = formatDateString(createdAt);

  const handleTagClick = (event: React.MouseEvent, tagId: string) => {
    event.stopPropagation();
    event.preventDefault();
    
    navigate(`/bookmarks/tag/${tagId}`);
  };

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
      </span>
    </a>
  );
};

export default BookmarksListItem;