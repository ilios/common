import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, waitUntil } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Modifier | animate-loading', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders defaults', async function (assert) {
    await render(hbs`<div {{animate-loading}}></div>`);
    assert.dom('div').hasStyle({
      opacity: '0.1',
    });

    await waitUntil(
      () => getComputedStyle(this.element.querySelector('div'), null).opacity === '1',
      { timeout: 2000 }
    );
    assert.dom('div').hasStyle({
      opacity: '1',
      transition: 'opacity 1s linear 0s',
    });
  });

  test('it renders options', async function (assert) {
    await render(hbs`<div
      {{animate-loading initialOpacity=".3" finalOpacity="0.6" loadingTime=500}}>
    </div>`);
    assert.dom('div').hasStyle({
      opacity: '0.3',
    });

    await waitUntil(
      () => getComputedStyle(this.element.querySelector('div'), null).opacity === '0.6'
    );
    assert.dom('div').hasStyle({
      opacity: '0.6',
      transition: 'opacity 0.5s linear 0s',
    });
  });

  test('it works with tracker service', async function (assert) {
    const tracker = this.owner.lookup('service:loading-opacity-tracker');
    tracker.set('someKey', '0.23');
    await render(hbs`<div
      {{animate-loading "someKey"}}>
    </div>`);
    assert.dom('div').hasStyle({
      opacity: '0.23',
    });

    await waitUntil(
      () => getComputedStyle(this.element.querySelector('div'), null).opacity === '1'
    );
    assert.dom('div').hasStyle({
      opacity: '1',
      transition: 'opacity 1s linear 0s',
    });
    await render(hbs`<div></div>`);
    assert.strictEqual(tracker.get('someKey'), '1');
  });
});