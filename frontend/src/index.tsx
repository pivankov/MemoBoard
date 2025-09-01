// Фикс для работы ant-v5 с React 19. Можно будет убрать в будущем.. Так же, вырезать из package.json
import '@ant-design/v5-patch-for-react-19';

import ReactDOM from 'react-dom/client';
import App from './App';

import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';

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