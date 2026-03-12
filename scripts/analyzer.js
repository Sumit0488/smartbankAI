import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

// Regular Expressions for Analysis
const SECRETS_REGEX = /(gsk_[a-zA-Z0-9]{30,}|sk-[a-zA-Z0-9]{30,}|password\s*=\s*['"][^'"]+['"])/ig;
const ROUTE_REGEX = /<Route\s+path=['"]([^'"]+)['"]/g;

// Metadata containers
const projectData = {
  components: [],
  pages: [],
  services: [],
  routes: [],
  hooks: [],
  utils: [],
  issues: [],
  securityAlerts: [],
  stats: {
    totalFiles: 0,
    totalLines: 0,
    jsFiles: 0,
    jsxFiles: 0,
    cssFiles: 0
  }
};

// Heuristics breakdown
const scores = {
  consistency: 10,
  readability: 10,
  scalability: 10,
  security: 10,
  maintainability: 10
};

// Recursive file scanner
const scanDirectory = (dir) => {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else {
      analyzeFile(fullPath);
    }
  }
};

const analyzeFile = (filePath) => {
  const ext = path.extname(filePath);
  const relativePath = path.relative(ROOT_DIR, filePath);
  
  if (!['.js', '.jsx', '.css'].includes(ext)) return;
  if (relativePath.includes('node_modules') || relativePath.includes('dist')) return;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lineCount = content.split('\n').length;

  projectData.stats.totalFiles++;
  projectData.stats.totalLines += lineCount;
  
  if (ext === '.js') projectData.stats.jsFiles++;
  if (ext === '.jsx') projectData.stats.jsxFiles++;
  if (ext === '.css') projectData.stats.cssFiles++;

  // Categorize files
  if (relativePath.includes('components')) projectData.components.push(relativePath);
  else if (relativePath.includes('pages')) projectData.pages.push(relativePath);
  else if (relativePath.includes('services')) projectData.services.push(relativePath);
  else if (relativePath.includes('hooks')) projectData.hooks.push(relativePath);
  else if (relativePath.includes('utils')) projectData.utils.push(relativePath);

  // Extract Routes (Typically in App.jsx or main.jsx)
  if (relativePath.includes('App.jsx') || relativePath.includes('main.jsx')) {
    let match;
    while ((match = ROUTE_REGEX.exec(content)) !== null) {
      if (!projectData.routes.includes(match[1])) {
        projectData.routes.push(match[1]);
      }
    }
  }

  // Security Check
  if (relativePath !== 'scripts\\analyzer.js' && relativePath !== 'scripts/analyzer.js') {
    let secMatch;
    while ((secMatch = SECRETS_REGEX.exec(content)) !== null) {
      projectData.securityAlerts.push(`Potential Secret exposed in ${relativePath}: ${secMatch[0].substring(0, 10)}...`);
      scores.security -= 2;
    }
  }

  // Maintainability / Readability Check
  if (lineCount > 500) {
    projectData.issues.push(`${relativePath} is too long (${lineCount} lines). Consider splitting it into smaller parts.`);
    scores.maintainability -= 0.5;
    scores.readability -= 0.5;
  }
  
  // Consistency Check (Checking for var usage)
  if (content.match(/\bvar \b/)) {
    projectData.issues.push(`${relativePath} uses 'var'. Use 'let' or 'const' for better consistency.`);
    scores.consistency -= 0.5;
  }
};

const bounds = (val) => Math.max(1, Math.min(10, Math.round(val * 10) / 10));

const generateReport = () => {
  const finalScores = {
    consistency: bounds(scores.consistency),
    readability: bounds(scores.readability),
    scalability: bounds(scores.scalability - (projectData.components.length === 0 ? 5 : 0)), // Ensure components exist
    security: bounds(scores.security),
    maintainability: bounds(scores.maintainability)
  };

  const reportContent = `# Code Quality Report
*Auto-generated on ${new Date().toLocaleString()}*

## Scores
- **Consistency**: ${finalScores.consistency}/10
- **Readability**: ${finalScores.readability}/10
- **Scalability**: ${finalScores.scalability}/10
- **Security**: ${finalScores.security}/10
- **Maintainability**: ${finalScores.maintainability}/10

## Security Alerts
${projectData.securityAlerts.length > 0 ? projectData.securityAlerts.map(a => `- ⚠️ ${a}`).join('\n') : '- ✅ No exposed secrets detected.'}

## Codebase Issues & Recommendations
${projectData.issues.length > 0 ? projectData.issues.map(i => `- ${i}`).join('\n') : '- 🎉 Brilliant! No major architectural issues detected.'}

## Architecture Overview
- Total JS/JSX Files: **${projectData.stats.jsFiles + projectData.stats.jsxFiles}**
- Components: **${projectData.components.length}**
- Pages: **${projectData.pages.length}**
- Services: **${projectData.services.length}**
- Total Lines of Code: **${projectData.stats.totalLines}**

---
*This file is continuously updated by the Code Quality Analyzer.*
`;

  fs.writeFileSync(path.join(ROOT_DIR, 'CODE_ANALYSIS_REPORT.md'), reportContent);
  return finalScores;
};

const generateReadme = () => {
  const pkgPath = path.join(ROOT_DIR, 'package.json');
  let pkgName = 'SmartBank AI';
  let pkgDesc = 'A modern, AI-powered frontend web application that helps users make better financial decisions.';
  
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    if (pkg.name) pkgName = pkg.name;
    if (pkg.description) pkgDesc = pkg.description;
  }

  const readmeContent = `# ${pkgName}

${pkgDesc}

> **Note**: This documentation is auto-generated and kept up-to-date dynamically based on the evolving codebase.

## 🚀 Features
- **AI Financial Assistant**: Ask banking, card, and investment questions.
- **Expense Analyzer**: Discover spending patterns and AI-driven savings insights.
- **Smart Card Advisor**: AI-powered debit, credit, and forex card recommendations.
- **Bank Comparison**: Compare top Indian banks based on fees and minimum balance.
- **Market Opportunities**: Track stocks, mutual funds, and exclusive offers.
- **AI Forex Advisor**: Optimize international money transfers.

## 📁 Technical Architecture

### Folder Structure
\`\`\`text
src/
├── components/   (${projectData.components.length} files)
├── pages/        (${projectData.pages.length} files)
├── services/     (${projectData.services.length} files)
├── hooks/        (${projectData.hooks.length} files)
└── utils/        (${projectData.utils.length} files)
\`\`\`

### Application Routes
${projectData.routes.length > 0 ? projectData.routes.map(r => `- \`${r}\``).join('\n') : '- *No manual routes extracted.*'}

## 💻 Tech Stack
- Frontend: React.js, Vite
- Styling: Tailwind CSS, Lucide React (Icons)
- Routing: React Router DOM
- AI Integration: Groq API (Llama 3)
- Charts: Recharts

## 🛠️ How to Run Locally

1. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Environment Variables**
   Create a \`.env\` file in the root directory and add:
   \`\`\`env
   VITE_GROQ_API_KEY=your_groq_api_key_here
   \`\`\`

3. **Start the Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`

## 🔮 Future Improvements
- Backend integration with a live SQL/NoSQL database.
- Real-time OAuth authentication.
- Full OCR extraction (currently simulated via AI flow).
- Mobile application ports (React Native).

---
*Generated by the SmartBank Dynamic Analyzer.*
`;

  fs.writeFileSync(path.join(ROOT_DIR, 'README.md'), readmeContent);
};

// Main Execution
console.log("Starting Code Quality Analysis...");
scanDirectory(SRC_DIR);
const finalScores = generateReport();
generateReadme();
console.log("Analysis Complete!");
console.log(`Scores -> Sec: ${finalScores.security}, Maint: ${finalScores.maintainability}, Read: ${finalScores.readability}, Consist: ${finalScores.consistency}, Scale: ${finalScores.scalability}`);
console.log("README.md and CODE_ANALYSIS_REPORT.md updated.");
