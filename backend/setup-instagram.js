const { spawnSync } = require('child_process');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
    ...options,
  });

  return typeof result.status === 'number' ? result.status : 1;
}

function commandExists(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'ignore',
    shell: true,
  });

  return result.status === 0;
}

function detectPython() {
  const candidates = [
    ['python3', ['--version']],
    ['python', ['--version']],
    ['py', ['-3', '--version']],
    ['py', ['--version']],
  ];

  for (const [command, args] of candidates) {
    if (commandExists(command, args)) {
      return { command, args: command === 'py' && args[0] === '-3' ? ['-3'] : [] };
    }
  }

  return null;
}

console.log('');
console.log('⚡ CreatoKite — Instagram Scraper Setup');
console.log('═══════════════════════════════════════');

console.log('');
console.log('📥 Step 1: Installing Playwright Chromium browser...');
const chromiumStatus = run('npx', ['playwright', 'install', 'chromium']);
if (chromiumStatus === 0) {
  console.log('   ✅ Chromium installed');
} else {
  console.log('   ⚠ Chromium install failed — Playwright method will be skipped');
}

console.log('');
console.log('🐍 Step 2: Checking Python...');
const python = detectPython();
if (python) {
  const versionArgs = [...python.args, '--version'];
  run(python.command, versionArgs);
  console.log('   ✅ Python found');
} else {
  console.log('   ⚠ Python not found — instaloader method will be skipped');
}

if (python) {
  console.log('');
  console.log('📦 Step 3: Installing instaloader...');
  const pipInstallStatus = run(python.command, [...python.args, '-m', 'pip', 'install', 'instaloader', '--quiet']);

  if (pipInstallStatus === 0) {
    console.log('   ✅ instaloader installed');
    run(python.command, [...python.args, '-c', "import instaloader; print('   ✅ instaloader import OK')"]);
  } else if (process.platform !== 'win32') {
    const breakSystemPackagesStatus = run(python.command, [...python.args, '-m', 'pip', 'install', 'instaloader', '--break-system-packages', '--quiet']);
    if (breakSystemPackagesStatus === 0) {
      console.log('   ✅ instaloader installed (with --break-system-packages)');
    } else {
      console.log('   ⚠ instaloader install failed — this method will be skipped');
    }
  } else {
    console.log('   ⚠ instaloader install failed — this method will be skipped');
  }
}

console.log('');
console.log('═══════════════════════════════════════');
console.log('✅ Setup complete!');
console.log('');
console.log('Instagram scraper method priority:');
console.log('  1. Direct Instagram API (axios)     — fastest');
console.log('  2. Playwright stealth browser       — most reliable');
console.log('  3. Python instaloader               — reliable backup');
console.log('  4. Smart estimation                 — always works');
console.log('');
console.log('Now run:  npm run dev');
console.log('═══════════════════════════════════════');
