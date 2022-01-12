import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { DateTime } from 'luxon';
import { tracked } from '@glimmer/tracking';
import { restartableTask } from 'ember-concurrency';
import scrollIntoView from 'scroll-into-view';

export default class WeeklyGlance extends Component {
  @service userEvents;
  @service intl;

  @tracked publishedWeekEvents;
  @tracked midnightAtTheStartOfThisWeek;
  @tracked midnightAtTheEndOfThisWeek;

  @restartableTask
  *load(element, [week, year]) {
    // @todo does this still hold true? verify. [ST 2019/12/04]
    this.intl; //we need to use the service so the CP will re-fire
    const thursdayOfTheWeek = DateTime.local()
      .set({
        weekday: 4,
        hours: 0,
        minutes: 0,
        seconds: 0,
      })
      .set({ weekYear: year, weekNumber: week });
    this.midnightAtTheStartOfThisWeek = thursdayOfTheWeek.startOf('week');
    this.midnightAtTheEndOfThisWeek = thursdayOfTheWeek
      .endOf('week')
      .set({ hours: 23, minutes: 59, seconds: 59 });

    const weekEvents = yield this.userEvents.getEvents(
      Math.floor(this.midnightAtTheStartOfThisWeek.toSeconds()),
      Math.floor(this.midnightAtTheEndOfThisWeek.toSeconds())
    );
    this.publishedWeekEvents = weekEvents.filter((ev) => {
      return !ev.isBlanked && ev.isPublished && !ev.isScheduled;
    });

    if (this.args.week === this.args.weekInFocus) {
      scrollIntoView(element);
    }
  }

  get title() {
    if (!this.midnightAtTheStartOfThisWeek || !this.midnightAtTheEndOfThisWeek) {
      return '';
    }

    const from = this.midnightAtTheStartOfThisWeek.toFormat('LLLL d');
    let to;
    if (this.midnightAtTheStartOfThisWeek.month !== this.midnightAtTheEndOfThisWeek.month) {
      to = this.midnightAtTheEndOfThisWeek.toFormat('LLLL d');
      return `${from} - ${to}`;
    }
    to = this.midnightAtTheEndOfThisWeek.toFormat('d');
    return `${from}-${to}`;
  }

  get ilmPreWork() {
    const rhett = [];

    if (!this.publishedWeekEvents) {
      return rhett;
    }

    const preWork = this.publishedWeekEvents.reduce((arr, eventObject) => {
      return arr.pushObjects(eventObject.prerequisites);
    }, []);

    // grab ILMs only, and group them by session.
    const groups = {};
    preWork
      .filter((ev) => ev.ilmSession)
      .forEach((ilm) => {
        if (!Object.prototype.hasOwnProperty.call(groups, ilm.session)) {
          groups[ilm.session] = [];
        }
        groups[ilm.session].pushObject(ilm);
      });

    // return an array of arrays of ILMs.
    const sessions = Object.getOwnPropertyNames(groups);
    sessions.forEach((session) => {
      rhett.push(groups[session]);
    });

    return rhett.sort((ilmGroupA, ilmGroupB) => {
      const eventA = ilmGroupA.firstObject;
      const eventB = ilmGroupB.firstObject;

      if (eventA.startDate > eventB.startDate) {
        return 1;
      } else if (eventA.startDate < eventB.startDate) {
        return -1;
      }

      if (eventA.postrequisiteName > eventB.postrequisiteName) {
        return 1;
      } else if (eventA.postrequisiteName < eventB.postrequisiteName) {
        return -1;
      }

      if (eventA.session > eventB.session) {
        return 1;
      } else {
        return -1;
      }
    });
  }

  get nonIlmPreWorkEvents() {
    if (!this.publishedWeekEvents) {
      return [];
    }
    return this.publishedWeekEvents.filter((ev) => {
      return ev.postrequisites.length === 0 || !ev.ilmSession;
    });
  }
}
