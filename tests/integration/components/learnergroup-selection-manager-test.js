import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { component } from 'ilios-common/page-objects/components/learnergroup-selection-manager';

module('Integration | Component | learnergroup-selection-manager', function (hooks) {
  setupRenderingTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function () {
    const program = this.server.create('program');
    const programYear1 = this.server.create('program-year', { program });
    const programYear2 = this.server.create('program-year', { program });
    const cohort1 = this.server.create('cohort', {
      programYear: programYear1,
    });
    const cohort2 = this.server.create('cohort', {
      programYear: programYear2,
    });
    const secondLevelLearnerGroup1 = this.server.create('learner-group', {
      title: 'Second 1',
      cohort: cohort1,
    });
    const secondLevelLearnerGroup2 = this.server.create('learner-group', {
      title: 'Second 2',
      cohort: cohort1,
      needsAccommodation: true,
    });
    const secondLevelLearnerGroup3 = this.server.create('learner-group', {
      title: 'Second 10',
      cohort: cohort2,
      needsAccommodation: true,
    });
    const topLevelLearnerGroup1 = this.server.create('learner-group', {
      title: 'Top Group 1',
      children: [secondLevelLearnerGroup1, secondLevelLearnerGroup2],
      cohort: cohort1,
      needsAccommodation: true,
    });
    const topLevelLearnerGroup2 = this.server.create('learner-group', {
      title: 'Top Group 2',
      children: [secondLevelLearnerGroup3],
      cohort: cohort2,
    });
    const topLevelLearnerGroup3 = this.server.create('learner-group', {
      title: 'Top Group 10',
      cohort: cohort2,
    });

    const store = this.owner.lookup('service:store');
    this.cohort1 = await store.find('cohort', cohort1.id);
    this.cohort2 = await store.find('cohort', cohort2.id);
    this.topLevelLearnerGroup1 = await store.find('learner-group', topLevelLearnerGroup1.id);
    this.topLevelLearnerGroup2 = await store.find('learner-group', topLevelLearnerGroup2.id);
    this.topLevelLearnerGroup3 = await store.find('learner-group', topLevelLearnerGroup3.id);
    this.secondLevelLearnerGroup1 = await store.find('learner-group', secondLevelLearnerGroup1.id);
    this.secondLevelLearnerGroup2 = await store.find('learner-group', secondLevelLearnerGroup2.id);
    this.secondLevelLearnerGroup3 = await store.find('learner-group', secondLevelLearnerGroup3.id);
  });

  test('it renders', async function (assert) {
    this.set('learnerGroups', [this.secondLevelLearnerGroup1, this.secondLevelLearnerGroup3]);
    this.set('cohorts', [this.cohort1, this.cohort2]);
    await render(hbs`<LearnergroupSelectionManager
      @learnerGroups={{this.learnerGroups}}
      @cohorts={{this.cohorts}}
      @add={{noop}}
      @remove={{noop}}
    />`);
    assert.equal(component.selectedGroups.title, 'Selected Learner Groups');
    assert.equal(component.selectedGroups.list.trees.length, 2);
    assert.equal(component.selectedGroups.list.trees[0].title, 'Top Group 1 (program 0 cohort 0)');
    assert.equal(component.selectedGroups.list.trees[0].subgroups.length, 2);
    assert.equal(component.selectedGroups.list.trees[0].subgroups[0].title, 'Top Group 1 (0)');
    assert.ok(component.selectedGroups.list.trees[0].subgroups[0].needsAccommodation);
    assert.equal(component.selectedGroups.list.trees[0].subgroups[1].title, 'Second 1 (0)');
    assert.notOk(component.selectedGroups.list.trees[0].subgroups[1].needsAccommodation);
    assert.equal(component.selectedGroups.list.trees[1].title, 'Top Group 2 (program 0 cohort 1)');
    assert.equal(component.selectedGroups.list.trees[1].subgroups.length, 2);
    assert.equal(component.selectedGroups.list.trees[1].subgroups[0].title, 'Top Group 2 (0)');
    assert.notOk(component.selectedGroups.list.trees[1].subgroups[0].needsAccommodation);
    assert.equal(component.selectedGroups.list.trees[1].subgroups[1].title, 'Second 10 (0)');
    assert.ok(component.selectedGroups.list.trees[1].subgroups[1].needsAccommodation);
    assert.equal(component.availableGroups.title, 'Available Learner Groups');
    assert.equal(component.availableGroups.cohorts.length, 2);
    assert.equal(component.availableGroups.cohorts[0].title, 'program 0 cohort 0');
    assert.equal(component.availableGroups.cohorts[0].trees.length, 1);
    assert.equal(component.availableGroups.cohorts[0].trees[0].title, 'Top Group 1');
    assert.ok(component.availableGroups.cohorts[0].trees[0].needsAccommodation);
    assert.notOk(component.availableGroups.cohorts[0].trees[0].isHidden);
    assert.equal(component.availableGroups.cohorts[0].trees[0].subgroups.length, 2);
    assert.equal(component.availableGroups.cohorts[0].trees[0].subgroups[0].title, 'Second 1');
    assert.ok(component.availableGroups.cohorts[0].trees[0].subgroups[0].isHidden);
    assert.equal(component.availableGroups.cohorts[0].trees[0].subgroups[1].title, 'Second 2');
    assert.ok(component.availableGroups.cohorts[0].trees[0].subgroups[1].needsAccommodation);
    assert.notOk(component.availableGroups.cohorts[0].trees[0].subgroups[1].isHidden);
    assert.equal(component.availableGroups.cohorts[1].title, 'program 0 cohort 1');
    assert.equal(component.availableGroups.cohorts[1].trees.length, 2);
    assert.equal(component.availableGroups.cohorts[1].trees[0].title, 'Top Group 2');
    assert.notOk(component.availableGroups.cohorts[1].trees[0].needsAccommodation);
    assert.notOk(component.availableGroups.cohorts[1].trees[0].isHidden);
    assert.equal(component.availableGroups.cohorts[1].trees[0].subgroups.length, 1);
    assert.equal(component.availableGroups.cohorts[1].trees[0].subgroups[0].title, 'Second 10');
    assert.ok(component.availableGroups.cohorts[1].trees[0].subgroups[0].isHidden);
    assert.equal(component.availableGroups.cohorts[1].trees[1].title, 'Top Group 10');
    assert.notOk(component.availableGroups.cohorts[1].trees[1].needsAccommodation);
    assert.notOk(component.availableGroups.cohorts[1].trees[1].isHidden);
    assert.equal(component.availableGroups.cohorts[1].trees[1].subgroups.length, 0);
  });

  test('remove selected group', async function (assert) {
    assert.expect(1);
    this.set('remove', (learnerGroup) => {
      assert.ok(this.secondLevelLearnerGroup1, learnerGroup);
    });
    this.set('learnerGroups', [this.secondLevelLearnerGroup1]);
    this.set('cohorts', [this.cohort1]);
    await render(hbs`<LearnergroupSelectionManager
      @learnerGroups={{this.learnerGroups}}
      @cohorts={{this.cohorts}}
      @add={{noop}}
      @remove={{this.remove}}
    />`);
    await component.selectedGroups.list.trees[0].subgroups[1].remove();
  });

  test('add available group', async function (assert) {
    assert.expect(1);
    this.set('add', (learnerGroup) => {
      assert.ok(this.secondLevelLearnerGroup1, learnerGroup);
    });
    this.set('learnerGroups', []);
    this.set('cohorts', [this.cohort1]);
    await render(hbs`<LearnergroupSelectionManager
      @learnerGroups={{this.learnerGroups}}
      @cohorts={{this.cohorts}}
      @add={{this.add}}
      @remove={{noop}}
    />`);
    await component.availableGroups.cohorts[0].trees[0].subgroups[0].add();
  });
});
