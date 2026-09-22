import ExtensionApiTokensManager from "components/ExtensionApiTokensManager/ExtensionApiTokensManager";

import { PAGE_TITLE_SUFFIX } from 'constants/strings';

function SettingsPage() {
  return (
    <>
      <title>{`Настройки ${PAGE_TITLE_SUFFIX}`}</title>

      <ExtensionApiTokensManager />
    </>
  );
}

export default SettingsPage;
