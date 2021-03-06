import { tracked } from '@glimmer/tracking';
import { Resource } from 'ember-could-get-used-to-this';
export default class AsyncProcessResource extends Resource {
  @tracked data;

  get value() {
    return this.data;
  }

  async setup() {
    const fn = this.args.positional[0];

    //pass any remaining arguments directly to the processor function
    this.data = await fn(...this.args.positional.slice(1));
  }
}
