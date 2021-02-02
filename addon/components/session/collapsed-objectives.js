import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { restartableTask } from 'ember-concurrency-decorators';

export default class SessionCollapsedObjectivesComponent extends Component {
  @tracked objectivesRelationship;

  @restartableTask
  *load() {
    this.objectivesRelationship = yield this.args.session.sessionObjectives;
  }

  get objectives() {
    return this.objectivesRelationship ? this.objectivesRelationship.toArray() : [];
  }

  get objectivesWithParents() {
    return this.objectives.filter((objective) => {
      return objective.courseObjectives.length > 0;
    });
  }

  get objectivesWithMesh() {
    return this.objectives.filter((objective) => {
      return objective.meshDescriptors.length > 0;
    });
  }

  get objectivesWithTerms() {
    return this.objectives.filter((objective) => {
      return objective.terms.length > 0;
    });
  }
}
