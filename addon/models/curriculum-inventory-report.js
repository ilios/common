import Model, { hasMany, belongsTo, attr } from '@ember-data/model';
import { computed } from '@ember/object';
import { isEmpty } from '@ember/utils';
import RSVP from 'rsvp';
const { all } = RSVP;

export default Model.extend({
  name: attr('string'),
  description: attr('string'),
  year: attr('string'),
  startDate: attr('date'),
  endDate: attr('date'),
  absoluteFileUri: attr('string'),
  export: belongsTo('curriculum-inventory-export', { async: true }),
  sequence: belongsTo('curriculum-inventory-sequence', { async: true }),
  sequenceBlocks: hasMany('curriculum-inventory-sequence-block', {
    async: true,
  }),
  program: belongsTo('program', { async: true }),
  academicLevels: hasMany('curriculum-inventory-academic-level', {
    async: true,
  }),
  administrators: hasMany('user', {
    async: true,
    inverse: 'administeredCurriculumInventoryReports',
  }),

  /**
   * A list of top-level sequence blocks owned by this report.
   * Returns a promise that resolves to an array of sequence block objects.
   * @property topLevelSequenceBlocks
   * @type {Ember.computed}
   * @public
   */
  topLevelSequenceBlocks: computed('sequenceBlocks.[]', async function () {
    const sequenceBlocks = await this.sequenceBlocks;
    return sequenceBlocks.filter((block) => {
      return !block.belongsTo('parent').id();
    });
  }),

  /**
   * Whether this report has been finalized, or not. Returns a boolean.
   * @property isFinalized
   * @type {Ember.computed}
   * @public
   */
  isFinalized: computed('export', function () {
    return !!this.belongsTo('export').id();
  }),

  /**
   * A list of courses that area linked to sequence blocks in this report.
   * Returns a promise that resolves to an array of course objects.
   * @property linkedCourses
   * @type {Ember.computed}
   * @public
   */
  linkedCourses: computed('sequenceBlocks.@each.course', async function () {
    const sequenceBlocks = await this.sequenceBlocks;
    const courses = await all(sequenceBlocks.toArray().mapBy('course'));
    return courses.filter((course) => {
      return !isEmpty(course);
    });
  }),

  /**
   * Whether this report has any courses linked to it via its sequence blocks, or not. Returns a boolean.
   * @property hasLinkedCourses
   * @type {Ember.computed}
   * @public
   */
  hasLinkedCourses: computed('linkedCourses.[]', async function () {
    const linkedCourses = await this.linkedCourses;
    return !isEmpty(linkedCourses);
  }),
});
