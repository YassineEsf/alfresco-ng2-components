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

import { ApiService, ApplicationsUtil, FormFields, LoginPage, UsersActions } from '@alfresco/adf-testing';
import { browser, by } from 'protractor';
import { NavigationBarPage } from '../core/pages/navigation-bar.page';
import { AttachFormPage } from './pages/attach-form.page';
import { TasksPage } from './pages/tasks.page';
import { TaskDetailsPage } from './pages/task-details.page';
import { TaskRepresentation } from '@alfresco/js-api';
import CONSTANTS = require('../util/constants');

describe('Attach Form Component', () => {
    const app = browser.params.resources.Files.SIMPLE_APP_WITH_USER_FORM;

    const loginPage = new LoginPage();
    const taskPage = new TasksPage();
    const taskDetailsPage = new TaskDetailsPage();
    const attachFormPage = new AttachFormPage();
    const formFields = new FormFields();
    const navigationBarPage = new NavigationBarPage();

    const apiService = new ApiService();
    const usersActions = new UsersActions(apiService);
    const applicationService = new ApplicationsUtil(apiService);

    const formTextField = app.form_fields.form_fieldId;
    let user, tenantId, appModel;

    const testNames = {
        taskName: 'Test Task',
        formTitle: 'Select Form To Attach',
        formName: 'Simple form',
        widgetTitle: 'textfield',
        formFieldValue: 'Test value'
    };

    beforeAll(async () => {
        await apiService.loginWithProfile('admin');

        user = await usersActions.createUser();

        tenantId = user.tenantId;

        await apiService.login(user.username, user.password);

        appModel = await applicationService.importPublishDeployApp(app.file_path);

        await apiService.getInstance().activiti.taskApi.createNewTask(new TaskRepresentation({ name: testNames.taskName }));

        await loginPage.login(user.username, user.password);
   });

    afterAll(async () => {
        await apiService.getInstance().activiti.modelsApi.deleteModel(appModel.id);
        await apiService.loginWithProfile('admin');
        await apiService.getInstance().activiti.adminTenantsApi.deleteTenant(tenantId);
   });

    it('[C280047] Should be able to view the attach-form component after creating a standalone task', async () => {
        await (await (await navigationBarPage.navigateToProcessServicesPage()).goToTaskApp()).clickTasksButton();

        await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.MY_TASKS);
        await taskPage.tasksListPage().selectRow(testNames.taskName);

        await taskPage.taskDetails().checkStandaloneNoFormMessageIsDisplayed();
        await taskPage.taskDetails().checkAttachFormButtonIsDisplayed();
        await taskPage.taskDetails().checkCompleteTaskButtonIsDisplayed();
    });

    it('[C280048] Should be able to view the attach-form component after clicking cancel button', async () => {
        await (await (await navigationBarPage.navigateToProcessServicesPage()).goToTaskApp()).clickTasksButton();

        await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.MY_TASKS);
        await taskPage.tasksListPage().selectRow(testNames.taskName);

        await taskPage.taskDetails().clickAttachFormButton();
        await attachFormPage.checkDefaultFormTitleIsDisplayed(testNames.formTitle);
        await attachFormPage.checkFormDropdownIsDisplayed();
        await attachFormPage.checkCancelButtonIsDisplayed();
        await attachFormPage.checkAttachFormButtonIsDisabled();
        await attachFormPage.selectAttachFormOption(testNames.formName);

        await formFields.checkWidgetIsReadOnlyMode(testNames.widgetTitle);

        await attachFormPage.clickCancelButton();
        await taskPage.taskDetails().checkAttachFormButtonIsDisplayed();
    });

    it('[C280017] Should be able to attach a form on a standalone task and complete', async () => {
        await (await (await navigationBarPage.navigateToProcessServicesPage()).goToTaskApp()).clickTasksButton();

        await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.MY_TASKS);
        await taskPage.tasksListPage().selectRow(testNames.taskName);

        await taskDetailsPage.clickAttachFormButton();
        await attachFormPage.selectAttachFormOption(testNames.formName);
        await attachFormPage.clickAttachFormButton();

        await formFields.setFieldValue(by.id, formTextField, testNames.formFieldValue);
        await formFields.completeForm();

        await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.COMPLETED_TASKS);
        await taskPage.tasksListPage().selectRow(testNames.taskName);

        await expect(await formFields.getFieldValue(formTextField)).toEqual(testNames.formFieldValue);
    });
});
