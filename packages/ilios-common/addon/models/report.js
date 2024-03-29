import Model, { belongsTo, attr } from '@ember-data/model';

export default class Report extends Model {
  @attr('string')
  title;

  @attr('date')
  createdAt;

  @attr('string')
  subject;

  @attr('string')
  prepositionalObject;

  @attr('string')
  prepositionalObjectTableRowId;

  @belongsTo('user', { async: true, inverse: 'reports' })
  user;

  @belongsTo('school', { async: true, inverse: null })
  school;
}
