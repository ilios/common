import { module, test } from 'qunit';
import { setupRenderingTest } from 'dummy/tests/helpers';
import { setupIntl } from 'ember-intl/test-support';
import { render, waitFor } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { component } from 'ilios-common/page-objects/components/visualizer-course-session-type';

module('Integration | Component | visualizer-course-session-type', function (hooks) {
  setupRenderingTest(hooks);
  setupIntl(hooks, 'en-us');
  setupMirage(hooks);

  test('it renders', async function (assert) {
    const vocabulary1 = this.server.create('vocabulary');
    const vocabulary2 = this.server.create('vocabulary');
    const term1 = this.server.create('term', {
      vocabulary: vocabulary1,
      title: 'Standalone',
    });
    const term2 = this.server.create('term', {
      vocabulary: vocabulary2,
      title: 'Campaign',
    });
    const sessionType = this.server.create('session-type');
    const course = this.server.create('course');
    const session1 = this.server.create('session', {
      title: 'Berkeley Investigations',
      course,
      terms: [term1],
      sessionType: sessionType,
    });
    const session2 = this.server.create('session', {
      title: 'The San Leandro Horror',
      course,
      terms: [term2],
      sessionType: sessionType,
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

    const courseModel = await this.owner.lookup('service:store').findRecord('course', course.id);
    const sessionTypeModel = await this.owner
      .lookup('service:store')
      .findRecord('session-type', sessionType.id);

    this.set('course', courseModel);
    this.set('type', sessionTypeModel);

    await render(
      hbs`<VisualizerCourseSessionType @course={{this.course}} @sessionType={{this.type}} @isIcon={{false}} />
`,
    );
    //let the chart animations finish
    await waitFor('.loaded');
    await waitFor('svg .bars');

    assert.strictEqual(component.chart.bars.length, 2);
    assert.strictEqual(component.chart.labels.length, 2);
    assert.strictEqual(component.chart.labels[0].text, 'Vocabulary 1 - Standalone: 630 Minutes');
    assert.strictEqual(component.chart.labels[1].text, 'Vocabulary 2 - Campaign: 180 Minutes');
  });
});
