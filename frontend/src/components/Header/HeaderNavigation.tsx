import { useMemo } from "react";
import { Link } from "react-router";
import { BookOutlined, CalendarOutlined, HomeOutlined, SettingOutlined } from "@ant-design/icons";

import { useAuth } from "hooks/useAuth";

import "./HeaderNavigation.css";

const BASE_NAVIGATION = [
  {
    icon: HomeOutlined,
    title: "Главная",
    path: "/",
  },
  {
    icon: BookOutlined,
    title: "Закладки",
    path: "bookmarks",
  },
  {
    icon: CalendarOutlined,
    title: "События",
    path: "events",
  },
];

const MainNavigation: React.FC = () => {
  const { user } = useAuth();

  const items = useMemo(() => {
    if (user?.role === 'admin') {
      return [
        ...BASE_NAVIGATION,
        { icon: SettingOutlined, title: 'Администратор', path: 'admin/users' },
      ];
    }
    return BASE_NAVIGATION;
  }, [user]);

  return (
    <ul className="header-navigation">
      {items.map((item) => (
        <li className="header-navigation__item" key={item.title}>
          <Link to={item.path} className="header-navigation__item-link">
            <item.icon className="header-navigation__item-icon" />
            <span className="header-navigation__item-title">
              {item.title}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default MainNavigation;
