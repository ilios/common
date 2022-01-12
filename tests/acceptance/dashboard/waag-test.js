import { currentRouteName } from '@ember/test-helpers';
import { DateTime } from 'luxon';
import { module, test } from 'qunit';
import { setupAuthentication } from 'ilios-common';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import page from 'ilios-common/page-objects/dashboard';
import { a11yAudit } from 'ember-a11y-testing/test-support';

module('Acceptance | Dashboard Week at a Glance', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  const today = DateTime.local().set({ hours: 8 });

  hooks.beforeEach(async function () {
    this.school = this.server.create('school');
    this.user = await setupAuthentication({ school: this.school });
  });

  test('shows events', async function (assert) {
    const startOfWeek = today.startOf('week');
    const endOfWeek = today.endOf('week').set({ hours: 12, minutes: 59 });
    this.server.create('userevent', {
      user: Number(this.user.id),
      name: 'start of week',
      startDate: startOfWeek.toISO(),
      endDate: startOfWeek.plus({ hours: 1 }).toISO(),
      lastModified: today.minus({ years: 1 }).toISO(),
      isPublished: true,
      offering: 1,
    });

    this.server.create('userevent', {
      user: Number(this.user.id),
      name: 'end of week',
      startDate: endOfWeek.toISO(),
      endDate: endOfWeek.plus({ hours: 1 }).toISO(),
      lastModified: today.minus({ years: 1 }).toISO(),
      isPublished: true,
      offering: 2,
    });
    await page.visit({ show: 'week' });
    assert.strictEqual(currentRouteName(), 'dashboard');

    assert.strictEqual(page.weekGlance.offeringEvents.length, 2);
    assert.strictEqual(page.weekGlance.offeringEvents[0].title, 'start of week');
    assert.strictEqual(page.weekGlance.offeringEvents[1].title, 'end of week');
  });

  test('shows all pre work', async function (assert) {
    const prerequisites = [1, 2, 3].map((id) => {
      return {
        user: Number(this.user.id),
        name: `pre ${id}`,
        isPublished: true,
        ilmSession: id,
        session: id,
        prerequisites: [],
        postrequisites: [],
      };
    });
    this.server.create('userevent', {
      user: Number(this.user.id),
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      lastModified: today.minus({ years: 1 }).toISO(),
      isPublished: true,
      offering: 1,
      prerequisites,
    });
    await page.visit({ show: 'week' });
    assert.strictEqual(currentRouteName(), 'dashboard');

    assert.strictEqual(page.weekGlance.offeringEvents.length, 1);
    assert.strictEqual(page.weekGlance.preWork.length, 3);
    assert.strictEqual(page.weekGlance.preWork[0].title, 'pre 1');
    assert.strictEqual(page.weekGlance.preWork[1].title, 'pre 2');
    assert.strictEqual(page.weekGlance.preWork[2].title, 'pre 3');

    await a11yAudit();
    assert.ok(true, 'no a11y errors found!');
  });
});
