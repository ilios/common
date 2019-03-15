import { computed } from '@ember/object';
import DS from 'ember-data';
import CategorizableModel from 'ilios-common/mixins/categorizable-model';
import SortableByPosition from 'ilios-common/mixins/sortable-by-position';

const { attr, belongsTo, hasMany, Model } = DS;
const { alias } = computed;

export default Model.extend(CategorizableModel, SortableByPosition, {
  startYear: attr('string'),
  locked: attr('boolean'),
  archived: attr('boolean'),
  program: belongsTo('program', {async: true}),
  cohort: belongsTo('cohort', {async: true}),
  directors: hasMany('user', {async: true}),
  competencies: hasMany('competency', {async: true}),
  objectives: hasMany('objective', {async: true}),
  stewards: hasMany('program-year-steward', {async: true}),

  assignableVocabularies: alias('program.school.vocabularies'),

  academicYear: computed('startYear', function(){
    return this.get('startYear') + ' - ' + (parseInt(this.get('startYear'), 10) + 1);
  }),
  classOfYear: computed('startYear', 'program.duration', async function(){
    const program = await this.get('program');
    return (parseInt(this.startYear, 10) + parseInt(program.duration, 10));
  }),
  requiredPublicationIssues: computed('startYear', 'cohort', 'program', function(){
    return this.getRequiredPublicationIssues();
  }),
  optionalPublicationIssues: computed(
    'directors.length',
    'competencies.length',
    'terms.length',
    'objectives.length',
    function(){
      return this.getOptionalPublicationIssues();
    }
  ),

  /**
   * A list of program-year objectives, sorted by position and title.
   * @property sortedObjectives
   * @type {Ember.computed}
   * @public
   */
  sortedObjectives: computed('objectives.@each.position', 'objectives.@each.title', async function() {
    const objectives = await this.get('objectives');
    return objectives.toArray().sort(this.positionSortingCallback);
  }),

  init() {
    this._super(...arguments);
    this.set('requiredPublicationSetFields', ['startYear', 'cohort', 'program']);
    this.set('optionalPublicationLengthFields', ['directors', 'competencies', 'terms', 'objectives']);
  },
});
