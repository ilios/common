import Controller from '@ember/controller';
import { getOwner } from '@ember/application';

export default class EventsController extends Controller {
  get showBackLink() {
    const appConfig = getOwner(this).resolveRegistration('config:environment');
    return !!appConfig.showHistoryBackLink;
  }
}
