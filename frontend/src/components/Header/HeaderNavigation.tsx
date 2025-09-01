import { Link } from "react-router";
import { HomeOutlined, BookOutlined, CalendarOutlined } from "@ant-design/icons";

import "./HeaderNavigation.css";

const NAVIGATION = [
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
  return (
    <ul className="header-navigation">
      {NAVIGATION.map((item) => (
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