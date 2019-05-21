import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { isPresent } from '@ember/utils';
import moment from 'moment';

export default Controller.extend({

  queryParams: ['year', 'expanded'],
  expanded: '',
  year: moment().format('YYYY'),

  expandedWeeks: computed('expanded', function(){
    const expanded = this.get('expanded');
    const expandedString = expanded?expanded:'';
    return expandedString.split('-');
  }),

  actions: {
    toggleOpenWeek(week, shouldOpen) {
      const expanded = this.get('expanded');
      const expandedString = expanded?expanded:'';
      let arr =  expandedString.split('-');
      arr.removeObject(week);
      if (shouldOpen) {
        arr.pushObject(week);
      }
      arr = arr.sort();
      arr = arr.filter(val => isPresent(val));

      this.set('expanded', arr.join('-'));
    }
  }
});
