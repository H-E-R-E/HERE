  export function getFirstLetter(name: string) {
    const nameParts = name.trim().split('');
    const firstLetter = nameParts[0];
    return firstLetter;
  }