export function getUserTinygrailPageStoreKey(username) {
  return `user-tinygrail:page:${username}`;
}

export function getUserTinygrailModalStoreKey(username) {
  return `user-tinygrail:modal:${username}`;
}

export function getUserTinygrailStoreKey(username, modalId = null) {
  return modalId ? getUserTinygrailModalStoreKey(username) : getUserTinygrailPageStoreKey(username);
}

export function getUserTinygrailStoreKeys(username) {
  return [getUserTinygrailPageStoreKey(username), getUserTinygrailModalStoreKey(username)];
}
