import { spawn } from 'node:child_process';

const children = [
  spawn(process.execPath, ['--env-file-if-exists=.env', 'server/index.js'], { stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--strictPort'], { stdio: 'inherit' }),
];
function stop(code) {
  children.forEach(child => child.kill());
  process.exitCode = code;
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop(0));
children.forEach(child => child.on('exit', code => stop(code ?? 0)));
