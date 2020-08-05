import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { restartableTask } from 'ember-concurrency-decorators';
import moment from 'moment';

export default class DashboardAgendaComponent extends Component {
  @service userEvents;

  @tracked areEventsSelectable = true;
  @tracked daysInAdvance = 60;
  @tracked sixDaysAgo = moment().hour(0).minute(0).subtract(6, 'days');
  @tracked weeksEvents = null;

  @restartableTask
  *load() {
    const from = moment().hour(0).minute(0).unix();
    const to = moment().hour(23).minute(59).add(this.daysInAdvance, 'days').unix();

    this.weeksEvents = yield this.userEvents.getEvents(from, to);
  }

  get ilmPreWorkEvents() {
    if (! this.weeksEvents) {
      return [];
    }
    const preWork = this.weeksEvents.reduce((arr, ev) => {
      if (!ev.isBlanked && ev.isPublished && !ev.isScheduled) {
        arr.pushObjects(ev.prerequisites);
      }
      return arr;
    }, []).filter(ev => ev.ilmSession).filter(ev => {
      return !ev.isBlanked && ev.isPublished && !ev.isScheduled;
    });

    const hashes = [];
    const uniques = [];
    preWork.forEach(event => {
      const hash = this.hashEvent(event);
      if (! hashes.includes(hash)) {
        hashes.push(hash);
        uniques.pushObject(event);
      }
    });
    return uniques;
  }

  get nonIlmPreWorkEvents() {
    const preworkEventHashes = this.ilmPreWorkEvents.map(ev => {
      return this.hashEvent(ev);
    });
    return this.weeksEvents.filter(ev => {
      // ACHTUNG MINEN!
      // do a reverse lookup here against pre-work events.
      // if the current event is derived from an ILM and it has pre-requisites,
      // and if any of those pre-requisites has been identified as pre-work event
      // then do not list this event again, as it will be displayed
      // as post-requisite elsewhere in this agenda view already.
      // [ST 2020/08/04]
      if (ev.ilmSession && ev.prerequisites.length) {
        const prerequisiteHashes = ev.prerequisites.map(ev => {
          return this.hashEvent(ev);
        });
        const hasPreWorkEvents = prerequisiteHashes.some(hash => {
          return preworkEventHashes.includes(hash);
        });

        if (hasPreWorkEvents) {
          return false;
        }
      }
      return ev.postrequisites.length === 0 || !ev.ilmSession;
    });
  }

  hashEvent(event) {
    return  moment(event.startDate).format() +
      moment(event.endDate).format() +
      event.name;
  }
}
