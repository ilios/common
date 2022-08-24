import Component from '@glimmer/component';
import { restartableTask, timeout } from 'ember-concurrency';

export default class OfferingUrlDisplayComponent extends Component {
  copy = restartableTask(this, async () => {
    await timeout(1500);
  });
}
