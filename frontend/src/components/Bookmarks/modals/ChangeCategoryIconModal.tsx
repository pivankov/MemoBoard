import { useState } from 'react';
import { Button, Flex, Modal } from 'antd';

import Icon, { isIconName } from 'components/UI/Icon/Icon'

import { useBookmarksActionsContext } from 'contexts/BookmarksActionsContext';
import { useBookmarksModalContext } from 'contexts/BookmarksModalContext';

const ICONS = [
  'Folder',
  'UserGroup',
  'Rocket',
  'Film',
  'Cake',
  'Book',
  'Camera',
  'ShoppingBag',
  'Truck',
  'User',
  'Wallet',
  'Radio',
] as const;

interface ChangeCategoryIconModalProps {
  categoryId: string;
  currentIcon?: string | null;
}

/**
 * Модальное окно для смены иконки у категории
 */
const ChangeCategoryIconModal: React.FC<ChangeCategoryIconModalProps> = ({ categoryId, currentIcon }) => {
  const { closeModal } = useBookmarksModalContext();
  const { changeCategoryIcon } = useBookmarksActionsContext();

  const [selectedIcon, setSelectedIcon] = useState<string | null>(
    currentIcon && isIconName(currentIcon) ? currentIcon : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onConfirm = async () => {
    if (!selectedIcon) return;

    setIsSubmitting(true);
    try {
      await changeCategoryIcon(categoryId, selectedIcon);
      closeModal();
    } catch (error) {
      // Ошибка обрабатывается в BookmarksActionsContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Сменить иконку категории"
      open={true}
      onCancel={closeModal}
      footer={[
        <Button key="cancel" onClick={closeModal}>
          Отмена
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={onConfirm}
          disabled={!selectedIcon || selectedIcon === currentIcon || isSubmitting}
          loading={isSubmitting}
        >
          Сменить
        </Button>,
      ]}      
    >
      <Flex gap="small" wrap className="mt-6 mb-6">
        { ICONS.map((icon) => (
            <Button
              key={icon}
              color={icon === selectedIcon ? 'primary' : 'default'}
              variant={icon === selectedIcon ? 'outlined' : 'dashed'}
              onClick={() => setSelectedIcon(icon)}
            >
              <Icon name={icon} />
            </Button>
          ))}
      </Flex>
    </Modal>
  );
};

export default ChangeCategoryIconModal;