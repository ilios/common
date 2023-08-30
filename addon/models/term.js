import Model, { hasMany, belongsTo, attr } from '@ember-data/model';

import { mapBy } from 'ilios-common/utils/array-helpers';

export default class Term extends Model {
  @attr('string')
  title;

  @attr('string')
  description;

  @belongsTo('vocabulary', { async: true, inverse: 'terms' })
  vocabulary;

  @belongsTo('term', { inverse: 'children', async: true })
  parent;

  @hasMany('term', { inverse: 'parent', async: true })
  children;

  @hasMany('programYear', { async: true, inverse: 'terms' })
  programYears;

  @hasMany('session', { async: true, inverse: 'terms' })
  sessions;

  @hasMany('course', { async: true, inverse: 'terms' })
  courses;

  @hasMany('aamcResourceType', { async: true, inverse: null })
  aamcResourceTypes;

  @attr('boolean')
  active;

  @hasMany('course-objective', { async: true, inverse: 'terms' })
  courseObjectives;

  @hasMany('program-year-objective', { async: true, inverse: 'terms' })
  programYearObjectives;

  @hasMany('session-objective', { async: true, inverse: 'terms' })
  sessionObjectives;

  get associatedLengths() {
    return [
      this.programYears.length,
      this.courses.length,
      this.sessions.length,
      this.programYearObjectives.length,
      this.courseObjectives.length,
      this.sessionObjectives.length,
    ];
  }

  get totalAssociations() {
    return this.associatedLengths.reduce((prev, curr) => prev + curr);
  }

  get hasAssociations() {
    return !!this.totalAssociations;
  }

  get isTopLevel() {
    return !this.belongsTo('parent').id();
  }

  get childCount() {
    return this.hasMany('children').ids().length;
  }

  get hasChildren() {
    return !!this.childCount;
  }

  /**
   * A list of parent terms of this term, sorted by ancestry (oldest ancestor first).
   */
  async getAllParents() {
    const parent = await this.parent;
    if (!parent) {
      return [];
    }
    const allParents = await parent.getAllParents();
    return [...allParents, parent];
  }

  /**
   * A list of parent terms titles of this term, sorted by ancestry (oldest ancestor first).
   */
  async getAllParentTitles() {
    const parent = await this.parent;
    if (!parent) {
      return [];
    }
    const parents = await parent.getAllParents();
    const titles = mapBy(parents, 'title');
    return [...titles, parent.title];
  }

  /**
   * A list of parent terms titles of this term, including this term's title as its last item.
   */
  async getTitleWithParentTitles() {
    const parentTitles = await this.getAllParentTitles();
    if (!parentTitles.length) {
      return this.title;
    }
    return parentTitles.join(' > ') + ' > ' + this.title;
  }

  async getAllDescendants() {
    const children = (await this.children).slice();
    const childrenDescendants = await Promise.all(
      children.map((child) => child.getAllDescendants()),
    );
    const flatChildrenDescendants = childrenDescendants.reduce((array, set) => {
      return [...array, ...set];
    }, []);

    return [...children, ...flatChildrenDescendants];
  }

  /**
   * A list of descendant terms titles of this term, including this term's title as its last item.
   */
  async getTitleWithDescendantTitles() {
    const allDescendants = await this.getAllDescendants();
    const allDescendantTitles = mapBy(allDescendants, 'title');
    if (!allDescendantTitles.length) {
      return this.title;
    }
    return allDescendantTitles.join(' > ') + ' > ' + this.title;
  }
}
