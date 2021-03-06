import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Model | Course', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const model = this.owner.lookup('service:store').createRecord('course');
    assert.ok(!!model);
  });

  test('check required publication items', function (assert) {
    const model = this.owner.lookup('service:store').createRecord('course');
    const store = this.owner.lookup('service:store');
    assert.equal(model.get('requiredPublicationIssues').length, 3);
    var cohort = store.createRecord('cohort');
    model.get('cohorts').addObject(cohort);
    assert.equal(model.get('requiredPublicationIssues').length, 2);
    model.set('startDate', 'nothing');
    assert.equal(model.get('requiredPublicationIssues').length, 1);
    model.set('endDate', 'nothing');
    assert.equal(model.get('requiredPublicationIssues').length, 0);
  });

  test('check optional publication items', function (assert) {
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('course');
    assert.equal(model.get('optionalPublicationIssues').length, 3);
    model.get('terms').addObject(store.createRecord('term'));
    assert.equal(model.get('optionalPublicationIssues').length, 2);
    const courseObjective = store.createRecord('course-objective', {
      course: model,
    });
    model.get('courseObjectives').addObject(courseObjective);
    assert.equal(model.get('optionalPublicationIssues').length, 1);
    model.get('meshDescriptors').addObject(store.createRecord('meshDescriptor'));
    assert.equal(model.get('optionalPublicationIssues').length, 0);
  });

  test('check empty competencies', async function (assert) {
    assert.expect(1);
    const course = this.owner.lookup('service:store').createRecord('course');

    const competencies = await course.get('competencies');
    assert.equal(competencies.length, 0);
  });

  test('check competencies', async function (assert) {
    assert.expect(4);
    const course = this.owner.lookup('service:store').createRecord('course');
    const store = this.owner.lookup('service:store');

    const competency1 = store.createRecord('competency');
    const competency2 = store.createRecord('competency');
    const competency3 = store.createRecord('competency');
    const programYearObjective1 = store.createRecord('program-year-objective', {
      competency: competency1,
    });
    const programYearObjective2 = store.createRecord('program-year-objective', {
      competency: competency2,
    });
    const programYearObjective3 = store.createRecord('program-year-objective', {
      competency: competency3,
    });
    store.createRecord('course-objective', {
      course,
      programYearObjectives: [programYearObjective1],
    });
    store.createRecord('course-objective', {
      course,
      programYearObjectives: [programYearObjective2, programYearObjective3],
    });

    const competencies = await course.get('competencies');

    assert.equal(competencies.length, 3);
    assert.ok(competencies.includes(competency1));
    assert.ok(competencies.includes(competency2));
    assert.ok(competencies.includes(competency3));
  });

  test('check publishedSessionOfferingCounts count', function (assert) {
    assert.expect(2);
    const course = this.owner.lookup('service:store').createRecord('course');
    const store = this.owner.lookup('service:store');

    const offering1 = store.createRecord('offering');
    const offering2 = store.createRecord('offering');
    const offering3 = store.createRecord('offering');
    const offering4 = store.createRecord('offering');

    const session1 = store.createRecord('session', {
      offerings: [offering1, offering2],
      published: true,
    });
    const session2 = store.createRecord('session', {
      offerings: [offering3],
      published: true,
    });
    const session3 = store.createRecord('session', {
      offerings: [offering4],
      published: false,
    });

    course.get('sessions').pushObjects([session1, session2, session3]);

    assert.equal(course.get('publishedOfferingCount'), 3);
    const offering5 = store.createRecord('offering');
    session1.get('offerings').pushObject(offering5);
    session3.set('published', true);

    assert.equal(course.get('publishedOfferingCount'), 5);
  });

  test('domains', async function (assert) {
    assert.expect(10);
    const course = this.owner.lookup('service:store').createRecord('course');
    const store = this.owner.lookup('service:store');
    const domain1 = store.createRecord('competency', {
      id: 1,
      title: 'Zylinder',
    });
    const domain2 = store.createRecord('competency', { id: 2, title: 'Anton' });
    const domain3 = store.createRecord('competency', {
      id: 3,
      title: 'Lexicon',
    });
    const competency1 = store.createRecord('competency', {
      id: 4,
      title: 'Zeppelin',
      parent: domain1,
    });
    const competency2 = store.createRecord('competency', {
      id: 5,
      title: 'Aardvark',
      parent: domain1,
    });
    const competency3 = store.createRecord('competency', {
      id: 6,
      title: 'Geflarknik',
      parent: domain2,
    });
    // competencies that are linked to these domains, but not to this course.
    // they should not appear in the output.
    store.createRecord('competency', { id: 7, parent: domain1 });
    store.createRecord('competency', { id: 8, parent: domain2 });
    store.createRecord('competency', { id: 9, parent: domain3 });

    const programYearObjective1 = store.createRecord('program-year-objective', {
      competency: competency1,
    });
    const programYearObjective2 = store.createRecord('program-year-objective', {
      competency: competency2,
    });
    const programYearObjective3 = store.createRecord('program-year-objective', {
      competency: competency3,
    });
    const programYearObjective4 = store.createRecord('program-year-objective', {
      competency: domain3,
    });

    store.createRecord('course-objective', {
      course,
      programYearObjectives: [programYearObjective1],
    });
    store.createRecord('course-objective', {
      course,
      programYearObjectives: [programYearObjective2],
    });
    store.createRecord('course-objective', {
      course,
      programYearObjectives: [programYearObjective3],
    });
    store.createRecord('course-objective', {
      course,
      programYearObjectives: [programYearObjective4],
    });

    const domainProxies = await course.get('domains');
    assert.equal(domainProxies.length, 3);

    const domainProxy1 = domainProxies[0];
    assert.equal(domainProxy1.get('content'), domain2);
    assert.equal(domainProxy1.get('subCompetencies').length, 1);
    assert.ok(domainProxy1.get('subCompetencies').includes(competency3));

    const domainProxy2 = domainProxies[1];
    assert.equal(domainProxy2.get('content'), domain3);
    assert.equal(domainProxy2.get('subCompetencies').length, 0);

    const domainProxy3 = domainProxies[2];
    assert.equal(domainProxy3.get('content'), domain1);
    assert.equal(domainProxy3.get('subCompetencies').length, 2);
    assert.equal(domainProxy3.get('subCompetencies')[0], competency2);
    assert.equal(domainProxy3.get('subCompetencies')[1], competency1);
  });

  test('schools', async function (assert) {
    assert.expect(4);
    const course = this.owner.lookup('service:store').createRecord('course');
    const store = this.owner.lookup('service:store');
    const school1 = store.createRecord('school');
    const school2 = store.createRecord('school');
    const school3 = store.createRecord('school');
    const program1 = store.createRecord('program', { school: school2 });
    const program2 = store.createRecord('program', { school: school2 });
    const program3 = store.createRecord('program', { school: school3 });
    const programYear1 = store.createRecord('programYear', {
      program: program1,
    });
    const programYear2 = store.createRecord('programYear', {
      program: program2,
    });
    const programYear3 = store.createRecord('programYear', {
      program: program3,
    });
    const cohort1 = store.createRecord('cohort', { programYear: programYear1 });
    const cohort2 = store.createRecord('cohort', { programYear: programYear2 });
    const cohort3 = store.createRecord('cohort', { programYear: programYear3 });

    course.get('cohorts').pushObjects([cohort1, cohort2, cohort3]);
    course.set('school', school1);

    const schools = await course.get('schools');

    assert.equal(schools.length, 3);
    assert.ok(schools.includes(school1));
    assert.ok(schools.includes(school2));
    assert.ok(schools.includes(school3));
  });

  test('assignableVocabularies', async function (assert) {
    assert.expect(5);
    const course = this.owner.lookup('service:store').createRecord('course');
    const store = this.owner.lookup('service:store');
    const school1 = store.createRecord('school', { title: 'Zylinder' });
    const school2 = store.createRecord('school', { title: 'Anton' });
    const vocabulary1 = store.createRecord('vocabulary', {
      title: 'Sowjetunion',
      school: school1,
    });
    const vocabulary2 = store.createRecord('vocabulary', {
      title: 'DDR',
      school: school1,
    });
    const vocabulary3 = store.createRecord('vocabulary', {
      title: 'Walter Ulbricht',
      school: school2,
    });
    const vocabulary4 = store.createRecord('vocabulary', {
      title: 'Antifaschistischer Schutzwall',
      school: school2,
    });
    const program = store.createRecord('program', { school: school1 });
    const programYear = store.createRecord('programYear', { program });
    const cohort = store.createRecord('cohort', { programYear });
    course.get('cohorts').pushObject(cohort);
    course.set('school', school2);

    const vocabularies = await course.get('assignableVocabularies');
    assert.equal(vocabularies.length, 4);
    assert.equal(vocabularies[0], vocabulary4);
    assert.equal(vocabularies[1], vocabulary3);
    assert.equal(vocabularies[2], vocabulary2);
    assert.equal(vocabularies[3], vocabulary1);
  });

  test('assignableVocabularies', async function (assert) {
    assert.expect(5);
    const course = this.owner.lookup('service:store').createRecord('course');
    const store = this.owner.lookup('service:store');
    const school1 = store.createRecord('school', { title: 'Zeppelin' });
    const school2 = store.createRecord('school', { title: 'Anton' });
    const vocabulary1 = store.createRecord('vocabulary', {
      title: 'Sowjetunion',
      school: school1,
    });
    const vocabulary2 = store.createRecord('vocabulary', {
      title: 'DDR',
      school: school1,
    });
    const vocabulary3 = store.createRecord('vocabulary', {
      title: 'Walter Ulbricht',
      school: school2,
    });
    const vocabulary4 = store.createRecord('vocabulary', {
      title: 'Antifaschistischer Schutzwall',
      school: school2,
    });
    const program = store.createRecord('program', { school: school1 });
    const programYear = store.createRecord('programYear', { program });
    const cohort = store.createRecord('cohort', { programYear });
    course.get('cohorts').pushObject(cohort);
    course.set('school', school2);

    const vocabularies = await course.get('assignableVocabularies');
    assert.equal(vocabularies.length, 4);
    assert.equal(vocabularies[0], vocabulary4);
    assert.equal(vocabularies[1], vocabulary3);
    assert.equal(vocabularies[2], vocabulary2);
    assert.equal(vocabularies[3], vocabulary1);
  });

  test('sortedCourseObjectives', async function (assert) {
    assert.expect(4);
    const store = this.owner.lookup('service:store');
    const course = store.createRecord('course');
    const sessionObjective1 = store.createRecord('course-objective', {
      id: 1,
      course,
      title: 'Aardvark',
      position: 3,
    });
    const sessionObjective2 = store.createRecord('course-objective', {
      id: 2,
      course,
      title: 'Bar',
      position: 2,
    });
    const sessionObjective3 = store.createRecord('course-objective', {
      id: 3,
      course,
      title: 'Foo',
      position: 2,
    });
    const objectives = await course.get('sortedCourseObjectives');
    assert.equal(objectives.length, 3);
    assert.equal(objectives[0], sessionObjective3);
    assert.equal(objectives[1], sessionObjective2);
    assert.equal(objectives[2], sessionObjective1);
  });
});
