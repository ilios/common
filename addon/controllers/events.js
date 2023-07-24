import Controller from '@ember/controller';
import { getConfig } from '@embroider/macros';

export default class EventsController extends Controller {
  get showBackLink() {
    return !!getConfig('showHistoryBackLink');
  }
}
