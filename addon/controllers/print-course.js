import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  currentUser: service(),
  queryParams: ['unpublished'],
  unpublished: false,
  canViewUnpublished: false,
});
