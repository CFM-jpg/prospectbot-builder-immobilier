const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const IGNORE = ['node_modules', '.next', '.git', 'public', '.env', '.env.local']
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx']

let files = []
let errors = []
let warnings = []
let allImports = {}

// =============================================
// 1. RÉCUPÉRER TOUS LES FICHIERS
// =============================================
function getFiles(dir) {
  const items = fs.readdirSync(dir)
  for (const item of items) {
    if (IGNORE.includes(item)) continue
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      getFiles(fullPath)
    } else if (EXTENSIONS.includes(path.extname(item))) {
      files.push(fullPath)
    }
  }
}

// =============================================
// 2. ANALYSER LES IMPORTS DE CHAQUE FICHIER
// =============================================
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const relPath = path.relative(ROOT, filePath)
  const imports = []

  // Trouver tous les imports
  const importRegex = /(?:import|require)\s*(?:\(?\s*['"]([^'"]+)['"]\s*\)?|.*?from\s*['"]([^'"]+)['"])/g
  let match
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1] || match[2]
    if (importPath) imports.push(importPath)
  }

  allImports[relPath] = imports

  // Vérifier les imports locaux
  for (const imp of imports) {
    if (imp.startsWith('.') || imp.startsWith('@/')) {
      let resolvedPath = imp

      // Résoudre @/ vers src/
      if (imp.startsWith('@/')) {
        resolvedPath = imp.replace('@/', 'src/')
      } else {
        resolvedPath = path.resolve(path.dirname(filePath), imp)
        resolvedPath = path.relative(ROOT, resolvedPath)
      }

      // Vérifier si le fichier existe
      const exists = EXTENSIONS.some(ext => {
        const p1 = path.join(ROOT, resolvedPath + ext)
        const p2 = path.join(ROOT, resolvedPath, 'index' + ext)
        return fs.existsSync(p1) || fs.existsSync(p2)
      }) || fs.existsSync(path.join(ROOT, resolvedPath))

      if (!exists) {
        errors.push({
          file: relPath,
          type: 'Import manquant',
          detail: `"${imp}" introuvable`
        })
      }
    }
  }

  // Vérifier les use client / use server
  if (content.includes("'use client'") && content.includes("'use server'")) {
    errors.push({ file: relPath, type: 'Conflit directive', detail: "'use client' et 'use server' dans le même fichier" })
  }

  // Vérifier les exports
  const hasDefault = content.includes('export default')
  const hasNamed = content.includes('export {') || content.includes('export const') || content.includes('export function')
  if (!hasDefault && !hasNamed && !filePath.includes('middleware')) {
    warnings.push({ file: relPath, type: 'Pas d\'export', detail: 'Aucun export détecté' })
  }

  // Détecter les console.log oubliés
  const consoleLogs = (content.match(/console\.log/g) || []).length
  if (consoleLogs > 3) {
    warnings.push({ file: relPath, type: 'Debug', detail: `${consoleLogs} console.log détectés` })
  }

  // Détecter les TODO / FIXME
  const todos = (content.match(/TODO|FIXME|HACK|XXX/g) || []).length
  if (todos > 0) {
    warnings.push({ file: relPath, type: 'TODO/FIXME', detail: `${todos} commentaire(s) à traiter` })
  }

  return { path: relPath, imports: imports.length, lines: content.split('\n').length }
}

// =============================================
// 3. VÉRIFIER PACKAGE.JSON
// =============================================
function checkPackageJson() {
  const pkgPath = path.join(ROOT, 'package.json')
  if (!fs.existsSync(pkgPath)) {
    errors.push({ file: 'package.json', type: 'Fichier manquant', detail: 'package.json introuvable' })
    return
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }

  // Vérifier les packages utilisés mais non déclarés
  const usedPackages = new Set()
  for (const [, imports] of Object.entries(allImports)) {
    for (const imp of imports) {
      if (!imp.startsWith('.') && !imp.startsWith('@/')) {
        const pkg = imp.startsWith('@') ? imp.split('/').slice(0, 2).join('/') : imp.split('/')[0]
        usedPackages.add(pkg)
      }
    }
  }

  const nodeBuiltins = ['fs', 'path', 'os', 'http', 'https', 'crypto', 'stream', 'util', 'events', 'url', 'querystring', 'buffer', 'child_process']

  for (const pkg of usedPackages) {
    if (!deps[pkg] && !nodeBuiltins.includes(pkg)) {
      warnings.push({ file: 'package.json', type: 'Dépendance manquante', detail: `"${pkg}" utilisé mais absent de package.json` })
    }
  }
}

// =============================================
// 4. VÉRIFIER .ENV.LOCAL
// =============================================
function checkEnv() {
  const envPath = path.join(ROOT, '.env.local')
  const envExPath = path.join(ROOT, '.env.example')

  if (!fs.existsSync(envPath)) {
    warnings.push({ file: '.env.local', type: 'Fichier manquant', detail: '.env.local introuvable — variables d\'environnement non configurées' })
    return
  }

  const envContent = fs.readFileSync(envPath, 'utf8')
  const envVars = envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')[0].trim())

  // Vérifier les variables vides
  for (const line of envContent.split('\n')) {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, val] = line.split('=')
      if (!val || val.trim() === '' || val.includes('VOTRE_') || val.includes('YOUR_')) {
        warnings.push({ file: '.env.local', type: 'Variable vide', detail: `${key.trim()} n'est pas configurée` })
      }
    }
  }
}

// =============================================
// 5. VÉRIFIER LA STRUCTURE NEXT.JS
// =============================================
function checkNextStructure() {
  const requiredFiles = ['next.config.js', 'package.json']
  const appOrPages = fs.existsSync(path.join(ROOT, 'src/app')) || fs.existsSync(path.join(ROOT, 'app')) ||
                     fs.existsSync(path.join(ROOT, 'src/pages')) || fs.existsSync(path.join(ROOT, 'pages'))

  for (const f of requiredFiles) {
    if (!fs.existsSync(path.join(ROOT, f))) {
      errors.push({ file: f, type: 'Structure Next.js', detail: `${f} manquant` })
    }
  }

  if (!appOrPages) {
    errors.push({ file: 'structure', type: 'Structure Next.js', detail: 'Aucun dossier app/ ou pages/ trouvé' })
  }
}

// =============================================
// RAPPORT FINAL
// =============================================
function printReport(analyzed) {
  console.log('\n' + '='.repeat(60))
  console.log('  RAPPORT D\'ANALYSE — PROSPECTBOT')
  console.log('='.repeat(60))

  console.log(`\n📁 ${files.length} fichiers analysés\n`)

  // Erreurs
  if (errors.length === 0) {
    console.log('✅ ERREURS : Aucune erreur détectée !')
  } else {
    console.log(`❌ ERREURS (${errors.length}) :`)
    for (const e of errors) {
      console.log(`   [${e.type}] ${e.file}`)
      console.log(`   → ${e.detail}`)
    }
  }

  // Warnings
  console.log('')
  if (warnings.length === 0) {
    console.log('✅ AVERTISSEMENTS : Aucun avertissement !')
  } else {
    console.log(`⚠️  AVERTISSEMENTS (${warnings.length}) :`)
    for (const w of warnings) {
      console.log(`   [${w.type}] ${w.file}`)
      console.log(`   → ${w.detail}`)
    }
  }

  // Stats
  console.log('\n📊 STATISTIQUES :')
  const totalLines = analyzed.reduce((acc, f) => acc + f.lines, 0)
  const totalImports = analyzed.reduce((acc, f) => acc + f.imports, 0)
  console.log(`   Lignes de code total : ${totalLines}`)
  console.log(`   Imports total : ${totalImports}`)
  console.log(`   Fichiers les plus gros :`)
  analyzed.sort((a, b) => b.lines - a.lines).slice(0, 5).forEach(f => {
    console.log(`   → ${f.path} (${f.lines} lignes)`)
  })

  console.log('\n' + '='.repeat(60))

  if (errors.length === 0 && warnings.length === 0) {
    console.log('🎉 Projet propre — aucun problème détecté !')
  } else {
    console.log(`Résumé : ${errors.length} erreur(s) · ${warnings.length} avertissement(s)`)
  }
  console.log('='.repeat(60) + '\n')
}

// =============================================
// LANCEMENT
// =============================================
console.log('Analyse en cours...')
getFiles(ROOT)
const analyzed = files.map(analyzeFile)
checkPackageJson()
checkEnv()
checkNextStructure()
printReport(analyzed)
