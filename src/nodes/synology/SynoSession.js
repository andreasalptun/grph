const Logger = require('../../Logger');

if (typeof(process.env.SYNOLOGY_URL) !== 'string' ||
  typeof(process.env.SYNOLOGY_USER) !== 'string' ||
  typeof(process.env.SYNOLOGY_PASSWORD) !== 'string') {
    console.log(process.env);
  throw new Error('Missing SYNOLOGY_URL, SYNOLOGY_USER or SYNOLOGY_PASSWORD in .env');
}

const waitFor = require('p-wait-for');
const gotx = require('got').extend({
  prefixUrl: process.env.SYNOLOGY_URL,
  responseType: 'json',
});

const session = {
  name: 'SynoSession'
};

async function waitLogout() {
  await waitFor(() => Date.now() > session.logoutTime, {
    interval: 250,
  });

  Logger.debug(session, 'Logging out');
  session.id = null;
  await gotx(`/auth.cgi?api=SYNO.API.Auth&method=Logout&version=2&session=SurveillanceStation&_sid=${session.id}`);
  Logger.debug(session, 'Logged out');
}

async function request(path, stream) {
  if (!session.id)
    throw new Error(`Error, not logged in when requesting ${path}`);

  Logger.info(session, 'Requesting ' + path)
  session.logoutTime = Date.now() + 3000; // Logout delay

  const res = await gotx(`${path}&_sid=${session.id}`, {
    isStream: stream // TODO not working
  });

  if (!res.body.success)
    throw new Error('Synology request unsuccessful');

  return res.body;
}

module.exports = {
  async request(path, stream = false) {
    try {
      if (session.id) {
        Logger.debug(session, 'Already logged in');
        // process.nextTick(() => {
        if (session.id)
          return await this.request(path, stream);
        // })
      } else if (session.loggingIn) {
        Logger.debug(session, 'Waiting for login...')
        await waitFor(() => !session.loggingIn, {
          interval: 100,
          timeout: 5000,
        });
        return await request(path, stream);
      } else {
        Logger.debug(session, 'Trying to login...');
        session.loggingIn = true;
        const login = (await gotx(`/auth.cgi?api=SYNO.API.Auth&method=Login&version=2&account=${process.env.SYNOLOGY_USER}&passwd=${process.env.SYNOLOGY_PASSWORD}&session=SurveillanceStation&format=sid`)).body;

        if (!login.success)
          throw new Error('Invalid login credentials for synology');

        Logger.debug(session, 'Login successful')
        session.id = login.data.sid;

        const body = await request(path, stream);
        waitLogout();

        session.loggingIn = false;
        return body;
      }
    } catch (e) {
      console.error(e);
    }
  }
}
