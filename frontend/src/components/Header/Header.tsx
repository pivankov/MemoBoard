import { Button } from 'antd';
import { ExpandOutlined, SearchOutlined, BellOutlined } from '@ant-design/icons';

import HeaderNavigation from "./HeaderNavigation";

import "./Header.css";
import logoImg from "../../assets/img/logo-text.svg";

const Header: React.FC = () => {
  return (
    <div className="header">
      <div className="header__logo">
        <img src={logoImg} alt="" />
      </div>

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