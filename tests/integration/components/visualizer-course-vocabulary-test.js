import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, findAll } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { setupMirage } from 'ember-cli-mirage/test-support';

module('Integration | Component | visualizer-course-vocabulary', function (hooks) {
  setupRenderingTest(hooks);
  setupMirage(hooks);

  test('it renders', async function (assert) {
    assert.expect(3);
    const vocabulary = this.server.create('vocabulary');
    const term1 = this.server.create('term', {
      vocabulary,
      title: 'Standalone',
    });
    const term2 = this.server.create('term', {
      vocabulary,
      title: 'Campaign',
    });
    const course = this.server.create('course');
    const session1 = this.server.create('session', {
      title: 'Berkeley Investigations',
      course,
      terms: [term1],
    });
    const session2 = this.server.create('session', {
      title: 'The San Leandro Horror',
      course,
      terms: [term2],
    });
    this.server.create('offering', {
      session: session1,
      startDate: new Date('2019-12-08T12:00:00'),
      endDate: new Date('2019-12-08T17:00:00'),
    });
    this.server.create('offering', {
      session: session1,
      startDate: new Date('2019-12-21T12:00:00'),
      endDate: new Date('2019-12-21T17:30:00'),
    });
    this.server.create('offering', {
      session: session2,
      startDate: new Date('2019-12-05T18:00:00'),
      endDate: new Date('2019-12-05T21:00:00'),
    });

    const courseModel = await this.owner.lookup('service:store').find('course', course.id);
    const vocabularyModel = await this.owner
      .lookup('service:store')
      .find('vocabulary', vocabulary.id);

    this.set('course', courseModel);
    this.set('vocabulary', vocabularyModel);

    await render(
      hbs`<VisualizerCourseVocabulary @course={{course}} @vocabulary={{vocabulary}} @isIcon={{false}} />`
    );
    const chartLabels = 'svg .bars text';
    assert.dom(chartLabels).exists({ count: 2 });
    assert.dom(findAll(chartLabels)[0]).hasText('Campaign 22.2%');
    assert.dom(findAll(chartLabels)[1]).hasText('Standalone 77.8%');
  });
});
