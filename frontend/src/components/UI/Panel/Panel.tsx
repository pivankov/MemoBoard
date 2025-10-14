import { Button } from 'antd';
import { CloseOutlined } from "@ant-design/icons";

import "./Panel.css";

const Panel: React.FC<{ children: React.ReactNode, isOpened: boolean, title: string, onClose: () => void, }> = ({ children, title, isOpened, onClose }) => {
  return (
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
  );
};

export default Panel;