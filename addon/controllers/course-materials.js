import Controller from '@ember/controller';

export default Controller.extend({
  queryParams: ['courseSort', 'sessionSort'],

  courseSort: 'title',
  sessionSort: 'firstOfferingDate'
});
