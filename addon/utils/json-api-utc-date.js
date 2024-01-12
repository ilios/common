import { DateTime } from 'luxon';

/*
 * Some dates in our API are weird!
 * We send them to the server as YYYY-MM-DD, but we get them back
 * as fully formed ISO dates. However, and this is where it gets interesting
 * the ISO date isn't real. What happens is we take whatever the date is and,
 * on the server, we assume it's UTC. It isn't though, it's just a date.
 */

const isoRegex = /(\d{4})-(\d{2})-(\d{2})/;

/**
 * Serializing the date from user input which ember-data stores as an
 * ISO time back into the YYYY-MM-DD format our API expected
 */
export function jsonApiUtcSerializeDate(obj, property) {
  const match = isoRegex.exec(obj.data.attributes[property]);
  if (match) {
    obj.data.attributes[property] = match[0];
  }
}

/**
 * Normalizing the UTC ISO date from the server, pulling out the year/month/day because
 * it isn't a real ISO date and isn't really in UTC and then converting that
 * into an ISO time stamp that ember-data expects in the users local time.
 *
 * This then displayes to the user as year/month/day in their local time. Which is incorect
 * if their local time isn't the same as the expected local time of the course, but that's the way
 * the data currently exists in the API.
 */
export function jsonApiUtcNormalizeDate(resourceHash, property) {
  const match = isoRegex.exec(resourceHash.attributes[property]);
  if (match) {
    const [, year, month, day] = match;
    resourceHash.attributes[property] = DateTime.fromObject({ year, month, day }).toISO();
  }
}
