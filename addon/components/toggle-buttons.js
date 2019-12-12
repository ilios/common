import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class ToggleButtons extends Component {

  @action
  firstChoice(){
    if (! this.args.firstOptionSelected) {
      this.args.toggle(true);
    }
  }

  @action
  secondChoice(){
    if (this.args.firstOptionSelected) {
      this.args.toggle(false);
    }
  }
}
