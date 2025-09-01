import { Outlet } from 'react-router';

import Header from '../components/Header/Header';

import "./RootLayout.css"

function RootLayout() {
  return (
    <div className="root-layout">
      <div className="root-layout__wrapper">
        <div className="root-layout__header">
          <Header />
        </div>
        <div className="root-layout__body">
          <Outlet />
        </div>
        <div className="root-layout__footer">
          MemoBoard © 2025
        </div>
      </div>
    </div>
  );
};

export default RootLayout;