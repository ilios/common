import Component from '@glimmer/component';
import { DateTime, Info } from 'luxon';
import { inject as service } from '@ember/service';

export default class MonthlyCalendarComponent extends Component {
  @service intl;
  @service moment;

  get sortedEvents() {
    if (!this.args.events) {
      return [];
    }

    return this.args.events.sortBy('startDate', 'endDate', 'name');
  }

  get firstDayOfMonth() {
    return DateTime.fromISO(this.args.date).startOf('month').toJSDate();
  }

  get month() {
    let date = DateTime.fromJSDate(this.firstDayOfMonth);
    const lastDayOfMonth = date.endOf('month');
    const days = [];

    while (date <= lastDayOfMonth) {
      const day = {
        date: date.toJSDate(),
        dayOfMonth: date.day,
      };
      days.push(day);
      date = date.plus({ days: 1 });
    }

    return days;
  }

  get eventDays() {
    return this.month.map((day) => {
      day.events = this.sortedEvents.filter((e) =>
        DateTime.fromJSDate(day.date).hasSame(DateTime.fromISO(e.startDate), 'day')
      );
      return day;
    });
  }

  get days() {
    //access the locale info here so the getter will recompute when it changes
    this.intl.locale;

    const firstDayOfWeek = DateTime.fromJSDate(this.firstDayOfMonth).startOf('week');
    const offset = DateTime.fromJSDate(this.firstDayOfMonth)
      .diff(firstDayOfWeek, 'days')
      .toObject().days;

    return this.eventDays.map((day) => {
      const date = DateTime.fromJSDate(day.date);
      day.dayOfWeek = date.weekday;
      day.weekOfMonth = Math.ceil((date.day + offset) / 7);
      day.name = date.toFormat('cccc DDD');
      return day;
    });
  }

  get dayNames() {
    //access the locale info here so the getter will recompute when it changes
    this.intl.locale;

    const longNames = Info.weekdays('long');
    const shortNames = Info.weekdays('short');
    return [0, 1, 2, 3, 4, 5, 6].map((i) => {
      return {
        day: i + 1,
        longName: longNames[i],
        shortName: shortNames[i],
      };
    });
  }
}
