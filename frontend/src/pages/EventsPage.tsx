import Events from "components/Events/Events";

import { PAGE_TITLE_SUFFIX } from 'constants/strings';

function EventsPage() {
  return (
    <>
      <title>{`События ${PAGE_TITLE_SUFFIX}`}</title>

      <Events />
    </>
  );
}

export default EventsPage;
