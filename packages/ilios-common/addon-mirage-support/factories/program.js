import { Factory } from 'miragejs';

export default Factory.extend({
  title: (i) => `program ${i}`,
  shortTitle: (i) => `short_${i}`,
  duration: 4,
  published: true,
  publishedAsTbd: false,
});
