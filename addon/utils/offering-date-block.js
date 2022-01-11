import EmberObject, { computed } from '@ember/object';
import { DateTime } from 'luxon';

const { sort } = computed;

const OfferingBlock = EmberObject.extend({
  offerings: null,
  init() {
    this._super(...arguments);
    this.offerings = [];
  },
  addOffering(offering) {
    this.offerings = [...this.offerings, offering];
  },
});

const OfferingDateBlock = OfferingBlock.extend({
  dateKey: null,
  //convert our day of the year key into a date at midnight
  date: computed('dateKey', function () {
    const year = this.dateKey.substring(0, 4);
    const dayOfYear = this.dateKey.substring(4);
    const date = new Date(year, 0);
    return new Date(date.setDate(dayOfYear));
  }),
  dateStamp: computed('date', function () {
    return DateTime.fromJSDate(this.date).toFormat('X');
  }),
  dayOfWeek: computed('date', function () {
    return DateTime.fromJSDate(this.date).toFormat('cccc');
  }),
  dayOfMonth: computed('date', function () {
    return DateTime.fromJSDate(this.date).toFormat('MMMM d');
  }),
  offeringTimeBlocks: computed('offerings.@each.{startDate,endDate}', function () {
    const offeringGroups = {};
    this.offerings.forEach(function (offering) {
      const key = offering.get('timeKey');
      if (!(key in offeringGroups)) {
        offeringGroups[key] = OfferingTimeBlock.create({
          timeKey: key,
        });
      }
      offeringGroups[key].addOffering(offering);
    });
    //convert indexed object to array
    const offeringGroupArray = [];
    let key;
    for (key in offeringGroups) {
      offeringGroupArray.pushObject(offeringGroups[key]);
    }

    return offeringGroupArray.sortBy('timeKey');
  }),
});

const OfferingTimeBlock = OfferingBlock.extend({
  init() {
    this._super(...arguments);
    this.set('sortOfferingsBy', ['learnerGroups.firstObject.title']);
  },
  timeKey: null,
  isMultiDay: computed('startDate', 'endDate', function () {
    return this.startDate.toFormat('oooyyyy') !== this.endDate.toFormat('oooyyyy');
  }),
  //pull our times out of the key
  startDate: computed('timeKey', function () {
    const key = this.timeKey.substring(0, 11);
    return DateTime.fromFormat(key, 'yyyyoHHmm');
  }),
  endDate: computed('timeKey', function () {
    const key = this.timeKey.substring(11);
    return DateTime.fromFormat(key, 'yyyyoHHmm');
  }),
  startTime: computed('startDate', function () {
    return this.startDate.toFormat('t');
  }),
  endTime: computed('endDate', function () {
    return this.endDate.toFormat('t');
  }),
  longStartText: computed('startDate', function () {
    return this.startDate.toFormat('EEEE MMMM d @ t');
  }),
  longEndText: computed('endDate', function () {
    return this.endDate.toFormat('EEEE MMMM d @ t');
  }),
  sortOfferingsBy: null,
  sortedOfferings: sort('offerings', 'sortOfferingsBy'),
  durationHours: computed('totalMinutes', function () {
    return Math.floor(this.totalMinutes / 60);
  }),
  durationMinutes: computed('totalMinutes', function () {
    return this.totalMinutes % 60;
  }),
  totalMinutes: computed('startDate', 'endDate', function () {
    const duration = this.endDate.diff(this.startDate);
    return duration.get('minutes');
  }),
});

export default OfferingDateBlock;
