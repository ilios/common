import Component from '@ember/component';
import { computed } from '@ember/object';
import { next } from '@ember/runloop';
import { isEmpty } from '@ember/utils';
import moment from 'moment';
import layout from '../templates/components/ilios-calendar-week';

export default Component.extend({
  layout,
  classNames: ['ilios-calendar-week'],
  date: null,
  calendarEvents: null,
  areEventsSelectable: true,
  areDaysSelectable: true,
  weekOf: computed('date', function(){
    return moment(this.get('date')).startOf('week').format('MMMM Do YYYY');
  }),
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
  actions: {
    changeToDayView(date){
      const changeDate = this.get('changeDate');
      const changeView = this.get('changeView');
      const areDaysSelectable = this.get('areDaysSelectable');
      if (areDaysSelectable && changeDate && changeView) {
        changeDate(date);
        changeView('day');
      }
    },
    selectEvent(evt){
      const selectEvent = this.get('selectEvent');
      const areEventsSelectable = this.get('areEventsSelectable');
      if (areEventsSelectable && selectEvent) {
        selectEvent(evt);
      }
    }
  }
});
