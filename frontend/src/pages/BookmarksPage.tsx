import Bookmarks from "components/Bookmarks/Bookmarks";

import { PAGE_TITLE_SUFFIX } from 'constants/strings';

function BookmarksPage() {
  return (
    <>
      <title>{`Закладки ${PAGE_TITLE_SUFFIX}`}</title>
      
      <Bookmarks />
    </>
  );
}

export default BookmarksPage;
