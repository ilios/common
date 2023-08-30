import { authenticateSession } from 'ember-simple-auth/test-support';
import { getContext } from '@ember/test-helpers';

const defaultUserId = 100;

export default async function (
  userObject = { id: defaultUserId },
  performsNonLearnerFunction = false,
) {
  const userId = userObject && 'id' in userObject ? userObject.id : defaultUserId;
  const jwtObject = {
    user_id: userId,
  };
  if (performsNonLearnerFunction) {
    jwtObject['performs_non_learner_function'] = true;
  }
  const encodedData = window.btoa('') + '.' + window.btoa(JSON.stringify(jwtObject)) + '.';
  const token = {
    jwt: encodedData,
  };
  const { server } = getContext();
  await authenticateSession(token);

  if (userObject) {
    const properties = Object.assign({ id: userId }, userObject);
    const user = server.create('user', properties);
    server.create('authentication', { id: user.id, user });
    return user;
  }

  return null;
}
