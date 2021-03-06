import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { a11yAudit } from 'ember-a11y-testing/test-support';
import { component } from 'ilios-common/page-objects/components/course/objective-list-item-parents';
import { setupMirage } from 'ember-cli-mirage/test-support';

module('Integration | Component | course/objective-list-item-parents', function (hooks) {
  setupRenderingTest(hooks);
  setupMirage(hooks);

  test('it renders and is accessible when managing', async function (assert) {
    await render(hbs`<Course::ObjectiveListItemParents
      @courseObjective={{null}}
      @editable={{false}}
      @manage={{noop}}
      @isManaging={{true}}
      @save={{noop}}
      @isSaving={{false}}
      @cancel={{noop}}
    />`);
    assert.ok(component.canSave);
    assert.ok(component.canCancel);
    await a11yAudit(this.element);
    assert.ok(true, 'no a11y errors found!');
  });

  test('it renders and is accessible empty and un-editable', async function (assert) {
    const course = this.server.create('course');
    const courseObjective = this.server.create('courseObjective', { course });
    const courseObjectiveModel = await this.owner
      .lookup('service:store')
      .find('courseObjective', courseObjective.id);
    this.set('courseObjective', courseObjectiveModel);
    await render(hbs`<Course::ObjectiveListItemParents
      @courseObjective={{this.courseObjective}}
      @editable={{false}}
      @manage={{noop}}
      @isManaging={{false}}
      @save={{noop}}
      @isSaving={{false}}
      @cancel={{noop}}
    />`);
    assert.equal(component.text, 'None');
    await a11yAudit(this.element);
    assert.ok(true, 'no a11y errors found!');
  });

  test('it renders and is accessible un-editable', async function (assert) {
    const programYearObjectives = this.server.createList('programYearObjective', 2);
    const course = this.server.create('course');
    const courseObjective = this.server.create('courseObjective', {
      course,
      programYearObjectives,
    });
    const courseObjectiveModel = await this.owner
      .lookup('service:store')
      .find('courseObjective', courseObjective.id);
    this.set('courseObjective', courseObjectiveModel);
    await render(hbs`<Course::ObjectiveListItemParents
      @courseObjective={{this.courseObjective}}
      @editable={{false}}
      @manage={{noop}}
      @isManaging={{false}}
      @save={{noop}}
      @isSaving={{false}}
      @cancel={{noop}}
    />`);
    assert.equal(component.list.length, 2);
    assert.equal(component.list[0].text, 'program-year objective 0');
    assert.equal(component.list[1].text, 'program-year objective 1');
    await a11yAudit(this.element);
    assert.ok(true, 'no a11y errors found!');
  });

  test('it renders and is accessible editable', async function (assert) {
    const programYearObjectives = this.server.createList('programYearObjective', 2);
    const course = this.server.create('course');
    const courseObjective = this.server.create('courseObjective', {
      course,
      programYearObjectives,
    });
    const courseObjectiveModel = await this.owner
      .lookup('service:store')
      .find('courseObjective', courseObjective.id);
    this.set('courseObjective', courseObjectiveModel);
    await render(hbs`<Course::ObjectiveListItemParents
      @courseObjective={{this.courseObjective}}
      @editable={{true}}
      @manage={{noop}}
      @isManaging={{false}}
      @save={{noop}}
      @isSaving={{false}}
      @cancel={{noop}}
    />`);
    assert.equal(component.list.length, 2);
    assert.equal(component.list[0].text, 'program-year objective 0');
    assert.equal(component.list[1].text, 'program-year objective 1');
    await a11yAudit(this.element);
    assert.ok(true, 'no a11y errors found!');
  });

  test('clicking save fires save', async function (assert) {
    assert.expect(1);
    const programYearObjectives = this.server.createList('programYearObjective', 2);
    const course = this.server.create('course');
    const courseObjective = this.server.create('courseObjective', {
      course,
      programYearObjectives,
    });
    const courseObjectiveModel = await this.owner
      .lookup('service:store')
      .find('courseObjective', courseObjective.id);
    this.set('courseObjective', courseObjectiveModel);
    this.set('save', () => {
      assert.ok(true);
    });
    await render(hbs`<Course::ObjectiveListItemParents
      @courseObjective={{this.courseObjective}}
      @editable={{true}}
      @manage={{noop}}
      @isManaging={{true}}
      @save={{this.save}}
      @isSaving={{false}}
      @cancel={{noop}}
    />`);
    await component.save();
  });

  test('clicking cancel fires cancel', async function (assert) {
    assert.expect(1);
    const programYearObjectives = this.server.createList('programYearObjective', 2);
    const course = this.server.create('course');
    const courseObjective = this.server.create('courseObjective', {
      course,
      programYearObjectives,
    });
    const courseObjectiveModel = await this.owner
      .lookup('service:store')
      .find('courseObjective', courseObjective.id);
    this.set('courseObjective', courseObjectiveModel);
    this.set('cancel', () => {
      assert.ok(true);
    });
    await render(hbs`<Course::ObjectiveListItemParents
      @courseObjective={{this.courseObjective}}
      @editable={{true}}
      @manage={{noop}}
      @isManaging={{true}}
      @save={{noop}}
      @isSaving={{false}}
      @cancel={{this.cancel}}
    />`);
    await component.cancel();
  });

  test('clicking objective fires manage', async function (assert) {
    assert.expect(1);
    const programYearObjectives = this.server.createList('programYearObjective', 2);
    const course = this.server.create('course');
    const courseObjective = this.server.create('courseObjective', {
      course,
      programYearObjectives,
    });
    const courseObjectiveModel = await this.owner
      .lookup('service:store')
      .find('courseObjective', courseObjective.id);
    this.set('courseObjective', courseObjectiveModel);
    this.set('manage', () => {
      assert.ok(true);
    });
    await render(hbs`<Course::ObjectiveListItemParents
      @courseObjective={{this.courseObjective}}
      @editable={{true}}
      @manage={{this.manage}}
      @isManaging={{false}}
      @save={{noop}}
      @isSaving={{false}}
      @cancel={{noop}}
    />`);
    await component.list[0].manage();
  });
});
