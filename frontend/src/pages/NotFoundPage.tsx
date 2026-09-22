import { Result } from 'antd';

import SingleColumnLayout from 'layouts/SingleColumnLayout';

import { PAGE_TITLE_SUFFIX } from 'constants/strings';

/**
 * Страница 404 - отображается при переходе на несуществующий маршрут
 */
function NotFoundPage() {
  return (
    <>
      <title>{`404 ${PAGE_TITLE_SUFFIX}`}</title>

      <SingleColumnLayout>
        <Result
          status="404"
          title="404"
          subTitle="Страница не найдена"
        />
      </SingleColumnLayout>      
    </>
  );
}

export default NotFoundPage;