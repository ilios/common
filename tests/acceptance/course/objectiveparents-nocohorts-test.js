import { module, test } from 'qunit';
import { setupAuthentication } from 'ilios-common';

import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import page from 'ilios-common/page-objects/course';

module('Acceptance | Course with no cohorts - Objective Parents', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  hooks.beforeEach(async function () {
    this.user = await setupAuthentication();
    this.school = this.server.create('school');
    const program = this.server.create('program', { school: this.school });

    const programYear = this.server.create('programYear', { program });
    this.server.create('cohort', { programYear });
    const competency = this.server.create('competency', {
      school: this.school,
      programYears: [programYear],
    });
    this.server.create('programYearObjective', { programYear, competency });
    const course = this.server.create('course', {
      year: 2013,
      school: this.school,
    });
    this.server.create('courseObjective', { course });
  });

  test('add and remove a new cohort', async function (assert) {
    this.user.update({ administeredSchools: [this.school] });
    assert.expect(14);

    await page.visit({
      courseId: 1,
      details: true,
      courseObjectiveDetails: true,
    });
    assert.equal(page.objectives.objectiveList.objectives.length, 1);
    const firstObjective = page.objectives.objectiveList.objectives[0];

    assert.equal(firstObjective.description.text, 'course objective 0');
    assert.ok(firstObjective.parents.empty);
    await firstObjective.parents.list[0].manage();
    const m = firstObjective.parentManager;

    assert.ok(m.hasNoCohortWarning);

    await page.cohorts.manage();
    await page.cohorts.selectable[0].add();
    await page.cohorts.save();
    assert.equal(page.cohorts.current.length, 1);
    await firstObjective.parents.list[0].manage();

    assert.equal(m.selectedCohortTitle, 'program 0 cohort 0');
    assert.equal(m.competencies.length, 1);
    assert.equal(m.competencies[0].title, 'competency 0');
    assert.ok(m.competencies[0].notSelected);
    assert.equal(m.competencies[0].objectives.length, 1);
    assert.equal(m.competencies[0].objectives[0].title, 'program-year objective 0');
    assert.ok(m.competencies[0].objectives[0].notSelected);

    await page.cohorts.manage();
    await page.cohorts.selected[0].remove();
    await page.cohorts.save();
    assert.equal(page.cohorts.current.length, 0);
    await firstObjective.parents.list[0].manage();
    assert.ok(m.hasNoCohortWarning);
  });
});
