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
    ApiService,
    ApplicationsUtil,
    LoginPage,
    ProcessUtil,
    UsersActions,
    Widget
} from '@alfresco/adf-testing';
import { TasksPage } from '../pages/tasks.page';
import { browser } from 'protractor';
import CONSTANTS = require('../../util/constants');
import { NavigationBarPage } from '../../core/pages/navigation-bar.page';
import { ProcessServicesPage } from '../pages/process-services.page';

describe('Radio Buttons Widget', () => {

    const app = browser.params.resources.Files.WIDGET_CHECK_APP.RADIO_BUTTONS;

    const loginPage = new LoginPage();
    const taskPage = new TasksPage();
    const widget = new Widget();
    const navigationBarPage = new NavigationBarPage();

    const apiService = new ApiService();
    const usersActions = new UsersActions(apiService);
    const applicationsService = new ApplicationsUtil(apiService);

    let appModel;
    let deployedApp, process;
    let processUserModel;

    beforeAll(async () => {
       await apiService.loginWithProfile('admin');

       processUserModel = await usersActions.createUser();

       await apiService.login(processUserModel.username, processUserModel.password);
       appModel = await applicationsService.importPublishDeployApp(browser.params.resources.Files.WIDGET_CHECK_APP.file_path);

       const appDefinitions = await apiService.getInstance().activiti.appsApi.getAppDefinitions();
       deployedApp = appDefinitions.data.find((currentApp) => {
            return currentApp.modelId === appModel.id;
        });

       process = await new ProcessUtil(apiService).startProcessByDefinitionName(appModel.name, app.processName);
       await loginPage.login(processUserModel.username, processUserModel.password);
   });

    beforeEach(async () => {
        await navigationBarPage.clickHomeButton();
        await (new ProcessServicesPage()).goToAppByAppId(deployedApp.id);

        await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.MY_TASKS);
        await taskPage.formFields().checkFormIsDisplayed();
    });

    afterAll(async () => {
        await apiService.getInstance().activiti.processApi.deleteProcessInstance(process.id);
        await apiService.loginWithProfile('admin');
        await apiService.getInstance().activiti.adminTenantsApi.deleteTenant(processUserModel.tenantId);
   });

    it('[C277316] Should display empty radio buttons when no preselection is configured', async () => {
        await widget.checkboxWidget().clickCheckboxInput(app.FIELD.checkbox_id);
        await widget.radioWidget().isSelectionClean(app.FIELD.radio_buttons_id);
    });

    it('[C274704] Should be able to set visibility properties for Radio Button widget', async () => {
        await taskPage.formFields().checkWidgetIsHidden(app.FIELD.radio_buttons_id);
        await expect(await taskPage.formFields().isCompleteFormButtonEnabled()).toEqual(false);

        await widget.checkboxWidget().clickCheckboxInput(app.FIELD.checkbox_id);
        await expect(await widget.radioWidget().getRadioWidgetLabel(app.FIELD.radio_buttons_id)).toContain('Radio posts');
        await widget.radioWidget().selectOption(app.FIELD.radio_buttons_id, 1);
        await expect(await taskPage.formFields().isCompleteFormButtonEnabled()).toEqual(true);
    });
});
