import Service from '@ember/service';
import { DateTime } from 'luxon';
import { timeZonesNames } from '@vvo/tzdb';

/**
 * Service wrapper around moment's timezone utilities.
 */
export default class TimezoneService extends Service {
  /**
   * Formats a given timezone by pre-pending it with its offset, amongst other things.
   * @param {String} tz
   * @returns {string}
   */
  formatTimezone(tz) {
    return (
      '(' +
      DateTime.local().setZone(tz).toFormat('ZZ') +
      ') ' +
      tz.replace(/\//g, ' - ').replace(/_/g, ' ')
    );
  }

  /**
   * Returns the name of the current timezone.
   * @returns {string}
   */
  getCurrentTimezone() {
    return DateTime.local().zone.name;
  }

  /**
   * Returns a list of timezones names, excluding any non-canonical and deprecated ones,
   * and any zones in the Etc/ namespace.
   * Sorted alphabetically.
   * @returns {string[]}
   */
  getTimezoneNames() {
    const currentTimezone = this.getCurrentTimezone();
    let timezoneNames = timeZonesNames.filter((tz) => {
      // filter out any non-canonical and deprecated timezone names, and all of those pesky Etc/* zones.
      return (
        DateTime.local().setZone(tz).isValid &&
        tz.indexOf('/') !== -1 &&
        !tz.startsWith('Etc/') &&
        !tz.startsWith('Mexico/') &&
        !tz.startsWith('Brazil/') &&
        !tz.startsWith('Canada/') &&
        !tz.startsWith('Chile/') &&
        !tz.startsWith('US/') &&
        ![
          'Australia/ACT',
          'Australia/LHI',
          'Australia/North',
          'Australia/NSW',
          'Australia/Queensland',
          'Australia/South',
          'Australia/Tasmania',
          'Australia/Victoria',
          'Australia/West',
        ].includes(tz)
      );
    });
    // ensure that the current timezone is always part of the list
    timezoneNames.push(currentTimezone);
    timezoneNames = timezoneNames.uniq().sort();
    return timezoneNames;
  }

  /**
   * A list of objects, each item containing a timezone ("value") and its formatted equivalent ("label").
   * Items are grouped by timezone offset, and sorted within each group alphabetically.
   * @returns {{label: string, value: *}[]}
   */
  getTimezones() {
    return this.getTimezoneNames()
      .map((name) => {
        return {
          value: name,
          label: this.formatTimezone(name),
        };
      })
      .sort((a, b) => {
        const pattern = /^\(([+-])([0-9:]*)\) (.*)$/;
        const matchesA = a.label.match(pattern);
        const matchesB = b.label.match(pattern);

        if (matchesA[1] === '-' && matchesB[1] === '+') {
          return -1;
        } else if (matchesA[1] === '+' && matchesB[1] === '-') {
          return 1;
        }

        let offsetDiff = 0;
        if (matchesA[2] < matchesB[2]) {
          offsetDiff = -1;
        } else if (matchesA[2] > matchesB[2]) {
          offsetDiff = 1;
        }

        if (offsetDiff) {
          return matchesA[1] === '+' ? offsetDiff : -1 * offsetDiff;
        }

        if (matchesA[3] < matchesB[3]) {
          return -1;
        } else if (matchesA[3] > matchesB[3]) {
          return 1;
        }

        return 0;
      });
  }
}
