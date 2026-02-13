import { Result } from 'antd';

import SingleColumnLayout from 'layouts/SingleColumnLayout';

/**
 * Страница 404 - отображается при переходе на несуществующий маршрут
 */
function NotFoundPage() {
  return (
    <SingleColumnLayout>
      <Result
        status="404"
        title="404"
        subTitle="Страница не найдена"
      />
    </SingleColumnLayout>
  );
}

export default NotFoundPage;