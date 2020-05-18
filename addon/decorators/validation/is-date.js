import { registerDecorator } from "class-validator";
import { getOwner } from '@ember/application';

export function IsDate(validationOptions) {
  return function (object, propertyName) {
    registerDecorator({
      name: 'IsDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value) {
          return ! isNaN(Date.parse(value));
        },
        defaultMessage({ object: target }) {
          const owner = getOwner(target);
          const intl = owner.lookup('service:intl');
          const description = intl.t('errors.description');

          return intl.t('errors.date', { description });
        }
      },
    });
  };
}
