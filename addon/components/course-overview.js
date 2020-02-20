import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import scrollTo from 'ilios-common/utils/scroll-to';
import { restartableTask } from 'ember-concurrency-decorators';
import moment from 'moment';
import { validatableComponent } from 'ilios-common/decorators/validation/validatable-component';

@validatableComponent
export default class CourseOverview extends Component {
  @service currentUser;
  @service intl;
  @service permissionChecker;
  @service router;
  @service store;

  universalLocator = 'ILIOS';

  @tracked externalId = null;
  @tracked startDate = null;
  @tracked endDate = null;
  @tracked level = null;
  @tracked levelOptions = null;
  @tracked clerkshipTypeId = null;
  @tracked manageDirectors = false;
  @tracked showDirectorManagerLoader = true;
  @tracked currentRoute = '';

  @tracked clerkshipTypeOptions;

  @tracked canCreateCourseInSchool = false;
  @tracked school = null;

  constructor() {
    super(...arguments);
    this.levelOptions = [1, 2, 3, 4, 5];
  }

  get externalIdValidationErrors() {
    const minLength = 2;
    const maxLength = 255;
    const errors = [];
    const value = this.externalId;

    if (! this.hasErrorDisplayFor("externalId")) {
      return errors;
    }

    const length = String(value).trim().length;
    if (! length) {
      return errors;
    }

    const description = this.intl.t('errors.description');
    if (length < minLength) {
      errors.push(this.intl.t('errors.tooShort', {
        description,
        min: minLength
      }));
    } else if (length > maxLength) {
      errors.push(this.intl.t('errors.tooLong', {
        description,
        max: maxLength
      }));
    }
    return errors;
  }

  get startDateValidationErrors() {
    const errors = [];
    const description = this.intl.t('errors.description');
    const value = this.startDate;
    const dependentValue = this.endDate;

    if (! this.hasErrorDisplayFor("startDate")) {
      return errors;
    }

    if (! (value instanceof Date)) {
      errors.push(this.intl.t('errors.date', { description }));
      return errors;
    }

    if (! (dependentValue instanceof Date)) {
      throw `${dependentValue} must be a Date.`;
    }

    if (value > dependentValue) {
      errors.push(this.intl.t('errors.before', {
        description,
        before: moment(dependentValue).format('LL')
      }));
    }

    return errors;
  }

  get endDateValidationErrors() {
    const errors = [];
    const description = this.intl.t('errors.description');
    const value = this.endDate;
    const dependentValue = this.startDate;

    if (! this.hasErrorDisplayFor("endDate")) {
      return errors;
    }

    if (! (value instanceof Date)) {
      errors.push(this.intl.t('errors.date', { description }));
      return errors;
    }

    if (! (dependentValue instanceof Date)) {
      throw `${this.startDate} must be a Date.`;
    }

    if (value < dependentValue) {
      errors.push(this.intl.t('errors.after', {
        description,
        after: moment(dependentValue).format('LL')
      }));
    }

    return errors;
  }

  @restartableTask
  *load() {
    this.clerkshipTypeOptions = yield this.store.findAll('course-clerkship-type');
    this.externalId = this.args.course.externalId;
    this.startDate = this.args.course.startDate;
    this.endDate = this.args.course.endDate;
    this.level = this.args.course.level;
    this.school = yield this.args.course.school;
    this.clerkshipTypeId = this.args.course.belongsTo('clerkshipType').id();
    this.canCreateCourseInSchool = yield this.permissionChecker.canCreateCourse(this.school);
    yield this.directorsToPassToManager.perform();
  }

  @restartableTask
  *directorsToPassToManager() {
    const users = yield this.args.course.directors;
    this.showDirectorManagerLoader = false;
    return users;
  }

  get selectedClerkshipType() {
    if (!this.clerkshipTypeId) {
      return null;
    }

    return this.clerkshipTypeOptions.findBy('id', this.clerkshipTypeId);
  }

  get showRollover() {
    if (this.router.currentRouteName === 'course.rollover') {
      return false;
    }

    return this.canCreateCourseInSchool;
  }

  get clerkshipTypeTitle() {
    if (!this.selectedClerkshipType) {
      return this.intl.t('general.notAClerkship');
    }

    return this.selectedClerkshipType.title;
  }

  @action
  async saveDirectors(newDirectors){
    this.args.course.set('directors', newDirectors.toArray());
    await this.args.course.save();
    this.directorsToPassToManager.perform();
    return this.manageDirectors = false;
  }
  @action
  async changeClerkshipType() {
    this.args.course.set('clerkshipType', this.selectedClerkshipType);
    return this.args.course.save();
  }

  @action
  setCourseClerkshipType(id){
    //convert the string 'null' to a real null
    if (id === 'null') {
      id = null;
    }
    this.clerkshipTypeId = id;
  }

  @restartableTask
  *revertClerkshipTypeChanges() {
    const clerkshipType = yield this.args.course.clerkshipType;
    if (clerkshipType) {
      this.clerkshipTypeId = clerkshipType.id;
    } else {
      this.clerkshipTypeId = null;
    }
  }

  @restartableTask
  *changeStartDate() {
    this.addErrorDisplayFor('startDate');
    if (! this.isValid()) {
      return false;
    }
    this.removeErrorDisplayFor('startDate');
    this.args.course.set('startDate', this.startDate);
    yield this.args.course.save();
    this.startDate = this.args.course.startDate;
  }

  @action
  revertStartDateChanges(){
    this.startDate = this.args.course.startDate;
  }

  @restartableTask
  *changeEndDate() {
    this.addErrorDisplayFor('endDate');
    if (! this.isValid()) {
      return false;
    }
    this.removeErrorDisplayFor('endDate');
    this.args.course.set('endDate', this.endDate);
    yield this.args.course.save();
    this.endDate = this.args.course.endDate;
  }

  @action
  revertEndDateChanges(){
    this.endDate = this.args.course.endDate;
  }

  @restartableTask
  *changeExternalId() {
    this.addErrorDisplayFor('externalId');
    if (! this.isValid()) {
      return false;
    }
    this.removeErrorDisplayFor('externalId');
    this.args.course.set('externalId', this.externalId);
    yield this.args.course.save();
    this.externalId = this.args.course.externalId;
  }

  @action
  revertExternalIdChanges() {
    this.externalId = this.args.course.externalId;
  }

  @action
  setLevel(level){
    this.level = parseInt(level, 10);
  }

  @action
  async changeLevel() {
    this.args.course.set('level', this.level);
    return this.args.course.save();
  }

  @action
  revertLevelChanges(){
    this.level = this.args.course.level;
  }

  @action
  transitionToRollover() {
    this.router.transitionTo('course.rollover', this.args.course);
    scrollTo('.rollover-form');
  }
}
