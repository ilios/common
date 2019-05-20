import Controller from '@ember/controller';

export default Controller.extend({
  actions: {
    returnToList(){
      this.transitionToRoute('course.index', this.model);
    }
  }
});
