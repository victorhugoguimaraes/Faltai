const fs = require('fs');
const path = require('path');
const webPush = require('web-push');

const dataDir = path.join(__dirname, 'data');
const subscriptionsFile = path.join(dataDir, 'push-subscriptions.json');
const vapidKeysFile = path.join(dataDir, 'vapid-keys.json');

const ensureDataDir = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

const readJsonFile = (filePath, fallbackValue) => {
  try {
    if (!fs.existsSync(filePath)) {
      return fallbackValue;
    }

    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return fallbackValue;
  }
};

const writeJsonFile = (filePath, value) => {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
};

const subscriptionKey = (subscription) => {
  const endpoint = subscription?.endpoint || '';
  const auth = subscription?.keys?.auth || '';
  const p256dh = subscription?.keys?.p256dh || '';
  return `${endpoint}::${auth}::${p256dh}`;
};

const loadSubscriptions = () => readJsonFile(subscriptionsFile, []);

const saveSubscriptions = (subscriptions) => {
  writeJsonFile(subscriptionsFile, subscriptions);
  return subscriptions;
};

const upsertSubscription = ({ subscription, settings = {}, metadata = {}, lastWeeklyReminderAt = null }) => {
  const currentSubscriptions = loadSubscriptions();
  const key = subscriptionKey(subscription);
  const nextRecord = {
    id: key,
    subscription,
    settings,
    metadata,
    updatedAt: new Date().toISOString(),
    lastWeeklyReminderAt
  };

  const index = currentSubscriptions.findIndex((item) => item.id === key);

  if (index >= 0) {
    currentSubscriptions[index] = {
      ...currentSubscriptions[index],
      ...nextRecord,
      lastWeeklyReminderAt: lastWeeklyReminderAt ?? currentSubscriptions[index].lastWeeklyReminderAt ?? null
    };
  } else {
    currentSubscriptions.push(nextRecord);
  }

  saveSubscriptions(currentSubscriptions);
  return nextRecord;
};

const removeSubscription = (subscription) => {
  const key = subscriptionKey(subscription);
  const nextSubscriptions = loadSubscriptions().filter((item) => item.id !== key);
  saveSubscriptions(nextSubscriptions);
  return nextSubscriptions;
};

const updateSubscriptionSettings = ({ subscription, settings = {}, metadata = {} }) => {
  return upsertSubscription({ subscription, settings, metadata });
};

const resolveVapidKeys = () => {
  const envPublicKey = process.env.VAPID_PUBLIC_KEY;
  const envPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const envSubject = process.env.VAPID_SUBJECT || 'mailto:contato@faltai.app';

  if (envPublicKey && envPrivateKey) {
    return {
      publicKey: envPublicKey,
      privateKey: envPrivateKey,
      subject: envSubject
    };
  }

  const storedKeys = readJsonFile(vapidKeysFile, null);
  if (storedKeys?.publicKey && storedKeys?.privateKey) {
    return {
      ...storedKeys,
      subject: storedKeys.subject || envSubject
    };
  }

  const generatedKeys = webPush.generateVAPIDKeys();
  const nextKeys = {
    ...generatedKeys,
    subject: envSubject
  };

  writeJsonFile(vapidKeysFile, nextKeys);
  return nextKeys;
};

module.exports = {
  loadSubscriptions,
  saveSubscriptions,
  upsertSubscription,
  removeSubscription,
  updateSubscriptionSettings,
  resolveVapidKeys
};
