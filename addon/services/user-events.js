import EventsBase from 'ilios-common/classes/events-base';
import { service } from '@ember/service';
import moment from 'moment';
import { sortBy } from 'ilios-common/utils/array-helpers';

export default class UserEvents extends EventsBase {
  @service store;
  @service currentUser;
  @service session;
  @service fetch;
  @service iliosConfig;

  /**
   * Retrieves a list of user-events for the current user that occur in a given date range, sorted by start dates.
   * @method getEvents
   * @param {int} from
   * @param {int} to
   * @return {Promise.<Array>}
   */
  async getEvents(from, to) {
    const user = await this.currentUser.getModel();
    if (!user) {
      return [];
    }

    let url = '';
    const namespace = this.iliosConfig.apiNameSpace;
    if (namespace) {
      url += '/' + namespace;
    }
    url += '/userevents/' + user.get('id') + '?from=' + from + '&to=' + to;

    const data = await this.fetch.getJsonFromApiHost(url);

    return sortBy(
      data.userEvents.map((obj) => this.createEventFromData(obj, true)),
      ['startDate', 'name'],
    );
  }

  /**
   * Retrieves and event by it's given slug.
   * @method getEventForSlug
   * @param {String} slug
   * @return {Promise.<Object>}
   */
  async getEventForSlug(slug) {
    const from = moment(slug.substring(1, 9), 'YYYYMMDD').hour(0);
    const to = from.clone().hour(24);
    const type = slug.substring(9, 10);
    const id = parseInt(slug.substring(10), 10);

    const events = await this.getEvents(from.unix(), to.unix());

    return events.find((event) => {
      if (type === 'O') {
        return parseInt(event.offering, 10) === id;
      }
      if (type === 'I') {
        return parseInt(event.ilmSession, 10) === id;
      }
    });
  }

  /**
   * Generates a slug for a given event.
   * @method getSlugForEvent
   * @param {Object} event
   * @return {String}
   */
  getSlugForEvent(event) {
    let slug = 'U';
    slug += moment(event.startDate).format('YYYYMMDD');
    if (event.offering) {
      slug += 'O' + event.offering;
    }
    if (event.ilmSession) {
      slug += 'I' + event.ilmSession;
    }
    return slug;
  }
}
