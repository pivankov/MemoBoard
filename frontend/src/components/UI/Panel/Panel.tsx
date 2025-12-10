import { useEffect, useState } from 'react';
import { Button } from 'antd';
import { CloseOutlined } from "@ant-design/icons";

import "./Panel.css";

const ANIMATION_DURATION = 200; // Время из transition-duration в CSS

const Panel: React.FC<{ children: React.ReactNode, isOpened: boolean, title: string, onClose: () => void, }> = ({ children, title, isOpened, onClose }) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpened) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, ANIMATION_DURATION); 
      
      return () => clearTimeout(timer);
    }
  }, [isOpened]);

  if (!shouldRender) {
    return null;
  }  

  return (
    <>
      { isOpened && <div className="overlay" onClick={onClose}></div> }
      <div className={isOpened ? 'panel panel--opened' : 'panel'}>
        <Button className="panel__close" shape="circle" type="text" icon={<CloseOutlined />} size="large" onClick={onClose} />
        
        <div className="panel__wrapper">
          <div className="panel__body">
            <div className="panel__title">
              {title}
            </div>
            
            {children}
          </div>
        </div>
      </div>    
    </>
  );
};

export default Panel;