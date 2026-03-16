function parseArgs(argv) {
  const args = { _: [] };

  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];

    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }

    const key = token.slice(2);
    const next = argv[i + 1];

    if (next && !next.startsWith('--')) {
      args[key] = next;
      i++;
    } else {
      args[key] = true;
    }
  }

  return args;
}

module.exports = { parseArgs };
