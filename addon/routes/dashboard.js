import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';

export default Route.extend(AuthenticatedRouteMixin, {
  store: service(),
  async model() {
    const store = this.get('store');
    const schools = await store.findAll('school');
    const academicYears = await store.findAll('academic-year');

    return { schools, academicYears };
  },
});
