import { Button } from 'antd';
import { BellOutlined,ExpandOutlined, SearchOutlined } from '@ant-design/icons';

import HeaderNavigation from "components/Header/HeaderNavigation";

import "./Header.css";

const Header: React.FC = () => {
  return (
    <div className="header">
      <HeaderNavigation />
      
      <div className="header__panel">
        <Button shape="circle" icon={<ExpandOutlined />} className="header__panel-icon" />
        <Button shape="circle" icon={<SearchOutlined />} className="header__panel-icon ml-2"  />
        <Button shape="circle" icon={<BellOutlined />} className="header__panel-icon ml-2"  />
      </div>
    </div>
  );
}

export default Header;