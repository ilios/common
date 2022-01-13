import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';
import { action, set } from '@ember/object';
import { DateTime } from 'luxon';

export default class WeeklyCalendarComponent extends Component {
  @service intl;

  @restartableTask
  *scrollView(calendarElement, [earliestHour]) {
    //waiting ensures that setHour has time to setup hour elements
    yield timeout(1);
    // all of the hour elements are registered in the template as hour0, hour1, etc
    let hourElement = this.hour6;

    if (earliestHour < 24 && earliestHour > 2) {
      hourElement = this[`hour${earliestHour - 2}`];
    }
    calendarElement.scrollTop = hourElement.offsetTop;
  }

  get firstDayOfWeek() {
    this.intl.locale;
    return DateTime.fromISO(this.args.date).startOf('week').toJSDate();
  }

  get lastDayOfWeek() {
    return DateTime.fromJSDate(this.firstDayOfWeek).endOf('week').toJSDate();
  }

  get week() {
    return [...Array(7).keys()].map((i) => {
      const date = DateTime.fromJSDate(this.firstDayOfWeek).plus({ days: i });
      return {
        date: date.toJSDate(),
        dayOfWeek: i + 1,
      };
    });
  }

  get earliestHour() {
    if (!this.args.events) {
      return null;
    }

    return this.sortedEvents.reduce((earliestHour, event) => {
      const hour = DateTime.fromISO(event.startDate).hour;
      return hour < earliestHour ? hour : earliestHour;
    }, 24);
  }

  get sortedEvents() {
    if (!this.args.events) {
      return [];
    }

    return this.args.events.sortBy('startDate', 'endDate', 'name');
  }

  get eventDays() {
    return this.week.map((day) => {
      day.events = this.sortedEvents.filter((e) =>
        DateTime.fromJSDate(day.date).hasSame(DateTime.fromISO(e.startDate), 'day')
      );
      return day;
    });
  }

  get days() {
    return this.eventDays.map((day) => {
      const date = DateTime.fromJSDate(day.date);
      day.dayOfWeek = date.weekday;
      day.fullName = date.toFormat('cccc DDD');
      return day;
    });
  }

  get hours() {
    return [...Array(24).keys()].map((i) => {
      const time = DateTime.fromJSDate(this.firstDayOfWeek).set({ hours: i });
      return {
        hour: time.toFormat('H'),
        longName: time.toFormat('t'),
        shortName: time.toFormat('ha'),
      };
    });
  }

  @action
  setHour(element, [hour]) {
    set(this, `hour${hour}`, element);
  }

  @action
  selectEvent(event) {
    if (event.isMulti) {
      this.args.changeToDayView(event.startDate);
    } else {
      this.args.selectEvent(event);
    }
  }
}
