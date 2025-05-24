const expose = (fn) => {
  const getStdin = () =>
    new Promise((resolve) => {
      let data = '';
      process.stdin.setEncoding('utf8');
      process.stdin.on('readable', () => {
        let chunk;
        while ((chunk = process.stdin.read()) !== null) {
          data += chunk;
        }
      });
      process.stdin.on('end', () => {
        resolve(data);
      });
    });

  (async () => {
    try {
      const input = await getStdin();
      if (!input.trim()) {
        throw new Error('No input provided');
      }
      let parsed;
      try {
        parsed = JSON.parse(input);
      } catch (err) {
        throw new Error(`Invalid JSON input: ${err.message}`);
      }
      if (!parsed.payload || typeof parsed.payload !== 'object') {
        throw new Error('Input must include a valid "payload" object');
      }
      const result = await fn(parsed);
      process.stdout.write(JSON.stringify(result));
    } catch (err) {
      process.stderr.write(`Error: ${err.message}\nStack: ${err.stack}\n`);
      process.exit(1);
    }
  })();
};

module.exports = { expose };
