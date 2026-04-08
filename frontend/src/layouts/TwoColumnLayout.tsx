import React from 'react';

import "./TwoColumnLayout.css";

interface TwoColumnLayoutProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
}

/**
 * Лейаут для страниц с двумя колонками
 * Левая колонка - боковая панель, правая - основной контент
 */
function TwoColumnLayout({ sidebar, content }: TwoColumnLayoutProps) {
  return (
    <div className="two-column-layout" id="two-column-layout">
      <aside className="two-column-layout__sidebar">
        {sidebar}
      </aside>
      <main className="two-column-layout__content">
        {content}
      </main>
    </div>
  );
}

export default TwoColumnLayout;