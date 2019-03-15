import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  startYear: (i) => 2012 + i,
  archived: false,
});
