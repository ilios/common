import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { setupIntl } from 'ember-intl/test-support';
import { settled, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { DateTime } from 'luxon';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { a11yAudit } from 'ember-a11y-testing/test-support';
import { component } from 'ilios-common/page-objects/components/weekly-calendar';

module('Integration | Component | weekly-calendar', function (hooks) {
  setupRenderingTest(hooks);
  setupIntl(hooks, 'en-us');
  setupMirage(hooks);

  hooks.beforeEach(function () {
    this.owner.lookup('service:intl').setLocale('en-us');
  });

  //reset locale for other tests
  hooks.afterEach(function () {
    this.owner.lookup('service:intl').setLocale('en-us');
  });

  this.createEvent = function (startDate, endDate, color) {
    this.server.create('userevent', {
      startDate: startDate,
      endDate: endDate,
      color: color || '#' + Math.floor(Math.random() * 16777215).toString(16),
      lastModified: endDate,
    });
  };

  test('it renders empty and is accessible', async function (assert) {
    const january9th2018 = '2019-01-09T08:00:00';
    this.set('date', january9th2018);
    await render(hbs`<WeeklyCalendar
      @date={{this.date}}
      @events={{(array)}}
      @changeToDayView={{(noop)}}
    />`);

    assert.strictEqual(component.longWeekOfYear, 'Week of January 7, 2019');
    assert.strictEqual(component.shortWeekOfYear, '1/7 — 1/13 2019');
    assert.strictEqual(component.dayHeadings.length, 7);
    assert.ok(component.dayHeadings[0].isFirstDayOfWeek);
    assert.strictEqual(component.dayHeadings[0].text, 'Monday Mon Jan 7 7');

    await a11yAudit(this.element);
    assert.ok(true, 'no a11y errors found!');
  });

  test('it renders with two events and is accessible', async function (assert) {
    const january9th2018 = '2019-01-09T08:00:00';
    this.createEvent('2019-01-09T08:00:00', '2019-01-09T09:00:00', '#ffffff');
    this.createEvent('2019-01-09T08:00:00', '2019-01-09T09:00:00', '#ffffff');
    this.set('events', this.server.db.userevents);
    this.set('date', january9th2018);
    await render(hbs`<WeeklyCalendar
      @date={{this.date}}
      @events={{this.events}}
      @changeToDayView={{(noop)}}
    />`);

    assert.strictEqual(component.dayHeadings.length, 7);
    assert.ok(component.dayHeadings[0].isFirstDayOfWeek);
    assert.strictEqual(component.dayHeadings[0].text, 'Monday Mon Jan 7 7');

    assert.strictEqual(component.events.length, 2);
    assert.ok(component.events[0].isThirdDayOfWeek);
    assert.strictEqual(component.events[0].name, 'event 0');
    assert.ok(component.events[1].isThirdDayOfWeek);
    assert.strictEqual(component.events[1].name, 'event 1');

    await a11yAudit(this.element);
    assert.ok(true, 'no a11y errors found!');
  });

  test('it renders with many events and is accessible', async function (assert) {
    const january9th2018 = '2019-01-09T08:00:00';
    this.createEvent('2019-01-07T08:00:00', '2019-01-07T09:00:00', '#ffffff');
    this.createEvent('2019-01-11T08:00:00', '2019-01-11T09:00:00', '#ffffff');
    this.createEvent('2019-01-09T08:00:00', '2019-01-09T09:00:00', '#ffffff');
    this.createEvent('2019-01-11T08:00:00', '2019-01-11T11:00:00', '#ffffff');
    this.createEvent('2019-01-07T14:00:00', '2019-01-07T16:00:00', '#ffffff');
    this.createEvent('2019-01-09T08:00:00', '2019-01-09T09:00:00', '#ffffff');
    this.set('events', this.server.db.userevents);
    this.set('date', january9th2018);
    await render(hbs`<WeeklyCalendar
      @date={{this.date}}
      @events={{this.events}}
      @changeToDayView={{(noop)}}
    />`);

    assert.strictEqual(component.dayHeadings.length, 7);
    assert.ok(component.dayHeadings[0].isFirstDayOfWeek);
    assert.strictEqual(component.dayHeadings[0].text, 'Monday Mon Jan 7 7');

    assert.strictEqual(component.events.length, 6);
    assert.ok(component.events[0].isFirstDayOfWeek);
    assert.strictEqual(component.events[0].name, 'event 0');

    assert.ok(component.events[1].isFirstDayOfWeek);
    assert.strictEqual(component.events[1].name, 'event 4');

    assert.ok(component.events[2].isThirdDayOfWeek);
    assert.strictEqual(component.events[2].name, 'event 2');

    assert.ok(component.events[3].isThirdDayOfWeek);
    assert.strictEqual(component.events[3].name, 'event 5');

    assert.ok(component.events[4].isFifthDayOfWeek);
    assert.strictEqual(component.events[4].name, 'event 1');

    assert.ok(component.events[5].isFifthDayOfWeek);
    assert.strictEqual(component.events[5].name, 'event 3');

    await a11yAudit(this.element);
    assert.ok(true, 'no a11y errors found!');
  });

  test('click on day', async function (assert) {
    assert.expect(1);
    const january9th2018 = '2019-01-09T08:00:00';
    this.set('date', january9th2018);
    this.set('changeToDayView', () => {
      assert.ok(true);
    });
    await render(hbs`<WeeklyCalendar
      @date={{this.date}}
      @events={{(array)}}
      @changeToDayView={{this.changeToDayView}}
      @selectEvent={{(noop)}}
    />`);

    await component.dayHeadings[1].selectDay();
  });

  test('click on event', async function (assert) {
    assert.expect(1);
    const january9th2018 = DateTime.fromISO('2019-01-09T08:00:00');
    this.server.create('userevent', {
      startDate: january9th2018.toISO(),
      endDate: january9th2018.plus({ hours: 1 }).toISO(),
      offering: 1,
    });
    this.set('events', this.server.db.userevents);
    this.set('date', january9th2018.toISO());
    this.set('selectEvent', () => {
      assert.ok(true);
    });
    await render(hbs`<WeeklyCalendar
      @date={{this.date}}
      @events={{this.events}}
      @changeToDayView={{(noop)}}
      @selectEvent={{this.selectEvent}}
    />`);

    await component.events[0].click();
  });

  test('clicking on multi event goes to day view', async function (assert) {
    assert.expect(1);
    const january9th2018 = DateTime.fromISO('2019-01-09T08:00:00');
    this.server.create('userevent', {
      isMulti: true,
      startDate: january9th2018.toISO(),
      endDate: january9th2018.plus({ hours: 1 }).toISO(),
      offering: 1,
    });
    this.set('events', this.server.db.userevents);
    this.set('date', january9th2018.toISO());
    this.set('changeToDayView', () => {
      assert.ok(true);
    });
    await render(hbs`<WeeklyCalendar
      @date={{this.date}}
      @events={{this.events}}
      @changeToDayView={{this.changeToDayView}}
      @selectEvent={{(noop)}}
    />`);

    await component.events[0].click();
  });

  test('changing the locale changes the calendar dec 11 1980', async function (assert) {
    const december111980 = DateTime.fromISO('1980-12-11T11:00:00');
    this.server.create('userevent', {
      startDate: december111980.toISO(),
      endDate: december111980.plus({ hours: 1 }).toISO(),
    });
    this.set('events', this.server.db.userevents);
    this.set('date', december111980.toISO());
    await render(hbs`<WeeklyCalendar
      @date={{this.date}}
      @events={{this.events}}
      @changeToDayView={{(noop)}}
      @selectEvent={{(noop)}}
    />`);

    assert.strictEqual(component.longWeekOfYear, 'Week of December 8, 1980');
    assert.strictEqual(component.shortWeekOfYear, '12/8 — 12/14 1980');

    assert.ok(component.dayHeadings[0].isFirstDayOfWeek);
    assert.strictEqual(component.dayHeadings[0].text, 'Monday Mon Dec 8 8');

    assert.strictEqual(component.events.length, 1);
    assert.ok(component.events[0].isFourthDayOfWeek);

    this.owner.lookup('service:intl').setLocale('es');

    assert.strictEqual(component.longWeekOfYear, 'Semana de 8 de diciembre de 1980');
    assert.strictEqual(component.shortWeekOfYear, '8/12 — 14/12 1980');
    assert.ok(component.dayHeadings[0].isFirstDayOfWeek);
    assert.ok(component.dayHeadings[0].text.match('lunes lun.? 8 dic.? 8'));

    assert.strictEqual(component.events.length, 1);
    assert.ok(component.events[0].isFourthDayOfWeek);

    await a11yAudit(this.element);
    assert.ok(true, 'no a11y errors found!');
  });

  test('changing the locale changes the calendar feb 23 2020', async function (assert) {
    const february252020 = DateTime.fromISO('2020-02-25T11:00:00');
    this.server.create('userevent', {
      startDate: february252020.toISO(),
      endDate: february252020.plus({ hours: 1 }).toISO(),
    });
    this.set('events', this.server.db.userevents);
    this.set('date', february252020.toISO());
    await render(hbs`<WeeklyCalendar
      @date={{this.date}}
      @events={{this.events}}
      @changeToDayView={{(noop)}}
      @selectEvent={{(noop)}}
    />`);

    assert.strictEqual(component.longWeekOfYear, 'Week of February 24, 2020');
    assert.strictEqual(component.shortWeekOfYear, '2/24 — 3/1 2020');

    assert.ok(component.dayHeadings[0].isFirstDayOfWeek);
    assert.strictEqual(component.dayHeadings[0].text, 'Monday Mon Feb 24 24');

    assert.strictEqual(component.events.length, 1);
    assert.ok(component.events[0].isThirdDayOfWeek);

    this.owner.lookup('service:intl').setLocale('es');
    this.owner.lookup('service:moment').setLocale('es');
    await settled();

    assert.strictEqual(component.longWeekOfYear, 'Semana de 24 de febrero de 2020');
    assert.strictEqual(component.shortWeekOfYear, '24/2 — 1/3 2020');
    assert.ok(component.dayHeadings[0].isFirstDayOfWeek);
    assert.ok(component.dayHeadings[0].text.match('lunes lun.? 24 feb.? 24'));

    assert.strictEqual(component.events.length, 1);
    assert.ok(component.events[0].isSecondDayOfWeek);

    await a11yAudit(this.element);
    assert.ok(true, 'no a11y errors found!');
  });
});
