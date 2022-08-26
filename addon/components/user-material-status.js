import Component from '@glimmer/component';
import { use } from 'ember-could-get-used-to-this';
import ResolveAsyncValue from 'ilios-common/classes/resolve-async-value';
import { inject as service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';

export default class UserMaterialStatusComponent extends Component {
  @service store;
  @service currentUser;
  @service iliosConfig;

  @tracked tmpStatus = null;

  @use user = new ResolveAsyncValue(() => [this.currentUser.getModel()]);
  @use sessionMaterialStatuses = new ResolveAsyncValue(() => [this.user?.sessionMaterialStatuses]);
  @use isEnabled = new ResolveAsyncValue(() => [
    this.iliosConfig.itemFromConfig('materialStatusEnabled'),
  ]);

  get isStatusLoaded() {
    return Boolean(this.sessionMaterialStatuses);
  }

  get isSessionLearningMaterial() {
    return Boolean(this.args.learningMaterial.sessionLearningMaterial);
  }

  get materialStatus() {
    return this.sessionMaterialStatuses?.find((status) => {
      const materialId = Number(status.belongsTo('material').id());
      const targetId = Number(this.args.learningMaterial.sessionLearningMaterial);
      return materialId === targetId;
    });
  }

  get status() {
    if (this.tmpStatus) {
      return this.tmpStatus;
    }

    return this.materialStatus?.status || 0;
  }

  setStatus = restartableTask(this, async (statusValue) => {
    this.tmpStatus = statusValue;
    let materialStatus = this.materialStatus;
    if (!materialStatus) {
      const user = await this.currentUser.getModel();
      const sessionLearningMaterial = await this.store.findRecord(
        'session-learning-material',
        this.args.learningMaterial.sessionLearningMaterial
      );
      materialStatus = this.store.createRecord('user-session-material-status', {
        user,
        material: sessionLearningMaterial,
        status: 0,
      });
    }

    materialStatus.set('status', statusValue);
    await timeout(500);
    await materialStatus.save();
    this.tmpStatus = null;
  });
}
