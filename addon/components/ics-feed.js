import Component from '@glimmer/component';
import { restartableTask, timeout } from 'ember-concurrency';

export default class IcsFeedComponent extends Component {
  textCopied = restartableTask(this, async () => {
    await timeout(3000);
  });
}
