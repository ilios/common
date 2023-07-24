import { module, test } from 'qunit';
import { setupApplicationTest } from 'dummy/tests/helpers';
import page from 'ilios-common/page-objects/weeklyevents';
import { setupAuthentication } from 'ilios-common';

module('Acceptance | weekly events', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(async function () {
    this.school = this.server.create('school');
    this.user = await setupAuthentication({ school: this.school });
  });

  test('it renders', async function (assert) {
    await page.visit();
    assert.notOk(page.backLink.isVisible);
    // @todo implement this further [ST 2023/07/24]
    assert.ok(page.weeklyEvents.isVisible);
  });
});
