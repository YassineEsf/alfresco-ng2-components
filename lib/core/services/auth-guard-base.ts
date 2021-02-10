/*!
 * @license
 * Copyright 2019 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    Router,
    CanActivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    CanActivateChild,
    UrlTree
} from '@angular/router';
import { AuthenticationService } from './authentication.service';
import {
    AppConfigService,
    AppConfigValues
} from '../app-config/app-config.service';
import { OauthConfigModel } from '../models/oauth-config.model';
import { MatDialog } from '@angular/material/dialog';
import { StorageService } from './storage.service';
import { Observable } from 'rxjs';

export abstract class AuthGuardBase implements CanActivate, CanActivateChild {

    protected get withCredentials(): boolean {
        return this.appConfigService.get<boolean>(
            'auth.withCredentials',
            false
        );
    }

    constructor(
        protected authenticationService: AuthenticationService,
        protected router: Router,
        protected appConfigService: AppConfigService,
        protected dialog: MatDialog,
        private storageService: StorageService
    ) {
    }

    abstract checkLogin(
        activeRoute: ActivatedRouteSnapshot,
        redirectUrl: string
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree;

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

        if (this.authenticationService.isLoggedIn() && this.authenticationService.isOauth() && this.isLoginFragmentPresent()) {
            return this.redirectSSOSuccessURL();
        }

        return this.checkLogin(route, state.url);
    }

    canActivateChild(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        return this.canActivate(route, state);
    }

    protected async redirectSSOSuccessURL(): Promise<boolean> {
        const redirectFragment = this.storageService.getItem('loginFragment');

        if (redirectFragment && this.getLoginRoute() !== redirectFragment) {
            this.storageService.removeItem('loginFragment');
            return this.navigate(redirectFragment);
        }

        return true;
    }

    protected async isLoginFragmentPresent(): Promise<boolean> {
        return !!this.storageService.getItem('loginFragment');
    }

    protected async redirectToUrl(url: string): Promise<boolean> {
        let urlToRedirect = `/${this.getLoginRoute()}`;

        if (!this.authenticationService.isOauth()) {
            this.authenticationService.setRedirect({
                provider: this.getProvider(),
                url
            });

            urlToRedirect = `${urlToRedirect}?redirectUrl=${url}`;
            return this.navigate(urlToRedirect);
        } else if (this.getOauthConfig().silentLogin && !this.authenticationService.isPublicUrl()) {
            this.authenticationService.ssoImplicitLogin();
        } else {
            return this.navigate(urlToRedirect);
        }

        return false;
    }

    protected navigate(url: string): Promise<boolean> {
        this.dialog.closeAll();
        return this.router.navigateByUrl(url);
    }

    protected getOauthConfig(): OauthConfigModel {
        return (
            this.appConfigService &&
            this.appConfigService.get<OauthConfigModel>(
                AppConfigValues.OAUTHCONFIG,
                null
            )
        );
    }

    protected getLoginRoute(): string {
        return (
            this.appConfigService &&
            this.appConfigService.get<string>(
                AppConfigValues.LOGIN_ROUTE,
                'login'
            )
        );
    }

    protected getProvider(): string {
        return (
            this.appConfigService &&
            this.appConfigService.get<string>(
                AppConfigValues.PROVIDERS,
                'ALL'
            )
        );
    }

    protected isOAuthWithoutSilentLogin(): boolean {
        const oauth = this.appConfigService.get<OauthConfigModel>(
            AppConfigValues.OAUTHCONFIG,
            null
        );
        return (
            this.authenticationService.isOauth() && !!oauth && !oauth.silentLogin
        );
    }

    protected isSilentLogin(): boolean {
        const oauth = this.appConfigService.get<OauthConfigModel>(
            AppConfigValues.OAUTHCONFIG,
            null
        );

        return this.authenticationService.isOauth() && oauth && oauth.silentLogin;
    }

}
