import { useNavigate } from 'react-router';
import { Button, Result } from 'antd';

const BookmarksNotFound: React.FC<{ type: 'category' | 'tag'} > = ({ type }) => {
  const navigate = useNavigate();
  
  const entityLabel = type === 'category' ? 'Категория' : 'Тег';

  const text = {
    category: {
      title: `${entityLabel} не найдена`,
      subTitle: `${entityLabel}, которую вы ищете, не существует или была удалена.`,
    },
    tag: {
      title: `${entityLabel} не найден`,
      subTitle: `${entityLabel}, который вы ищете, не существует или был удален.`,
    },
  };
  
  return (
    <Result
      status="404"
      title={text[type].title}
      subTitle={text[type].subTitle}
      extra={
        <Button type="primary" onClick={() => navigate('/bookmarks')}>
          Вернуться к закладкам
        </Button>
      }
    />
  );
};

export default BookmarksNotFound;