import Component from '@ember/component';
import { next } from '@ember/runloop';
import { computed } from '@ember/object';
import { isEmpty } from '@ember/utils';
import moment from 'moment';
import layout from '../templates/components/ilios-calendar-day';

export default Component.extend({
  layout,
  classNames: ['ilios-calendar-day'],
  date: null,
  calendarEvents: null,
  didInsertElement(){
    next(() => {
      const el = this.$(".el-calendar .week");
      if (el) {
        el.scrollTop(500);
      }
    });
  },
  singleDayEvents: computed('calendarEvents.[]', function(){
    const events = this.get('calendarEvents');
    if(isEmpty(events)){
      return [];
    }
    return events.filter(
      event => moment(event.startDate).isSame(moment(event.endDate), 'day')
    );
  }),
  multiDayEventsList: computed('calendarEvents.[]', function(){
    const events = this.get('calendarEvents');
    if(isEmpty(events)){
      return [];
    }
    return events.filter(
      event => !moment(event.startDate).isSame(moment(event.endDate), 'day')
    );
  }),
});
