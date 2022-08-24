import Component from '@glimmer/component';
import { restartableTask } from 'ember-concurrency';

export default class CopyButtonComponent extends Component {
  copy = restartableTask(this, async () => {
    await navigator.clipboard.writeText(this.args.clipboardText);
    if (this.args.success) {
      this.args.success();
    }
  });
}
