import fs from 'fs';

const reCRLF = /\r?\n/g;

/**
 * Load glob patterns from a text file
 *
 * Files should use [.gitignore syntax](https://git-scm.com/docs/gitignore)
 */
export function loadIgnorePatterns(ignoreFilePath?: string | false): string[] {
  if (
    ignoreFilePath &&
    fs.existsSync(ignoreFilePath) &&
    !fs.statSync(ignoreFilePath).isDirectory()
  ) {
    const fileContent = fs.readFileSync(ignoreFilePath).toString();
    return fileContent.split(reCRLF);
  }
  return [];
}
