import { computed } from '@ember/object';
import RSVP from 'rsvp';
import DS from 'ember-data';

const { attr, belongsTo, hasMany, Model } = DS;
const { all } = RSVP;

export default Model.extend({
  title: attr('string'),
  shortTitle: attr('string'),
  duration: attr('number', { defaultValue: 1 }),
  school: belongsTo('school', {async: true}),
  programYears: hasMany('program-year', { async: true, inverse: 'program' }),
  directors: hasMany('user', { async: true, inverse: 'directedPrograms' }),
  curriculumInventoryReports: hasMany('curriculum-inventory-report', {async: true}),

  hasCurriculumInventoryReports: computed('curriculumInventoryReports.[]', function(){
    return (this.hasMany('curriculumInventoryReports').ids().length > 0);
  }),

  hasProgramYears: computed('programYears.[]', function(){
    return (this.hasMany('programYears').ids().length > 0);
  }),

  /**
   * All cohorts associated with this program via its program years.
   * @property cohorts
   * @type {Ember.computed}
   * @public
   */
  cohorts: computed('programYears.[]', async function() {
    const programYears = await this.get('programYears');
    return all(programYears.toArray().mapBy('cohort'));
  }),

  /**
   * All courses linked to this program via its program years/cohorts.
   * @property courses
   * @type {Ember.computed}
   * @public
   */
  courses: computed('cohorts.[]', async function() {
    const cohorts = await this.get('cohorts');
    const courses = await all(cohorts.mapBy('courses'));
    return courses.reduce((array, set) => {
      array.pushObjects(set.toArray());
      return array;
    }, []).uniq();
  }),
  requiredPublicationIssues: computed('title', 'shortTitle', 'duration', function(){
    return this.getRequiredPublicationIssues();
  }),
  optionalPublicationIssues: computed('programYears.length', function(){
    return this.getOptionalPublicationIssues();
  }),

  init() {
    this._super(...arguments);
    this.set('requiredPublicationSetFields', ['title', 'shortTitle', 'duration']);
    this.set('optionalPublicationLengthFields', ['programYears']);
  },
});
