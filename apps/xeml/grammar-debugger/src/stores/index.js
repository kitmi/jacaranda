import { configure } from 'mobx';

import AppStore from './AppStore';

// don't allow state modifications outside actions
configure({ enforceActions: "always" });

const appStore = new AppStore();

export {
  appStore
};