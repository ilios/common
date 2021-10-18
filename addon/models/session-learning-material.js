import Model, { hasMany, belongsTo, attr } from '@ember-data/model';

export default class SessionLearningMaterial extends Model {
  @attr('string')
  notes;

  @attr('boolean', { defaultValue: true })
  required;

  @attr('boolean', { defaultValue: true })
  publicNotes;

  @attr('number', { defaultValue: 0 })
  position;

  @attr('date')
  startDate;

  @attr('date')
  endDate;

  @belongsTo('session', { async: true })
  session;

  @belongsTo('learning-material', { async: true })
  learningMaterial;

  @hasMany('mesh-descriptors', { async: true })
  meshDescriptors;
}
