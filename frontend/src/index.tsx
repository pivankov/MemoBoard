// Фикс для работы ant-v5 с React 19. Можно будет убрать в будущем.. Так же, вырезать из package.json
import { ConfigProvider } from 'antd';

import '@ant-design/v5-patch-for-react-19';
import App from './App';
import ruRU from 'antd/locale/ru_RU';
import ReactDOM from 'react-dom/client';

import './index.css';

const theme = {
  token: {
    controlHeight: 34,
    borderRadius: 6,
    fontFamily: 'Inter',
  },  
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <ConfigProvider locale={ruRU} theme={theme}>
    <App />
  </ConfigProvider>
);
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );