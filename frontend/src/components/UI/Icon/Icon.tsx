import {
  ArchiveBoxIcon,
  ArrowsPointingOutIcon,
  BellIcon,
  CheckIcon,
  DocumentDuplicateIcon,
  DocumentIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  FilmIcon,
  FolderIcon,
  HomeIcon,
  InboxIcon,
  InboxStackIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  PhotoIcon,
  PlusIcon,
  QrCodeIcon,
  RocketLaunchIcon,
  StarIcon,
  TagIcon,
  TrashIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  MagnifyingGlassIcon as SearchIconSolid,
  PencilSquareIcon as PencilSquareIconSolid,
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid';

import styles from "./Icon.module.css";

const ICON_NAMES = {
  Home: HomeIcon,
  QrCode: QrCodeIcon,
  Document: DocumentIcon,
  DocumentDuplicate: DocumentDuplicateIcon,
  Bell: BellIcon,
  Search: MagnifyingGlassIcon,
  SearchSolid: SearchIconSolid,
  Expand: ArrowsPointingOutIcon,
  ExclamationTriangle: ExclamationTriangleIcon,
  ExclamationCircle: ExclamationCircleIcon,
  Trash: TrashIcon,
  Airplane: PaperAirplaneIcon,
  Inbox: InboxIcon,
  InboxStack: InboxStackIcon,
  Star: StarIcon,
  StarSolid: StarIconSolid,
  Plus: PlusIcon,
  Tag: TagIcon,
  XMark: XMarkIcon,
  ArchiveBox: ArchiveBoxIcon,
  Edit: PencilSquareIcon,
  EditSolid: PencilSquareIconSolid,
  Check: CheckIcon,
  Folder: FolderIcon,
  UserGroup: UserGroupIcon,
  Rocket: RocketLaunchIcon,
  Film: FilmIcon,
  Photo: PhotoIcon,
} as const;

type IconName = keyof typeof ICON_NAMES;

interface IconProps {
  name: IconName;
}

export const isIconName = (value: string): value is IconName =>
  Object.prototype.hasOwnProperty.call(ICON_NAMES, value);

const Icon: React.FC<IconProps> = ({ name }) => {
  const Icon = ICON_NAMES[name];
  const isSolid = name ? name.toLowerCase().endsWith('solid') : null;

  let cls = styles.icon;

  if (isSolid) {
    cls += ` ${styles.solid}`;
  }

  return <Icon className={cls} />;
};

export default Icon;