import calendarEventTooltip from 'dummy/utils/calendar-event-tooltip';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { DateTime } from 'luxon';

module('Unit | Utility | calendar-event-tooltip', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.intl = this.owner.lookup('service:intl');
    this.intl.setLocale('en-us');
  });

  test('it works for blanked event', function (assert) {
    const today = DateTime.local().set({ hours: 8 }).toJSDate();
    const result = calendarEventTooltip(
      {
        startDate: today,
        endDate: today,
        name: 'test',
      },
      this.intl,
      'hh'
    );
    assert.strictEqual(result.string, 'TBD<br />08 - 08<br />test');
  });
  test('offering-based event', function (assert) {
    const today = DateTime.local().set({ hours: 8 }).toJSDate();
    const result = calendarEventTooltip(
      {
        startDate: today,
        endDate: today,
        name: 'test',
        location: 'room 101',
        instructors: ['Larry', 'Curly', 'Moe', 'Shemp'],
        courseTitle: 'Intro 101',
        isMulti: false,
        sessionTypeTitle: 'lecture',
        offering: 1,
      },
      this.intl,
      'hh'
    );
    assert.strictEqual(
      result.string,
      'room 101<br />08 - 08<br />test<br /> Taught By Larry, Curly et al.<br />Course: Intro 101<br />Session Type: lecture'
    );
  });

  test('ILM-based event', function (assert) {
    const today = DateTime.local().set({ hours: 8 }).toJSDate();
    const result = calendarEventTooltip(
      {
        startDate: today,
        endDate: today,
        name: 'test',
        location: 'room 101',
        instructors: ['Larry', 'Curly', 'Moe', 'Shemp'],
        courseTitle: 'Intro 101',
        isMulti: false,
        sessionTypeTitle: 'lecture',
        ilmSession: 1,
      },
      this.intl,
      'hh'
    );
    assert.strictEqual(
      result.string,
      'room 101<br />ILM - Due By 08<br />test<br /> Taught By Larry, Curly et al.<br />Course: Intro 101<br />Session Type: lecture'
    );
  });
});
