export const setNotificationHandler = jest.fn();
export const getPermissionsAsync = jest.fn(() => Promise.resolve({ status: 'denied' }));
export const requestPermissionsAsync = jest.fn(() => Promise.resolve({ status: 'denied' }));
export const scheduleNotificationAsync = jest.fn(() => Promise.resolve('mock-notif-id'));
export const cancelScheduledNotificationAsync = jest.fn(() => Promise.resolve());
export const cancelAllScheduledNotificationsAsync = jest.fn(() => Promise.resolve());
export const setNotificationChannelAsync = jest.fn(() => Promise.resolve());
export const AndroidImportance = { HIGH: 4 };
