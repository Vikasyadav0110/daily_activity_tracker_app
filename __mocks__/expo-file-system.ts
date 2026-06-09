const files: Record<string, string> = {};
export const documentDirectory = '/mock/docs/';
export const EncodingType = { UTF8: 'utf8', Base64: 'base64' };
export const writeAsStringAsync = jest.fn((path: string, content: string) => { files[path] = content; return Promise.resolve(); });
export const readAsStringAsync = jest.fn((path: string) => Promise.resolve(files[path] ?? ''));
export const getInfoAsync = jest.fn((path: string) => Promise.resolve({ exists: path in files, size: (files[path] ?? '').length }));
export const deleteAsync = jest.fn((path: string) => { delete files[path]; return Promise.resolve(); });
