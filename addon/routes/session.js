import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import { findById } from '../utils/array-helpers';

export default class SessionRoute extends Route {
  @service dataLoader;
  @service session;

  async model(params) {
    const course = this.modelFor('course');
    await this.dataLoader.loadCourseSessions(course.id);
    const sessions = await course.sessions;
    const school = await course.school;
    const sessionTypes = await school.sessionTypes;
    const session = findById(sessions.slice(), params.session_id);
    return {
      session,
      course,
      sessionTypes,
    };
  }

  beforeModel(transition) {
    this.session.requireAuthentication(transition, 'login');
  }
}
