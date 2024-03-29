import Component from '@glimmer/component';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { dropTask, restartableTask } from 'ember-concurrency';
import moment from 'moment';
import { map } from 'rsvp';
import { mapBy, sortBy } from 'ilios-common/utils/array-helpers';
import { use } from 'ember-could-get-used-to-this';
import AsyncProcess from 'ilios-common/classes/async-process';
export default class DashboardCalendarComponent extends Component {
  @service userEvents;
  @service schoolEvents;
  @service currentUser;
  @service store;
  @service intl;
  @service iliosConfig;
  @service dataLoader;

  @tracked usersPrimarySchool;
  @tracked absoluteIcsUri;

  @tracked ourEvents = [];

  @use cohortProxies = new AsyncProcess(() => [
    this.getCohortProxies.bind(this),
    this.bestSelectedSchool,
  ]);

  get fromTimeStamp() {
    return moment(this.args.selectedDate)
      .startOf(this.args.selectedView)
      .subtract(this.clockSkew, 'days')
      .unix();
  }
  get toTimeStamp() {
    return moment(this.args.selectedDate)
      .endOf(this.args.selectedView)
      .add(this.clockSkew, 'days')
      .unix();
  }
  get clockSkew() {
    if (this.selectedView === 'month') {
      return 6;
    }
    return 1;
  }

  constructor() {
    super(...arguments);
    this.setup.perform();
  }

  setup = dropTask(async () => {
    const user = await this.currentUser.getModel();
    this.usersPrimarySchool = await user.school;

    const icsFeedKey = user.icsFeedKey;
    const apiHost = this.iliosConfig.apiHost;
    const loc = window.location.protocol + '//' + window.location.hostname;
    const server = apiHost ? apiHost : loc;
    this.absoluteIcsUri = server + '/ics/' + icsFeedKey;
  });

  loadEvents = restartableTask(async (event, [school, fromTimeStamp, toTimeStamp]) => {
    if (!school || !fromTimeStamp || !toTimeStamp) {
      return;
    }
    if (this.args.mySchedule) {
      this.ourEvents = await this.userEvents.getEvents(fromTimeStamp, toTimeStamp);
    } else {
      this.ourEvents = await this.schoolEvents.getEvents(school.id, fromTimeStamp, toTimeStamp);
    }
  });

  async getCohortProxies(school) {
    if (!school) {
      return;
    }
    const cohorts = await this.getSchoolCohorts(school);
    const cohortProxies = await map(cohorts, async (cohort) => {
      let displayTitle = cohort.title;
      const programYear = await cohort.programYear;
      const classOfYear = await programYear.getClassOfYear();
      if (!displayTitle) {
        const intl = this.intl;
        displayTitle = intl.t('general.classOf', { year: classOfYear });
      }
      const program = await programYear.program;

      return {
        id: cohort.id,
        programTitle: program.title,
        cohort,
        displayTitle,
        classOfYear,
      };
    });

    return sortBy(cohortProxies, 'displayTitle');
  }

  async getSchoolCohorts(school) {
    await this.dataLoader.loadSchoolForCalendar(school.id);
    const programs = await school.programs;
    const programYears = await map(programs.slice(), async (program) => {
      const programYears = await program.programYears;
      return programYears.slice();
    });
    const cohorts = await Promise.all(mapBy(programYears.flat(), 'cohort'));
    return cohorts.filter(Boolean);
  }

  get filteredEvents() {
    const eventTypes = [
      'eventsWithSelectedSessionTypes',
      'eventsWithSelectedCourseLevels',
      'eventsWithSelectedCohorts',
      'eventsWithSelectedCourses',
      'eventsWithSelectedTerms',
    ];
    const allFilteredEvents = eventTypes.map((name) => {
      return this[name];
    });

    return this.ourEvents.filter((event) => {
      return allFilteredEvents.every((arr) => {
        return arr.includes(event);
      });
    });
  }

  get hasMoreThanOneSchool() {
    return this.args.allSchools.length > 1;
  }

  get bestSelectedSchool() {
    if (this.args.selectedSchool) {
      return this.args.selectedSchool;
    }

    return this.usersPrimarySchool;
  }

  get eventsWithSelectedSessionTypes() {
    if (!this.args.selectedSessionTypeIds?.length) {
      return this.ourEvents;
    }
    const selectedIds = this.args.selectedSessionTypeIds.map(Number);
    return this.ourEvents.filter((event) => {
      return selectedIds.includes(event.sessionTypeId);
    });
  }

  get eventsWithSelectedCourseLevels() {
    if (!this.args.selectedCourseLevels?.length) {
      return this.ourEvents;
    }
    const levels = this.args.selectedCourseLevels.map(Number);
    return this.ourEvents.filter((event) => {
      return levels.includes(event.courseLevel);
    });
  }

  get eventsWithSelectedCohorts() {
    if (!this.args.selectedCohortIds?.length) {
      return this.ourEvents;
    }
    const selectedIds = this.args.selectedCohortIds.map(Number);
    return this.ourEvents.filter((event) => {
      const matchingCohorts = event.cohorts.filter(({ id }) => selectedIds.includes(id));
      return matchingCohorts.length > 0;
    });
  }

  get eventsWithSelectedCourses() {
    if (!this.args.selectedCourseIds?.length) {
      return this.ourEvents;
    }
    const selectedIds = this.args.selectedCourseIds.map(Number);
    return this.ourEvents.filter((event) => {
      return selectedIds.includes(event.course);
    });
  }

  get eventsWithSelectedTerms() {
    if (!this.args.selectedTermIds?.length) {
      return this.ourEvents;
    }
    const selectedIds = this.args.selectedTermIds.map(Number);
    return this.ourEvents.filter((event) => {
      const allTerms = mapBy([].concat(event.sessionTerms || [], event.courseTerms || []), 'id');
      const matchingTerms = allTerms.filter((id) => selectedIds.includes(id));
      return matchingTerms.length > 0;
    });
  }

  @action
  changeSchool(event) {
    this.args.changeSchool(event.target.value);
  }
}
