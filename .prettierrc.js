// See http://json.schemastore.org/prettierrc

module.exports = {
  // Include parentheses around a sole arrow function parameter.
  //  - avoid: (default) Omit parens when possible. Example: `x => x`
  //  - always: Always include parens. Example: `(x) => x`
  arrowParens: 'always',

  // Print spaces between brackets. (default: true)
  bracketSpacing: true,

  // Which end of line characters to apply.
  //  - auto: (default) Maintain existing (mixed values within one file are normalized by looking at what's used after the first line)
  //  - lf: Line Feed only (\\n), common on Linux and macOS as well as inside a git repo
  //  - crlf: Carriage Return + Line Feed characters (\\r\\n), common on Windows
  //  - cr: Carriage Return character only (\\r), used very rarely
  endOfLine: 'lf',

  // How to handle whitespace in HTML.
  //  - css: (default) Respect the default value of CSS display property.
  //  - strict: Whitespace is considered sensitive.
  //  - ignore: Whitespace is considered insensitive.
  htmlWhitespaceSensitivity: 'css',

  // Insert @format pragma into file's first docblock comment. (default: false)
  insertPragma: false,

  // Put > on the last line instead of at a new line. (default: false)
  jsxBracketSameLine: false,

  // Use single quotes in JSX. (default: false)
  jsxSingleQuote: true,

  // The line length where Prettier will try wrap. (default: 80)
  printWidth: 90,

  // How to wrap prose.
  //  - always: Wrap prose if it exceeds the print width.
  //  - never: Do not wrap prose.
  //  - preserve: (default) Wrap prose as-is.
  proseWrap: 'preserve',

  // Change when properties in objects are quoted.
  //  - as-needed: (default) Only add quotes around object properties where required.
  //  - consistent: If at least one property in an object requires quotes, quote all properties.
  //  - preserve: Respect the input use of quotes in object properties.
  quoteProps: 'consistent',

  // Require either '@prettier' or '@format' to be present in the file's first docblock comment
  //  in order for it to be formatted. (default: false)
  requirePragma: false,

  // Print semicolons. (default: true)
  semi: true,

  // Use single quotes instead of double quotes. (default: false)
  singleQuote: true,

  // Number of spaces per indentation level. (default: 2)
  tabWidth: 2,

  // Print trailing commas wherever possible when multi-line.
  //  - none: (default) No trailing commas.
  //  - es5: Trailing commas where valid in ES5 (objects, arrays, etc.)
  //  - all: Trailing commas wherever possible (including function arguments).
  trailingComma: 'none',

  // Indent with tabs instead of spaces. (default: false)
  useTabs: false
};
