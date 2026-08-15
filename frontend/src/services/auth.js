import config from '../config';

let userPool = null;

async function getUserPool() {
  if (!userPool && config.COGNITO_USER_POOL_ID && config.COGNITO_CLIENT_ID) {
    const { CognitoUserPool } = await import('amazon-cognito-identity-js');
    userPool = new CognitoUserPool({
      UserPoolId: config.COGNITO_USER_POOL_ID,
      ClientId: config.COGNITO_CLIENT_ID,
    });
  }
  return userPool;
}

const MOCK_TEACHER = {
  email: 'teacher@demo.com',
  name: 'Dr. Nishchal',
  sub: 'mock-teacher-001',
  role: 'teacher',
};

function isMockMode() {
  return config.USE_MOCK_DATA || !config.COGNITO_USER_POOL_ID;
}

export const authService = {
  async signUp(email, password, name, role = 'teacher') {
    if (isMockMode()) return { user: { username: email } };
    const pool = await getUserPool();
    if (!pool) throw new Error('Cognito not configured');
    const { CognitoUserAttribute } = await import('amazon-cognito-identity-js');
    return new Promise((resolve, reject) => {
      const attrs = [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
        new CognitoUserAttribute({ Name: 'name', Value: name }),
        new CognitoUserAttribute({ Name: 'custom:role', Value: role }),
      ];
      pool.signUp(email, password, attrs, null, (err, res) => (err ? reject(err) : resolve(res)));
    });
  },

  async confirmSignUp(email, code) {
    if (isMockMode()) return 'SUCCESS';
    const pool = await getUserPool();
    if (!pool) throw new Error('Cognito not configured');
    const { CognitoUser } = await import('amazon-cognito-identity-js');
    return new Promise((resolve, reject) => {
      new CognitoUser({ Username: email, Pool: pool }).confirmRegistration(
        code,
        true,
        (err, res) => (err ? reject(err) : resolve(res))
      );
    });
  },

  async signIn(email, password, role = 'teacher') {
    if (isMockMode()) {
      const u = { ...MOCK_TEACHER, email, role };
      if (role === 'student') {
        u.name = 'Student User';
        u.sub = 'mock-student-001';
      }
      localStorage.setItem('mock_user', JSON.stringify(u));
      localStorage.setItem('mock_token', 'mock-jwt-token');
      return u;
    }
    const pool = await getUserPool();
    if (!pool) throw new Error('Cognito not configured');
    const { CognitoUser, AuthenticationDetails } = await import('amazon-cognito-identity-js');
    return new Promise((resolve, reject) => {
      const cu = new CognitoUser({ Username: email, Pool: pool });
      cu.authenticateUser(
        new AuthenticationDetails({ Username: email, Password: password }),
        {
          onSuccess: (res) => {
            const p = res.getIdToken().decodePayload();
            resolve({
              email: p.email,
              name: p.name,
              sub: p.sub,
              role: p['custom:role'] || role,
              token: res.getIdToken().getJwtToken(),
            });
          },
          onFailure: reject,
        }
      );
    });
  },

  async signOut() {
    if (isMockMode()) {
      localStorage.setItem('mock_user', 'none');
      localStorage.removeItem('mock_token');
      return;
    }
    const pool = await getUserPool();
    if (pool) {
      const cu = pool.getCurrentUser();
      if (cu) cu.signOut();
    }
  },

  async getCurrentUser() {
    if (isMockMode()) {
      const s = localStorage.getItem('mock_user');
      if (s === 'none') {
        return null;
      } else if (!s) {
        localStorage.setItem('mock_user', JSON.stringify(MOCK_TEACHER));
        localStorage.setItem('mock_token', 'mock-jwt-token');
        return MOCK_TEACHER;
      } else {
        try {
          return JSON.parse(s);
        } catch {
          return null;
        }
      }
    }

    const pool = await getUserPool();
    if (!pool) return null;
    const cu = pool.getCurrentUser();
    if (!cu) return null;
    return new Promise((resolve, reject) => {
      cu.getSession((err, session) => {
        if (err || !session.isValid()) return resolve(null);
        cu.getUserAttributes((err2, attrs) => {
          if (err2) return reject(err2);
          const user = {};
          attrs.forEach((a) => {
            user[a.getName()] = a.getValue();
          });
          user.sub = cu.getUsername();
          user.role = user['custom:role'] || 'teacher';
          resolve(user);
        });
      });
    });
  },

  async getToken() {
    if (isMockMode()) return localStorage.getItem('mock_token') || '';
    const pool = await getUserPool();
    if (!pool) return '';
    const cu = pool.getCurrentUser();
    if (!cu) return '';
    return new Promise((resolve) => {
      cu.getSession((err, session) => {
        if (err || !session.isValid()) return resolve('');
        resolve(session.getIdToken().getJwtToken());
      });
    });
  },
};
