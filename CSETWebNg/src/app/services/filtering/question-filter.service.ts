////////////////////////////////
//
//   Copyright 2022 Battelle Energy Alliance, LLC
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in all
//  copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
//  SOFTWARE.
//
////////////////////////////////
import { Injectable } from '@angular/core';
import { Category, Domain } from '../../models/questions.model';
import { AssessmentService } from '../assessment.service';

/**
 * A new generic filtering service separate from maturity level filtering that was done
 * specifically for ACET.  That logic is in AcetFilterService.
 */
@Injectable({
  providedIn: 'root'
})
export class QuestionFilterService {

  /**
   * The allowable filter values.  Used for "select all"
   */
  readonly allowableFilters = ['Y', 'N', 'NA', 'A', 'I', 'S', 'U', 'C', 'M', 'D', 'FB'];


  /**
   * This is a list of what to SHOW.
   * 
   * Filter settings
   *   Comments - C
   *   Marked For Review - M
   *   Discoveries (Observations) - D
   */
  public showFilters: string[];

  /**
   * Filters that are turned on at the start.
   */
  public defaultFilterSettings = ['Y', 'N', 'NA', 'A', 'I', 'S', 'U', 'C', 'M', 'D', 'FB'];

  /**
   * If the user enters characters into the box, only questions containing that string
   * are visible.
   */
  public filterSearchString = '';

  /**
   * Valid 'answer'-type filter values.  Defaulted to these (for standards)
   * but overrideable by a maturity model.
   */
  public answerOptions: string[] = ['Y', 'N', 'NA', 'A', 'I', 'U'];

  /**
   * Consuming pages can set a model ID 
   */
  public maturityModelId: number;


  /**
   * Constructor
   * @param assessSvc 
   */
  constructor(
    private assessSvc: AssessmentService
  ) {
    this.refresh();
  }

  /**
   * Reset the filters back to default settings.
   */
  refresh() {
    this.showFilters = this.defaultFilterSettings;
  }

  /**
 * Returns true if we have any inclusion filters turned off.
 * We don't count MT+ for this, since it is normally turned off.
 */
  isFilterEngaged() {
    if (this.filterSearchString.length > 0) {
      return true;
    }

    // see if any filters (not counting MT+) are turned off
    const e = (this.remove(this.allowableFilters, 'MT+').length !== this.remove(this.showFilters, 'MT+').length);

    return e;
  }


  /**
   * Indicates if the specified answer filter is currently 'on'
   * @param ans
   */
  filterOn(ans: string) {
    if (ans === 'ALL') {
      if (this.arraysAreEqual(this.remove(this.showFilters, 'MT+'), this.remove(this.allowableFilters, 'MT+'))) {
        return true;
      } else {
        return false;
      }
    }
    return (this.showFilters.indexOf(ans) >= 0);
  }

  /**
   * Adds or removes the specified answer.
   * @param ans
   * @param show
   */
  setFilter(ans: string, show: boolean) {
    if (ans === 'ALL') {
      if (show) {
        this.showFilters = this.allowableFilters.slice();
        this.showFilters = this.remove(this.showFilters, 'MT+');
      } else {
        this.showFilters = [];
      }
      return;
    }

    if (show) {
      if (this.showFilters.indexOf(ans) < 0) {
        this.showFilters.push(ans);
      }
    } else {
      const i = this.showFilters.indexOf(ans);
      if (i >= 0) {
        this.showFilters.splice(i, 1);
      }
    }
  }


  /**
   * Utility method.  Should be moved somewhere common.
   */
  arraysAreEqual(a1: any[], a2: any[]) {
    if (a1.length !== a2.length) {
      return false;
    }

    for (let i = 0, l = a1.length; i < l; i++) {
      if (a1[i] instanceof Array && a2[i] instanceof Array) {
        if (!a1[i].equals(a2[i])) {
          return false;
        }
      } else if (a1[i] !== a2[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns an array with the target removed.
   * @param a 
   * @param target 
   */
  remove(a: any[], target: any) {
    const a1 = a.slice();
    const idx = a1.indexOf(target);
    if (idx >= 0) {
      a1.splice(idx, 1);
    }
    return a1;
  }

  /**
   * This is an overload of evaluateFilters, which takes a list
   * of Domains.  This version wraps the category list in
   * a dummy Domain and calls evaluateFilters.
   * @param categories 
   */
  public evaluateFiltersForCategories(categories: Category[]) {
    var dummyDomain: Domain = {
      categories: [],
      displayText: '',
      domainName: '',
      domainText: '',
      isDomain: true,
      setName: '',
      setShortName: '',
      visible: true
    };
    dummyDomain.categories = categories;

    var dummyDomainList = [];
    dummyDomainList.push(dummyDomain);

    return this.evaluateFilters(dummyDomainList);
  }


  /**
   * Sets the Visible property on all Questions, Subcategories and Categories
   * based on the current filter settings.
   * @param cats
   */
  public evaluateFilters(domains: Domain[]) {
    if (!domains) {
      return;
    }

    const filterStringLowerCase = this.filterSearchString.toLowerCase();

    domains.forEach(d => {
      d.categories.forEach(c => {
        c.subCategories.forEach(s => {
          s.questions.forEach(q => {
            // start with false, then set true if possible
            q.visible = false;

            // If search string is specified, any questions that don't contain the string
            // are not shown.  No need to check anything else.
            if (this.filterSearchString.length > 0
              && q.questionText.toLowerCase().indexOf(filterStringLowerCase) < 0) {
              return;
            }

            // evaluate answers
            if (this.answerOptions.includes(q.answer) && this.showFilters.includes(q.answer)) {
              q.visible = true;
            }

            // consider null answers as 'U'
            if ((q.answer == null || q.answer == 'U') && this.showFilters.includes('U')) {
              q.visible = true;
            }

            // evaluate other features
            if (this.showFilters.includes('C') && q.comment && q.comment.length > 0) {
              q.visible = true;
            }

            if (this.showFilters.includes('FB') && q.feedback && q.feedback.length > 0) {
              q.visible = true;
            }

            if (this.showFilters.includes('M') && q.markForReview) {
              q.visible = true;
            }

            if (this.showFilters.includes('D') && q.hasDiscovery) {
              q.visible = true;
            }
          });

          // evaluate subcat visiblity
          s.visible = (!!s.questions.find(q => q.visible));
        });

        // evaluate category heading visibility
        c.visible = (!!c.subCategories.find(s => s.visible));
      });

      // evaluate domain heading visibility
      d.visible = (!!d.categories.find(c => c.visible));
    });
  }
}
