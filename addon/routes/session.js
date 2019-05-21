import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  async afterModel(model) {
    const store = this.get('store');
    const course = await model.get('course');
    await store.query('session', { filters: { course: course.get('id') } });
  }
});
