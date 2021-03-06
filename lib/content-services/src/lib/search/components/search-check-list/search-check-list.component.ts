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

import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { SearchWidget } from '../../search-widget.interface';
import { SearchWidgetSettings } from '../../search-widget-settings.interface';
import { SearchQueryBuilderService } from '../../search-query-builder.service';
import { SearchFilterList } from '../search-filter/models/search-filter-list.model';

export interface SearchListOption {
    name: string;
    value: string;
    checked: boolean;
}

@Component({
    selector: 'adf-search-check-list',
    templateUrl: './search-check-list.component.html',
    styleUrls: ['./search-check-list.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: { class: 'adf-search-check-list' }
})
export class SearchCheckListComponent implements SearchWidget, OnInit {

    id: string;
    settings?: SearchWidgetSettings;
    context?: SearchQueryBuilderService;
    options: SearchFilterList<SearchListOption>;
    operator: string = 'OR';
    startValue: SearchListOption = null;
    pageSize = 5;
    isActive = false;
    enableChangeUpdate = true;

    constructor() {
        this.options = new SearchFilterList<SearchListOption>();
    }

    ngOnInit(): void {
        if (this.settings) {
            this.operator = this.settings.operator || 'OR';
            this.pageSize = this.settings.pageSize || 5;

            if (this.settings.options && this.settings.options.length > 0) {
                this.options = new SearchFilterList(this.settings.options, this.pageSize);
            }

            if (this.settings.allowUpdateOnChange !== undefined &&
                this.settings.allowUpdateOnChange !== null) {
                this.enableChangeUpdate = this.settings.allowUpdateOnChange;
            }
        }

        if (this.startValue) {
            this.setValue(this.startValue);
        }
    }

    reset() {
        this.isActive = false;
        this.options.items.forEach((opt) => {
            opt.checked = false;
        });

        if (this.id && this.context) {
            this.context.queryFragments[this.id] = '';
            this.context.update();
        }
    }

    changeHandler(event: MatCheckboxChange, option: any) {
        option.checked = event.checked;
        const checkedValues = this.getCheckedValues();
        this.isActive = !!checkedValues.length;
        if (this.enableChangeUpdate) {
            this.submitValues();
        }
    }

    hasValidValue() {
        const checkedValues = this.getCheckedValues();
        return !!checkedValues.length;
    }

    getCurrentValue() {
        return this.getCheckedValues();
    }

    setValue(value: any) {
        this.options.items.filter((item) => value.includes(item.value))
            .map((item) => item.checked = true);
        this.submitValues();
    }

    private getCheckedValues() {
        return this.options.items
            .filter((option) => option.checked)
            .map((option) => option.value);
    }

    submitValues() {
        const checkedValues = this.getCheckedValues();
        const query = checkedValues.join(` ${this.operator} `);
        if (this.id && this.context) {
            this.context.queryFragments[this.id] = query;
            this.context.update();
        }
    }
}
