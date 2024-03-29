// taken from Ember Composable Helpers (https://github.com/DockYard/ember-composable-helpers), then modified.
import { helper } from '@ember/component/helper';
import asArray from 'ilios-common/utils/as-array';

export default helper(function intersect([...arrays]) {
  let confirmedArrays = asArray(arrays).map((array) => {
    return Array.isArray(array) ? array : [];
  });
  // copied from https://github.com/emberjs/ember.js/blob/315ec6472ff542ac714432036cc96fe4bd62bd1f/packages/%40ember/object/lib/computed/reduce_computed_macros.js#L1063-L1100
  return confirmedArrays.pop().filter((candidate) => {
    for (let i = 0; i < confirmedArrays.length; i++) {
      let found = false;
      let array = confirmedArrays[i];
      for (let j = 0; j < array.length; j++) {
        if (array[j] === candidate) {
          found = true;
          break;
        }
      }

      if (found === false) {
        return false;
      }
    }

    return true;
  });
});
