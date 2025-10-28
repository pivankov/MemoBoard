import Icon from 'components/UI/Icon/Icon'
import { Bookmark } from "types/bookmarks";
import { formatDateString } from "utils/date";
import { getDomainName } from "utils/http";

import "./BookmarksListItem.css";

const BookmarksListItem: React.FC<Bookmark> = ({ url, title, description, createdAt }) => {
  const siteName = getDomainName(url);
  const date = formatDateString(createdAt);

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
      </span>
    </a>
  );
};

export default BookmarksListItem;