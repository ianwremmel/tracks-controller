/** Converts a route string to a controller name */
export function controllerize(filename: string): string {
  return `${filename
    .split('.')[0]
    .split('/')
    .map(ucFirst)
    .join('')}Controller`;
}

/** Converts a contorller name to a route string */
export function routify(controllerName: string): string {
  return controllerName
    .replace(/Controller$/, '')
    .split(/(?=[A-Z])/)
    .join('/')
    .toLowerCase();
}

/** Capitalizes the first letter of a string */
export function ucFirst(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
