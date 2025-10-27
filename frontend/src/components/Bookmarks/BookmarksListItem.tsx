import { Bookmark } from "types/bookmarks";
import { formatDateString } from "utils/date";
import { getDomainName } from "utils/http";

import "./BookmarksListItem.css";

const PREVIEW_BLANK_IMG = <svg className="bookmarks-list-item__preview-blank" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"></path></svg>

const BookmarksListItem: React.FC<Bookmark> = ({ url, title, description, createdAt }) => {
  const siteName = getDomainName(url);
  const date = formatDateString(createdAt);

  return (
    <a className="bookmarks-list-item" href={url} target="_blank" rel="noreferrer">
      <span className="bookmarks-list-item__preview">
        {PREVIEW_BLANK_IMG}
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