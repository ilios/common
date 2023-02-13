import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default class CoursePublishallRoute extends Route {
  @service session;

  async model() {
    const course = this.modelFor('course');
    const sessions = await course.sessions;
    return {
      course,
      sessions,
    };
  }

  beforeModel(transition) {
    this.session.requireAuthentication(transition, 'login');
  }
}
