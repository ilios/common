import Service from '@ember/service';
import { DateTime } from 'luxon';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { setupIntl } from 'ember-intl/test-support';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { component } from 'ilios-common/page-objects/components/week-glance';
import { a11yAudit } from 'ember-a11y-testing/test-support';

module('Integration | Component | week glance', function (hooks) {
  setupRenderingTest(hooks);
  setupIntl(hooks, 'en-us');
  setupMirage(hooks);
  const testDate = DateTime.fromISO('2017-01-19T00:00:00');

  hooks.beforeEach(function () {
    this.server.create('userevent', {
      name: 'Learn to Learn',
      startDate: testDate.toISO(),
      isBlanked: false,
      isPublished: true,
      isScheduled: false,
      offering: 1,
      slug: 'a',
    });
    this.server.create('userevent', {
      name: 'Finding the Point in Life',
      startDate: testDate.toISO(),
      isBlanked: false,
      isPublished: true,
      isScheduled: false,
      ilmSession: 1,
      slug: 'b',
    });
    this.server.create('userevent', {
      name: 'Blank',
      isBlanked: true,
    });
    this.server.create('userevent', {
      name: 'Not Published',
      isBlanked: false,
      isPublished: false,
      isScheduled: false,
    });
    this.server.create('userevent', {
      name: 'Scheduled',
      isBlanked: false,
      isPublished: true,
      isScheduled: true,
    });
    this.server.create('userevent', {
      name: 'Schedule some materials',
      startDate: testDate.toISO(),
      location: 'Room 123',
      isBlanked: false,
      isPublished: true,
      isScheduled: false,
      offering: 1,
      slug: 'c',
    });
    const events = this.server.db.userevents;

    class UserEventsMock extends Service {
      async getEvents() {
        return events.toArray();
      }
    }

    class BlankEventsMock extends Service {
      async getEvents() {
        return [];
      }
    }

    this.UserEventsMock = UserEventsMock;
    this.BlankEventsMock = BlankEventsMock;

    this.getTitle = function (fullTitle) {
      const startOfWeek = testDate.startOf('week');
      const endOfWeek = testDate.endOf('week').set({ hours: 23, minutes: 59, seconds: 59 });

      let expectedTitle;
      if (startOfWeek.month !== endOfWeek.month) {
        const from = startOfWeek.toFormat('LLLL d');
        const to = endOfWeek.toFormat('LLLL d');
        expectedTitle = `${from} - ${to}`;
      } else {
        const from = startOfWeek.toFormat('LLLL d');
        const to = endOfWeek.toFormat('d');
        expectedTitle = `${from}-${to}`;
      }
      if (fullTitle) {
        expectedTitle += ' Week at a Glance';
      }

      return expectedTitle;
    };
  });

  test('it renders with events', async function (assert) {
    assert.expect(6);
    this.owner.register('service:user-events', this.UserEventsMock);
    this.set('today', testDate.toJSDate());
    await render(hbs`<WeekGlance
      @collapsible={{false}}
      @collapsed={{false}}
      @showFullTitle={{true}}
      @year={{format-date this.today year="numeric"}}
      @week={{moment-format this.today "W"}}
    />`);

    assert.strictEqual(component.title, this.getTitle(true));
    assert.strictEqual(component.offeringEvents.length, 3);
    assert.strictEqual(component.offeringEvents[0].title, 'Learn to Learn');
    assert.strictEqual(component.offeringEvents[1].title, 'Finding the Point in Life');
    assert.strictEqual(component.offeringEvents[2].title, 'Schedule some materials');

    await a11yAudit(this.element);
    assert.ok(true, 'no a11y errors found!');
  });

  test('it renders blank', async function (assert) {
    assert.expect(2);
    this.owner.register('service:user-events', this.BlankEventsMock);
    this.userEvents = this.owner.lookup('service:user-events');

    this.set('today', testDate.toJSDate());
    await render(hbs`<WeekGlance
      @collapsible={{false}}
      @collapsed={{false}}
      @showFullTitle={{true}}
      @year={{format-date this.today year="numeric"}}
      @week={{moment-format this.today "W"}}
    />`);
    const title = '[data-test-week-title]';
    const body = 'p';
    const expectedTitle = this.getTitle(true);
    assert.strictEqual(
      this.element.querySelector(title).textContent.replace(/[\t\n\s]+/g, ''),
      expectedTitle.replace(/[\t\n\s]+/g, '')
    );
    assert.dom(this.element.querySelector(body)).hasText('None');
  });

  test('renders short title', async function (assert) {
    assert.expect(1);
    this.owner.register('service:user-events', this.BlankEventsMock);
    this.userEvents = this.owner.lookup('service:user-events');

    this.set('today', testDate.toJSDate());
    await render(hbs`<WeekGlance
      @collapsible={{false}}
      @collapsed={{false}}
      @showFullTitle={{false}}
      @year={{format-date this.today year="numeric"}}
      @week={{moment-format this.today "W"}}
    />`);
    const title = '[data-test-week-title]';
    const expectedTitle = this.getTitle(false);
    assert.strictEqual(
      this.element.querySelector(title).textContent.replace(/[\t\n\s]+/g, ''),
      expectedTitle.replace(/[\t\n\s]+/g, '')
    );
  });

  test('it renders collapsed', async function (assert) {
    assert.expect(3);
    this.owner.register('service:user-events', this.BlankEventsMock);
    this.userEvents = this.owner.lookup('service:user-events');

    this.set('today', testDate.toJSDate());
    await render(hbs`<WeekGlance
      @collapsible={{true}}
      @collapsed={{true}}
      @showFullTitle={{false}}
      @year={{format-date this.today year="numeric"}}
      @week={{moment-format this.today "W"}}
    />`);
    const title = '[data-test-week-title]';
    const body = 'p';
    const expectedTitle = this.getTitle(false);
    assert.strictEqual(
      this.element.querySelector(title).textContent.replace(/[\t\n\s]+/g, ''),
      expectedTitle.replace(/[\t\n\s]+/g, '')
    );
    assert.strictEqual(this.element.querySelectorAll(body).length, 0);

    await a11yAudit(this.element);
    assert.ok(true, 'no a11y errors found!');
  });

  test('click to expend', async function (assert) {
    assert.expect(1);
    this.owner.register('service:user-events', this.BlankEventsMock);
    this.userEvents = this.owner.lookup('service:user-events');

    this.set('today', testDate.toJSDate());
    this.set('toggle', (value) => {
      assert.ok(value);
    });
    await render(hbs`<WeekGlance
      @collapsible={{true}}
      @collapsed={{true}}
      @showFullTitle={{false}}
      @year={{format-date this.today year="numeric"}}
      @week={{moment-format this.today "W"}}
      @toggleCollapsed={{this.toggle}}
    />`);
    const title = '[data-test-week-title]';
    await click(title);
  });

  test('click to collapse', async function (assert) {
    assert.expect(1);
    this.owner.register('service:user-events', this.BlankEventsMock);
    this.userEvents = this.owner.lookup('service:user-events');

    this.set('today', testDate.toJSDate());
    this.set('toggle', (value) => {
      assert.notOk(value);
    });
    await render(hbs`<WeekGlance
      @collapsible={{true}}
      @collapsed={{false}}
      @showFullTitle={{false}}
      @year={{format-date this.today year="numeric"}}
      @week={{moment-format this.today "W"}}
      @toggleCollapsed={{this.toggle}}
    />`);
    const title = '[data-test-week-title]';
    await click(title);
  });

  test('changing passed properties re-renders', async function (assert) {
    assert.expect(10);
    const nextYear = testDate.plus({ years: 1 });
    let count = 1;
    this.BlankEventsMock = Service.reopen({
      async getEvents(fromStamp, toStamp) {
        const from = DateTime.fromSeconds(fromStamp);
        const to = DateTime.fromSeconds(toStamp);
        switch (count) {
          case 1:
            assert.ok(from.hasSame(testDate, 'year'), 'From-date has same year as testDate.');
            assert.ok(to.hasSame(testDate, 'year'), 'To-date has same year as testDate.');
            assert.strictEqual(
              from.weekNumber,
              testDate.weekNumber,
              'From-date has same week as testDate.'
            );
            assert.strictEqual(
              to.weekNumber,
              testDate.weekNumber,
              'To-date has same week as testDate.'
            );
            break;
          case 2:
            assert.ok(from.hasSame(nextYear, 'year'), 'From-date has same year as next year.');
            assert.ok(to.hasSame(nextYear, 'year'), 'To-date has same year as next year.');
            // comparing weeks needs some wiggle room as dates may be shifting across week lines.
            assert.ok(
              1 >= Math.abs(from.weekNumber - nextYear.weekNumber),
              'From-date is at the most one week off from next year.'
            );
            assert.ok(
              1 >= Math.abs(to.weekNumber - nextYear.weekNumber),
              'To-date has is at the most one week off from next year.'
            );
            break;
          default:
            assert.notOk(true, 'Called too many times');
        }
        count++;
        return [];
      },
    });
    this.owner.register('service:user-events', this.BlankEventsMock);
    this.userEvents = this.owner.lookup('service:user-events');

    const year = testDate.year;
    this.set('year', year);
    this.set('today', testDate.toJSDate());
    await render(hbs`<WeekGlance
      @collapsible={{false}}
      @collapsed={{false}}
      @showFullTitle={{true}}
      @year={{this.year}}
      @week={{moment-format this.today "W"}}
    />`);
    const title = '[data-test-week-title]';
    const body = 'p';
    const expectedTitle = this.getTitle(true);
    assert.strictEqual(
      this.element.querySelector(title).textContent.replace(/[\t\n\s]+/g, ''),
      expectedTitle.replace(/[\t\n\s]+/g, '')
    );
    assert.dom(this.element.querySelector(body)).hasText('None');
    this.set('year', nextYear.year);
  });
});
