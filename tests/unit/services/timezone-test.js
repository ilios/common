import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { DateTime } from 'luxon';

module('Unit | Service | timezone', function (hooks) {
  setupTest(hooks);

  test('getCurrentTimezone', function (assert) {
    const service = this.owner.lookup('service:timezone');
    assert.strictEqual(DateTime.local().zone.name, service.getCurrentTimezone());
  });

  test('getTimezoneNames', function (assert) {
    const service = this.owner.lookup('service:timezone');
    const names = service.getTimezoneNames();
    assert.notOk(names.includes('Etc/GMT-13'));
    assert.notOk(names.includes('Canada/Newfoundland'));
    assert.ok(names.includes('Africa/Abidjan'));
    assert.ok(names.includes('Pacific/Wallis'));
  });

  test('formatTimezone', function (assert) {
    const service = this.owner.lookup('service:timezone');
    const tz = 'America/Los_Angeles';
    const offset = DateTime.local().setZone(tz).toFormat('ZZ');
    assert.strictEqual(service.formatTimezone(tz), `(${offset}) America - Los Angeles`);
  });

  test('getTimezones', function (assert) {
    const service = this.owner.lookup('service:timezone');
    const timezones = service.getTimezones();
    // fortunately, those are not expected to change, and they don't observe DST.
    // so it's safe to hardwire them into the test.
    assert.strictEqual(timezones[0].label, '(-11:00) Pacific - Midway');
    assert.strictEqual(timezones[0].value, 'Pacific/Midway');
    assert.strictEqual(timezones[timezones.length - 1].label, '(+14:00) Pacific - Kiritimati');
    assert.strictEqual(timezones[timezones.length - 1].value, 'Pacific/Kiritimati');
  });
});
