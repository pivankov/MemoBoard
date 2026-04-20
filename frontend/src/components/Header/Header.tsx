import { useNavigate } from 'react-router';
import { Button, Typography } from 'antd';
import { BellOutlined, ExpandOutlined, LogoutOutlined, SearchOutlined } from '@ant-design/icons';

import HeaderNavigation from "components/Header/HeaderNavigation";
import { useAuth } from 'hooks/useAuth';

import "./Header.css";

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="header">
      <HeaderNavigation />
      
      <div className="header__panel">
        <Button shape="circle" icon={<ExpandOutlined />} className="header__panel-icon" />
        <Button shape="circle" icon={<SearchOutlined />} className="header__panel-icon ml-2"  />
        <Button shape="circle" icon={<BellOutlined />} className="header__panel-icon ml-2"  />
      </div>

      <div className="header__user">
        <Typography.Text className="header__user-name">
          {user?.name || user?.email}
        </Typography.Text>
        <Button
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          type="text"
          className="header__user-logout"
        >
          Выход
        </Button>
      </div>
    </div>
  );
}

export default Header;