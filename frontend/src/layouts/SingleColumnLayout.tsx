import React from 'react';

import "./SingleColumnLayout.css";

interface SingleColumnLayoutProps {
  children: React.ReactNode;
}

/**
 * Лейаут для страниц с одной колонкой контента
 */
function SingleColumnLayout({ children }: SingleColumnLayoutProps) {
  return (
    <div className="single-column-layout">
      <div className="single-column-layout__content">
        {children}
      </div>
    </div>
  );
}

export default SingleColumnLayout;
