import Model, { hasMany, belongsTo, attr } from '@ember-data/model';
import { use } from 'ember-could-get-used-to-this';
import ResolveAsyncValue from 'ilios-common/classes/resolve-async-value';
import ResolveFlatMapBy from 'ilios-common/classes/resolve-flat-map-by';

export default class Program extends Model {
  @attr('string')
  title;
  @attr('string')
  shortTitle;
  @attr('number', { defaultValue: 1 })
  duration;
  @belongsTo('school', { async: true })
  school;
  @hasMany('program-year', { async: true, inverse: 'program' })
  programYears;
  @hasMany('user', { async: true, inverse: 'directedPrograms' })
  directors;
  @hasMany('curriculum-inventory-report', { async: true })
  curriculumInventoryReports;

  get hasCurriculumInventoryReports() {
    return !!this.curriculumInventoryReports.length;
  }

  get hasProgramYears() {
    return !!this.programYears.length;
  }

  @use _cohorts = new ResolveAsyncValue(() => [this.programYears?.mapBy('cohort')]);

  /**
   * All cohorts associated with this program via its program years.
   */
  get cohorts() {
    if (!this._cohorts) {
      return [];
    }
    return this._cohorts.toArray();
  }

  @use _courses = new ResolveFlatMapBy(() => [this._cohorts, 'courses']);

  /**
   * All courses linked to this program via its program years/cohorts.
   */
  get courses() {
    if (!this._courses) {
      return [];
    }
    return this._courses.uniq();
  }
}
