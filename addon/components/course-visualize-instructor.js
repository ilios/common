import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { map, filter } from 'rsvp';
import { use } from 'ember-could-get-used-to-this';
import ResolveAsyncValue from 'ilios-common/classes/resolve-async-value';
import AsyncProcess from 'ilios-common/classes/async-process';

export default class CourseVisualizeInstructorComponent extends Component {
  @service iliosConfig;

  @use academicYearCrossesCalendarYearBoundaries = new ResolveAsyncValue(() => [
    this.iliosConfig.itemFromConfig('academicYearCrossesCalendarYearBoundaries'),
  ]);

  @use sessions = new ResolveAsyncValue(() => [this.args.course.sessions]);
  @use sessionsWithUser = new AsyncProcess(() => [
    this.getSessionsWithUser.bind(this),
    this.sessions,
  ]);

  @use minutes = new AsyncProcess(() => [this.getMinutes.bind(this), this.sessionsWithUser]);

  get totalInstructionalTime() {
    if (!this.minutes) {
      return 0;
    }
    return this.minutes.mapBy('offeringMinutes').reduce((total, mins) => total + mins, 0);
  }

  get totalIlmTime() {
    if (!this.minutes) {
      return 0;
    }
    return this.minutes.mapBy('ilmMinutes').reduce((total, mins) => total + mins, 0);
  }

  async getMinutes(sessionsWithUser) {
    if (!sessionsWithUser) {
      return [];
    }
    return map(sessionsWithUser, async (session) => {
      const offeringMinutes = await session.getTotalSumOfferingsDurationByInstructor(
        this.args.user
      );
      const ilmMinutes = await session.getTotalSumIlmDurationByInstructor(this.args.user);
      return {
        offeringMinutes,
        ilmMinutes,
      };
    });
  }

  async getSessionsWithUser(sessions) {
    if (!sessions) {
      return [];
    }
    return filter(sessions.toArray(), async (session) => {
      const instructors = await session.getAllInstructors();
      return instructors.mapBy('id').includes(this.args.user.id);
    });
  }
}
