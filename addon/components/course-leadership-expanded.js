import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { dropTask, timeout } from 'ember-concurrency';
import { hash } from 'rsvp';

export default class CourseLeadershipExpandedComponent extends Component {
  @tracked directors = [];
  @tracked administrators = [];
  @tracked studentAdvisors = [];

  @action
  addDirector(user) {
    this.directors = [...this.directors, user];
  }
  @action
  removeDirector(user) {
    this.directors = this.directors.filter((obj) => obj !== user);
  }
  @action
  addAdministrator(user) {
    this.administrators = [...this.administrators, user];
  }
  @action
  removeAdministrator(user) {
    this.administrators = this.administrators.filter((obj) => obj !== user);
  }
  @action
  addStudentAdvisor(user) {
    this.studentAdvisors = [...this.studentAdvisors, user];
  }
  @action
  removeStudentAdvisor(user) {
    this.studentAdvisors = this.studentAdvisors.filter((obj) => obj !== user);
  }
  @dropTask
  *manage() {
    const obj = yield hash({
      administrators: this.args.course.administrators,
      directors: this.args.course.directors,
      studentAdvisors: this.args.course.studentAdvisors,
    });
    this.administrators = obj.administrators.toArray();
    this.directors = obj.directors.toArray();
    this.studentAdvisors = obj.studentAdvisors.toArray();
    this.args.setIsManaging(true);
  }
  @dropTask
  *save() {
    yield timeout(10);
    this.args.course.setProperties({
      directors: this.directors,
      administrators: this.administrators,
      studentAdvisors: this.studentAdvisors,
    });
    this.args.expand();
    yield this.args.course.save();
    this.args.setIsManaging(false);
  }
}
