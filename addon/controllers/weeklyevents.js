import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { getConfig } from '@embroider/macros';
import moment from 'moment';

export default class WeeklyeventsController extends Controller {
  queryParams = ['year', 'expanded', 'week'];
  year = moment().format('YYYY');
  @tracked expanded = '';
  @tracked week = '';

  get expandedString() {
    return this.expanded ? this.expanded : '';
  }

  get expandedWeeks() {
    return this.expandedString.split('-');
  }

  get showBackLink() {
    return !!getConfig('showHistoryBackLink');
  }

  @action
  toggleOpenWeek(week, shouldOpen) {
    const arr = this.expandedWeeks.filter((w) => w !== week);
    this.week = '';
    if (shouldOpen) {
      arr.push(week);
      this.week = week;
    }
    arr.sort();
    this.expanded = arr.filter(Boolean).join('-');
  }
}
