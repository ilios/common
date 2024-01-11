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
 * Normalizing the ISO date from the server, making it into local time because
 * it isn't a real ISO date and then converting that local time into an ISO time
 * stamp that ember-data expects.
 */
export function jsonApiUtcNormalizeDate(resourceHash, property) {
  const match = isoRegex.exec(resourceHash.attributes[property]);
  if (match) {
    const [, year, month, day] = match;
    const date = DateTime.fromObject({ year, month, day });
    resourceHash.attributes[property] = date.toISO();
  }
}
