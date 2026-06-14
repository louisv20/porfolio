const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const quizApp = path.join(root, 'quiz-app');

function copyIfExists(source, target) {
  if (!fs.existsSync(source)) return;
  fs.cpSync(source, target, { recursive: true });
}

function run(command, args, cwd) {
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (!entry.isFile()) continue;

  const ext = path.extname(entry.name).toLowerCase();
  if (['.html', '.css', '.js', '.xml', '.txt', '.ico'].includes(ext)) {
    copyIfExists(path.join(root, entry.name), path.join(dist, entry.name));
  }
}

copyIfExists(path.join(root, 'assets'), path.join(dist, 'assets'));
copyIfExists(path.join(root, 'images'), path.join(dist, 'images'));

const quizInstall = fs.existsSync(path.join(quizApp, 'package-lock.json'))
  ? ['ci', '--include=dev']
  : ['install', '--include=dev'];

run('npm', quizInstall, quizApp);
run('npm', ['run', 'build', '--', '--outDir', '../dist/quiz-app', '--emptyOutDir'], quizApp);
