'use babel';

import { updateLogin as update } from '../data/atomforces-actions';
import LoginStore from '../data/login-store';
import CodeforcesScraper from './codeforces-scraper';
import Dialog from '../dialog/dialog';
import { handleError } from '../utils';

export function updateLogin() {
    const expected = LoginStore.getHandle();
    if (!expected) {
        update({ loggedIn: false });
        return Promise.resolve();
    }

    return CodeforcesScraper.getHandle().then(actual => {
        if (expected === actual) {
            update({ loggedIn: true });
            return;
        }
        if (actual) {
            return CodeforcesScraper.logout().then(() => {
                update({ loggedIn: false });
            });
        } else {
            update({ loggedIn: false });
        }
    }).catch(error => {
        handleError(error, 'Error during login update');
        update({ loggedIn: false });
    });
}

export function ensureLogin() {
    const openDialog = (resolve, reject)=>{
        console.log("Opening dialog");
        const dialog = new Dialog({
            promptText: `Enter password for user ${LoginStore.getHandle()}`,
            onConfirm: password => {
                dialog.close();
                CodeforcesScraper.login(LoginStore.getHandle(), password).then(() => {
                    updateLogin().then(() => {
                        if (!LoginStore.isLoggedIn()) {
                            atom.notifications.addError('Codeforces login was not possible.');
                        }
                        resolve();
                    });
                });
            },
            onCancel: () => resolve(),
            checkInput: () => true,
            isPassword: true
        });
        dialog.attach();
    }

    return updateLogin().then(() => {
        if (LoginStore.isLoggedIn()) return;
        if (!LoginStore.getHandle()) return;

        return new Promise((resolve, reject) => {
            var password = LoginStore.getData().password || atom.config.get('atomforces.accountPassword');
            if(password!='null'){
                CodeforcesScraper.login(LoginStore.getHandle(), password).then(() => {
                    updateLogin().then(() => {
                        if (!LoginStore.isLoggedIn()) {
                            // console.log("Login Error");
                            openDialog(resolve, reject)
                        }else{
                          resolve();
                        }
                    });
                })
            }else{
                openDialog(resolve, reject)
            }
        });
    });
}

export function logout() {
    CodeforcesScraper.logout().then(updateLogin).catch(error => {
        handleError(error, 'Error during logout');
    });
}
