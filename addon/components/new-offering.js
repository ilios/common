import { inject as service } from '@ember/service';
import Component from '@ember/component';
import layout from '../templates/components/new-offering';
import scrollIntoView from 'scroll-into-view';

export default Component.extend({
  store: service(),
  layout,
  classNames: ['new-offering'],
  session: null,
  courseStartDate: null,
  courseEndDate: null,
  smallGroupMode: true,
  didRender() {
    this._super(...arguments);
    scrollIntoView(this.element.querySelector('.offering-form .buttons'));
  },
  actions: {
    save(startDate, endDate, room, learnerGroups, instructorGroups, instructors){
      const store = this.get('store');
      const session = this.get('session');
      let offering = store.createRecord('offering');
      offering.setProperties({startDate, endDate, room, learnerGroups, instructorGroups, instructors, session});

      return offering.save();
    }
  }
});
