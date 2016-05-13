/**
 * @license
 * Copyright 2016 Alfresco Software, Ltd.
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
System.register(['angular2/core', 'angular2/http', 'rxjs/Observable'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata = (this && this.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    var core_1, http_1, Observable_1;
    var AlfrescoTranslationLoader;
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (http_1_1) {
                http_1 = http_1_1;
            },
            function (Observable_1_1) {
                Observable_1 = Observable_1_1;
            }],
        execute: function() {
            AlfrescoTranslationLoader = (function () {
                function AlfrescoTranslationLoader(http) {
                    this.http = http;
                    this.prefix = 'i18n';
                    this.suffix = '.json';
                }
                AlfrescoTranslationLoader.prototype.getTranslation = function (lang) {
                    var _this = this;
                    return Observable_1.Observable.create(function (observer) {
                        Observable_1.Observable.forkJoin(_this.http.get(_this.prefix + "/" + lang + _this.suffix).map(function (res) { return res.json(); }), _this.http.get('node_modules/ng2-alfresco-upload/' + (_this.prefix + "/" + lang + _this.suffix)).map(function (res) { return res.json(); }), _this.http.get('node_modules/ng2-alfresco-login/' + (_this.prefix + "/" + lang + _this.suffix)).map(function (res) { return res.json(); })).subscribe(function (data) {
                            var multiLanguage = JSON.parse((JSON.stringify(data[0])
                                + JSON.stringify(data[1])
                                + JSON.stringify(data[2])).replace(/}{/g, ","));
                            observer.next(multiLanguage);
                            observer.complete();
                        });
                    });
                };
                AlfrescoTranslationLoader = __decorate([
                    core_1.Injectable(), 
                    __metadata('design:paramtypes', [http_1.Http])
                ], AlfrescoTranslationLoader);
                return AlfrescoTranslationLoader;
            }());
            exports_1("AlfrescoTranslationLoader", AlfrescoTranslationLoader);
        }
    }
});
//# sourceMappingURL=AlfrescoTranslationService.js.map