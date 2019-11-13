import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { later } from '@ember/runloop';

module('Integration | Component | html editor', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    await render(hbs`<HtmlEditor />`);

    await later(() => {
      assert.dom(this.element).hasText('BoldItalicSubscriptSuperscriptOrdered ListUnordered ListInsert LinkUndoRedo');
      assert.dom('svg').exists({ count: 9 });
    }, 500);
  });
});
