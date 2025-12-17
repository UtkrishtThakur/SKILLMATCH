const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIRS = ['app', 'components', 'lib', 'models', 'utils'];

async function getFiles(dir) {
    const subdirs = await readdir(dir);
    const files = await Promise.all(subdirs.map(async (subdir) => {
        const res = path.resolve(dir, subdir);
        return (await stat(res)).isDirectory() ? getFiles(res) : res;
    }));
    return files.reduce((a, f) => a.concat(f), []);
}

async function getActualFilename(dir, filename) {
    const files = await readdir(dir);
    return files.find(f => f.toLowerCase() === filename.toLowerCase());
}

async function checkFile(filePath) {
    const content = await readFile(filePath, 'utf8');
    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
        let importPath = match[1];

        // Handle alias @/
        if (importPath.startsWith('@/')) {
            importPath = importPath.replace('@/', '');
            importPath = path.join(ROOT_DIR, importPath);
        } else if (importPath.startsWith('.')) {
            importPath = path.resolve(path.dirname(filePath), importPath);
        } else {
            continue; // Skip node_modules
        }

        // Try extensions
        let resolvedPath = importPath;
        let extension = '';
        if (!fs.existsSync(resolvedPath)) {
            const exts = ['.js', '.jsx', '.ts', '.tsx', '.mjs'];
            for (const ext of exts) {
                if (fs.existsSync(importPath + ext)) {
                    resolvedPath = importPath + ext;
                    extension = ext;
                    break;
                }
            }
        }

        if (fs.existsSync(resolvedPath)) {
            const dir = path.dirname(resolvedPath);
            const basename = path.basename(resolvedPath);
            const actualBasename = await getActualFilename(dir, basename);

            if (actualBasename && actualBasename !== basename) {
                console.error(`[CASE_MISMATCH] In ${path.relative(ROOT_DIR, filePath)}:`);
                console.error(`   Imported: ...${path.basename(importPath)}${extension}`);
                console.error(`   Actual:   ${actualBasename}`);
            }
        }
    }
}

async function main() {
    for (const dir of SRC_DIRS) {
        const targetDir = path.join(ROOT_DIR, dir);
        if (fs.existsSync(targetDir)) {
            const files = await getFiles(targetDir);
            for (const file of files) {
                if (file.endsWith('.js') || file.endsWith('.jsx')) {
                    await checkFile(file);
                }
            }
        }
    }
}

main().catch(console.error);
