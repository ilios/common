import Model, { belongsTo, hasMany, attr } from '@ember-data/model';
import Inflector from 'ember-inflector';
import { filter } from 'rsvp';

Inflector.inflector.irregular('vocabulary', 'vocabularies');

export default class Vocabulary extends Model {
  @attr('string')
  title;

  @belongsTo('school', { async: true, inverse: 'vocabularies' })
  school;

  @attr('boolean')
  active;

  @hasMany('term', { async: true, inverse: 'vocabulary' })
  terms;

  async getTopLevelTerms() {
    const terms = await this.terms;
    return filter(terms.slice(), async (term) => {
      return !(await term.parent);
    });
  }

  get termCount() {
    return this.hasMany('terms').ids().length;
  }
}
