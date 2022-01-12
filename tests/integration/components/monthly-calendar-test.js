import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { setupIntl } from 'ember-intl/test-support';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { DateTime } from 'luxon';
import { component } from 'ilios-common/page-objects/components/monthly-calendar';
import { a11yAudit } from 'ember-a11y-testing/test-support';
import { setupMirage } from 'ember-cli-mirage/test-support';

module('Integration | Component | monthly-calendar', function (hooks) {
  setupRenderingTest(hooks);
  setupIntl(hooks, 'en-us');
  setupMirage(hooks);

  test('it renders empty and is accessible', async function (assert) {
    const january9th2018 = DateTime.fromISO('2019-01-09T08:00:00');
    this.set('date', january9th2018.toISO());
    await render(hbs`<MonthlyCalendar
      @date={{this.date}}
      @events={{(array)}}
      @changeToDayView={{(noop)}}
      @selectEvent={{(noop)}}
    />`);
    assert.strictEqual(component.days.length, 31);
    assert.ok(component.days[0].isSecondDayOfWeek);
    assert.ok(component.days[0].isFirstWeek);

    await a11yAudit(this.element);
    assert.ok(true, 'no a11y errors found!');
  });

  test('it renders with two events and is accessible', async function (assert) {
    const january9th2018 = DateTime.fromISO('2019-01-09T08:00:00');
    this.server.createList('userevent', 2, {
      startDate: january9th2018.toISO(),
      endDate: january9th2018.plus({ hour: 1 }).toISO(),
    });
    this.set('events', this.server.db.userevents);
    this.set('date', january9th2018.toISO());
    await render(hbs`<MonthlyCalendar
      @date={{this.date}}
      @events={{this.events}}
      @changeToDayView={{(noop)}}
      @selectEvent={{(noop)}}
    />`);

    assert.strictEqual(component.days.length, 31);
    assert.ok(component.days[8].isThirdDayOfWeek);
    assert.ok(component.days[8].isSecondWeek);
    assert.strictEqual(component.days[8].events.length, 2);
    assert.notOk(component.days[8].hasShowMore);

    await a11yAudit(this.element);
    assert.ok(true, 'no a11y errors found!');
  });

  test('it renders with three events and is accessible', async function (assert) {
    const january9th2018 = DateTime.fromISO('2019-01-09T08:00:00');
    this.server.createList('userevent', 3, {
      startDate: january9th2018.toISO(),
      endDate: january9th2018.plus({ hour: 1 }).toISO(),
    });
    this.set('events', this.server.db.userevents);
    this.set('date', january9th2018.toISO());
    await render(hbs`<MonthlyCalendar
      @date={{this.date}}
      @events={{this.events}}
      @changeToDayView={{(noop)}}
      @selectEvent={{(noop)}}
    />`);

    assert.strictEqual(component.days.length, 31);
    assert.ok(component.days[8].isThirdDayOfWeek);
    assert.ok(component.days[8].isSecondWeek);
    assert.strictEqual(component.days[8].events.length, 2);
    assert.ok(component.days[8].hasShowMore);

    await a11yAudit(this.element);
    assert.ok(true, 'no a11y errors found!');
  });

  test('click on day', async function (assert) {
    assert.expect(1);
    const january9th2018 = DateTime.fromISO('2019-01-09T08:00:00');
    this.set('date', january9th2018.toISO());
    this.set('changeToDayView', () => {
      assert.ok(true);
    });
    await render(hbs`<MonthlyCalendar
      @date={{this.date}}
      @events={{(array)}}
      @changeToDayView={{this.changeToDayView}}
      @selectEvent={{(noop)}}
    />`);

    await component.days[2].selectDay();
  });

  test('click on event', async function (assert) {
    assert.expect(1);
    const january9th2018 = DateTime.fromISO('2019-01-09T08:00:00');
    this.server.create('userevent', {
      startDate: january9th2018.toISO(),
      endDate: january9th2018.plus({ hour: 1 }).toISO(),
      offering: 1,
    });
    this.set('events', this.server.db.userevents);
    this.set('date', january9th2018);
    this.set('selectEvent', () => {
      assert.ok(true);
    });
    await render(hbs`<MonthlyCalendar
      @date={{this.date}}
      @events={{this.events}}
      @changeToDayView={{(noop)}}
      @selectEvent={{this.selectEvent}}
    />`);

    await component.days[8].events[0].click();
  });

  test('click on show more', async function (assert) {
    assert.expect(1);
    const january9th2018 = DateTime.fromISO('2019-01-09T08:00:00');
    this.server.createList('userevent', 3, {
      startDate: january9th2018.toISO(),
      endDate: january9th2018.plus({ hour: 1 }).toISO(),
    });
    this.set('events', this.server.db.userevents);
    this.set('date', january9th2018);
    this.set('changeToDayView', () => {
      assert.ok(true);
    });
    await render(hbs`<MonthlyCalendar
      @date={{this.date}}
      @events={{this.events}}
      @changeToDayView={{this.changeToDayView}}
      @selectEvent={{(noop)}}
    />`);

    await component.days[8].showMore();
  });

  test('clicking on multi event goes to day view', async function (assert) {
    assert.expect(1);
    const january9th2018 = DateTime.fromISO('2019-01-09T08:00:00');
    this.server.create('userevent', {
      isMulti: true,
      startDate: january9th2018.toISO(),
      endDate: january9th2018.plus({ hour: 1 }).toISO(),
      offering: 1,
    });
    this.set('events', this.server.db.userevents);
    this.set('date', january9th2018);
    this.set('changeToDayView', () => {
      assert.ok(true);
    });
    await render(hbs`<MonthlyCalendar
      @date={{this.date}}
      @events={{this.events}}
      @changeToDayView={{this.changeToDayView}}
      @selectEvent={{(noop)}}
    />`);

    await component.days[8].events[0].click();
  });
});
