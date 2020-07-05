import readline from 'readline';

/** @internal */
export function question(text: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(text, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}
