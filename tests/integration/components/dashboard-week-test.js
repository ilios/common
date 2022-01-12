import Service from '@ember/service';
import { DateTime } from 'luxon';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { setupIntl } from 'ember-intl/test-support';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { setupMirage } from 'ember-cli-mirage/test-support';

import { component } from 'ilios-common/page-objects/components/dashboard-week';

module('Integration | Component | dashboard week', function (hooks) {
  setupRenderingTest(hooks);
  setupIntl(hooks, 'en-us');
  setupMirage(hooks);

  const today = DateTime.local();

  hooks.beforeEach(function () {
    this.server.create('userevent', {
      name: 'Learn to Learn',
      startDate: today.toISO(),
      isBlanked: false,
      isPublished: true,
      isScheduled: false,
      offering: 1,
    });
    this.server.create('userevent', {
      name: 'Finding the Point in Life',
      startDate: today.toISO(),
      isBlanked: false,
      isPublished: true,
      isScheduled: false,
      ilmSession: 1,
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
  });

  const getTitle = function () {
    const startOfWeek = today.startOf('week').set({ hours: 0, minutes: 0, seconds: 0 });
    const endOfWeek = today.endOf('week').set({ hours: 23, minutes: 59, seconds: 59 });
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
    expectedTitle += ' Week at a Glance';

    return expectedTitle;
  };

  test('it renders with events', async function (assert) {
    assert.expect(5);
    this.owner.register('service:user-events', this.UserEventsMock);

    await render(hbs`<DashboardWeek />`);
    const expectedTitle = getTitle();
    assert.strictEqual(component.weeklyLink, 'All Weeks');
    assert.strictEqual(component.weekGlance.title, expectedTitle);
    assert.strictEqual(component.weekGlance.offeringEvents.length, 2, 'Blank events are not shown');
    assert.strictEqual(component.weekGlance.offeringEvents[0].title, 'Learn to Learn');
    assert.strictEqual(component.weekGlance.offeringEvents[1].title, 'Finding the Point in Life');
  });

  test('it renders blank', async function (assert) {
    assert.expect(3);
    this.owner.register('service:user-events', this.BlankEventsMock);
    this.userEvents = this.owner.lookup('service:user-events');

    await render(hbs`<DashboardWeek />`);
    const expectedTitle = getTitle();
    assert.strictEqual(component.weeklyLink, 'All Weeks');
    assert.strictEqual(component.weekGlance.title, expectedTitle);
    assert.strictEqual(component.weekGlance.offeringEvents.length, 0);
  });
});
