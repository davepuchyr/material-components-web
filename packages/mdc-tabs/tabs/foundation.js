/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import MDCFoundation from '@material/base/foundation';

import {cssClasses, strings} from './constants';

export default class MDCTabsFoundation extends MDCFoundation {
  static get cssClasses() {
    return cssClasses;
  }

  static get strings() {
    return strings;
  }

  static get defaultAdapter() {
    return {
      addClass: (/* className: string */) => {},
      removeClass: (/* className: string */) => {},
      bindOnMDCTabSelectedEvent: () => {},
      unbindOnMDCTabSelectedEvent: () => {},
      registerResizeHandler: (/* handler: EventListener */) => {},
      deregisterResizeHandler: (/* handler: EventListener */) => {},
      getOffsetWidth: () => /* number */ 0,
      setStyleForIndicator: (/* propertyName: string, value: string */) => {},
      getOffsetWidthForIndicator: () => /* number */ 0,
      notifyChange: (/* evtData: {activeTabIndex: number} */) => {},
      getActiveTab: () => /* Element */ {},
      getNumberOfTabs: () => /* number */ 0,
      isTabActiveAtIndex: (/* index: number */) => /* boolean */ false,
      setTabActiveAtIndex: (/* index: number, isActive: true */) => {},
      isDefaultPreventedOnClickForTabAtIndex: (/* index: number */) => /* boolean */ false,
      setPreventDefaultOnClickForTabAtIndex: (/* index: number, preventDefaultOnClick: boolean */) => {},
      measureTabAtIndex: (/* index: number */) => {},
      getComputedWidthForTabAtIndex: (/* index: number */) => /* number */ 0,
      getComputedLeftForTabAtIndex: (/* index: number */) => /* number */ 0,
      isRTL: () => /* boolean */ false,
    };
  }

  constructor(adapter = {}) {
    super(Object.assign(MDCTabsFoundation.defaultAdapter, adapter));

    this.isIndicatorShown_ = false;
    this.computedWidth_ = 0;
    this.computedLeft_ = 0;
    this.activeTab_ = null;
    this.activeTabIndex_ = 0;
    this.layoutFrame_ = 0;
    this.resizeHandler_ = () => this.layout();
  }

  init() {
    this.adapter_.addClass(cssClasses.UPGRADED);
    this.adapter_.bindOnMDCTabSelectedEvent();
    this.adapter_.registerResizeHandler(this.resizeHandler_);
    this.activeTab_ = this.adapter_.getActiveTab();
    this.layout();
  }

  destroy() {
    this.adapter_.removeClass(cssClasses.UPGRADED);
    this.adapter_.unbindOnMDCTabSelectedEvent();
    this.adapter_.deregisterResizeHandler(this.resizeHandler_);
  }

  layout() {
    if (this.layoutFrame_) {
      cancelAnimationFrame(this.layoutFrame_);
    }

    this.layoutFrame_ = requestAnimationFrame(() => {
      this.layoutInternal_();
      this.layoutFrame_ = 0;
    });
  }

  layoutInternal_() {
    this.forEachTabIndex_((index) => this.adapter_.measureTabAtIndex(index));
    this.computedWidth_ = this.adapter_.getOffsetWidth();
    this.layoutIndicator_();
  }

  layoutIndicator_() {
    console.log(this.adapter_.getComputedLeftForTabAtIndex(this.activeTabIndex_))
    const isIndicatorFirstRender = !this.isIndicatorShown_;

    // Ensure that indicator appears in the right position immediately for correct first render.
    if (isIndicatorFirstRender) {
      this.adapter_.setStyleForIndicator('transition', 'none');
    }
   
    const translateAmtForActiveTabLeft = this.adapter_.getComputedLeftForTabAtIndex(this.activeTabIndex_);
    const scaleAmtForActiveTabWidth = this.adapter_.getComputedWidthForTabAtIndex(this.activeTabIndex_) / this.adapter_.getOffsetWidth();

    const transformValue = `translateX(${translateAmtForActiveTabLeft}px) scale(${scaleAmtForActiveTabWidth}, 1)`;
    ['-webkit-transform', 'transform'].forEach((transformProperty) => {
      this.adapter_.setStyleForIndicator(transformProperty, transformValue);
    });

    if (isIndicatorFirstRender) {
      // Force layout so that transform styles to take effect.
      this.adapter_.getOffsetWidthForIndicator();
      this.adapter_.setStyleForIndicator('transition', '');
      this.adapter_.setStyleForIndicator('visibility', 'visible');
      this.isIndicatorShown_ = true;
    }
  }

  getActiveTabIndex() {
    return this.activeTabIndex_;
  }

  getComputedWidth() {
    return this.computedWidth_;
  }

  switchToTabAtIndex(index, shouldNotify) {
    if (index === this.activeTabIndex_) {
      return;
    }
    if (index < 0 || index >= this.adapter_.getNumberOfTabs()) {
      throw new Error(`Out of bounds index specified for tab: ${index}`);
    }

    const prevActiveTabIndex = this.activeTabIndex_;
    this.activeTabIndex_ = index;
    requestAnimationFrame(() => {
      if (prevActiveTabIndex >= 0) {
        this.adapter_.setTabActiveAtIndex(prevActiveTabIndex, false);
      }
      this.adapter_.setTabActiveAtIndex(this.activeTabIndex_, false);
      this.layoutIndicator_();
      if (shouldNotify) {
        this.adapter_.notifyChange({activeTabIndex: this.activeTabIndex_});
      }
    });
  }

  findActiveTabIndex_() {
    let activeTabIndex = -1;
    this.forEachTabIndex_((index) => {
      if (this.adapter_.isTabActiveAtIndex(index)) {
        activeTabIndex = index;
        return true;
      }
    });
    return activeTabIndex;
  }

  preventsDefaultOnClick() {
    let everyTabPreventsDefaultOnClick = true;
    this.forEachTabIndex_((index) => {
      everyTabPreventsDefaultOnClick = this.adapter_.isDefaultPreventedOnClickForTabAtIndex(index);
      if (!everyTabPreventsDefaultOnClick) {
        // Break out of loop
        return true;
      }
    });

    return everyTabPreventsDefaultOnClick;
  }

  setPreventDefaultOnClick(preventDefaultOnClick) {
    this.forEachTabIndex_((index) => {
      this.adapter_.setPreventDefaultOnClickForTabAtIndex(index, preventDefaultOnClick);
    });
  }

  forEachTabIndex_(iterator) {
    const numTabs = this.adapter_.getNumberOfTabs();
    for (let index = 0; index < numTabs; index++) {
      const shouldBreak = iterator(index);
      if (shouldBreak) {
        break;
      }
    }
  }
}
