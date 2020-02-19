import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export function validatableComponent(component) {
  return class extends component {
    @tracked _registry = [];
    @tracked _showAllErrors = false;

    @action
    clearErrorDisplay() {
      this._registry = [];
      this._showAllErrors = false;
    }

    @action
    removeErrorDisplayFor(field) {
      if (this.hasErrorDisplayFor(field)) {
        this._showAllErrors = false;
        this._registry = this._registry.filter(f => f !== field);
      }
    }

    @action
    addErrorDisplayForAllFields() {
      this._showAllErrors = true;
    }

    @action
    addErrorDisplayFor(field) {
      if (this.hasErrorDisplayFor(field)) {
        return;
      }
      this._registry.push(field);
    }

    @action
    validate() {
      const errorsByField = {};
      let hasErrors = false;
      this._registry.forEach(field => {
        const errors = this[this._getFieldValidationGetterName(field)]; // invoke validation getter for the given field.
        if (!errors.length) {
          return;
        }
        errorsByField[field] = errors;
        if (errors.length) {
          hasErrors = true;
        }
      });
      errorsByField._hasErrors = hasErrors;
      return errorsByField;
    }

    @action
    isValid(field = null) {
      const errors = this.validate();
      if (field === null) {
        return !errors._hasErrors;
      }
      return !(field in errors);
    }

    @action
    getErrorsFor(field) {
      if (this._showAllErrors || this.hasErrorDisplayFor(field)) {
        const errors = this.validate();
        if (field in errors) {
          return errors[field];
        }
      }
      return [];
    }

    hasErrorDisplayFor(field) {
      return this._registry.includes(field);
    }

    _getFieldValidationGetterName(field) {
      return `${field}ValidationErrors`;
    }
  };
}
