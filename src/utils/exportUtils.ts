import { Project, RulesData, PromptData, PitchScriptData } from '../services/database';

export interface ExportData {
  project: Project;
  rulesData?: RulesData | null;
  promptData?: PromptData | null;
  pitchScriptData?: PitchScriptData | null;
  ideaName?: string;
}

export const exportUtils = {
  exportAsJSON(data: ExportData): void {
    const exportData = {
      project_name: data.project.name,
      exported_at: new Date().toISOString(),
      rules: data.rulesData ? {
        rules_text: data.rulesData.rules_text,
        deadline: data.rulesData.deadline,
        sponsors: data.rulesData.sponsors,
        judging_criteria: data.rulesData.judging_criteria,
      } : null,
      prompt: data.promptData ? {
        idea: data.promptData.idea_text,
        optimized_prompt: data.promptData.optimized_prompt,
        word_count: data.promptData.word_count,
      } : null,
      pitch_script: data.pitchScriptData ? {
        idea: data.pitchScriptData.idea_text,
        problem: data.pitchScriptData.problem,
        solution: data.pitchScriptData.solution,
        traction: data.pitchScriptData.traction,
      } : null,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = data.ideaName
      ? `pitch-script-${data.ideaName.toLowerCase().replace(/\s+/g, '-')}.json`
      : `${data.project.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  },

  exportAsMarkdown(data: ExportData): void {
    let markdown = `# ${data.project.name}\n\n`;
    markdown += `**Exported:** ${new Date().toLocaleDateString()}\n\n`;
    markdown += `---\n\n`;

    if (data.rulesData) {
      markdown += `## Rules Analysis\n\n`;

      if (data.rulesData.deadline) {
        markdown += `### Deadline\n${data.rulesData.deadline}\n\n`;
      }

      if (data.rulesData.sponsors.length > 0) {
        markdown += `### Sponsors (${data.rulesData.sponsors.length})\n`;
        data.rulesData.sponsors.forEach(sponsor => {
          markdown += `- ${sponsor}\n`;
        });
        markdown += `\n`;
      }

      if (data.rulesData.judging_criteria.length > 0) {
        markdown += `### Judging Criteria (${data.rulesData.judging_criteria.length})\n`;
        data.rulesData.judging_criteria.forEach(criteria => {
          markdown += `- ${criteria}\n`;
        });
        markdown += `\n`;
      }

      markdown += `### Original Rules\n\`\`\`\n${data.rulesData.rules_text}\n\`\`\`\n\n`;
      markdown += `---\n\n`;
    }

    if (data.promptData) {
      markdown += `## Optimized Prompt\n\n`;
      markdown += `**Word Count:** ${data.promptData.word_count}\n\n`;
      markdown += `### Original Idea\n${data.promptData.idea_text}\n\n`;
      markdown += `### Optimized Prompt\n\`\`\`\n${data.promptData.optimized_prompt}\n\`\`\`\n\n`;
      markdown += `---\n\n`;
    }

    if (data.pitchScriptData) {
      markdown += `## Pitch Script\n\n`;
      markdown += `### Original Idea\n${data.pitchScriptData.idea_text}\n\n`;
      markdown += `### Problem (60 seconds)\n${data.pitchScriptData.problem}\n\n`;
      markdown += `### Solution (90 seconds)\n${data.pitchScriptData.solution}\n\n`;
      markdown += `### Traction (30 seconds)\n${data.pitchScriptData.traction}\n\n`;
    }

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = data.ideaName
      ? `pitch-script-${data.ideaName.toLowerCase().replace(/\s+/g, '-')}.md`
      : `${data.project.name.toLowerCase().replace(/\s+/g, '-')}.md`;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  },

  exportAsPDF(data: ExportData): void {
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.project.name}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      border-bottom: 3px solid #d4ff00;
      padding-bottom: 10px;
      color: #000;
    }
    h2 {
      color: #000;
      margin-top: 40px;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 8px;
    }
    h3 {
      color: #555;
      margin-top: 24px;
    }
    .metadata {
      color: #666;
      font-size: 14px;
      margin-bottom: 30px;
    }
    .section {
      margin-bottom: 40px;
    }
    ul {
      margin: 10px 0;
    }
    li {
      margin: 5px 0;
    }
    pre {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .highlight {
      background: #fffbcc;
      padding: 2px 4px;
    }
    @media print {
      body {
        margin: 0;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <h1>${data.project.name}</h1>
  <div class="metadata">
    <strong>Exported:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
  </div>
  <hr>
`;

    if (data.rulesData) {
      html += `
  <div class="section">
    <h2>Rules Analysis</h2>
`;

      if (data.rulesData.deadline) {
        html += `
    <h3>Deadline</h3>
    <p>${data.rulesData.deadline}</p>
`;
      }

      if (data.rulesData.sponsors.length > 0) {
        html += `
    <h3>Sponsors (${data.rulesData.sponsors.length})</h3>
    <ul>
`;
        data.rulesData.sponsors.forEach(sponsor => {
          html += `      <li>${sponsor}</li>\n`;
        });
        html += `    </ul>\n`;
      }

      if (data.rulesData.judging_criteria.length > 0) {
        html += `
    <h3>Judging Criteria (${data.rulesData.judging_criteria.length})</h3>
    <ul>
`;
        data.rulesData.judging_criteria.forEach(criteria => {
          html += `      <li>${criteria}</li>\n`;
        });
        html += `    </ul>\n`;
      }

      html += `
    <h3>Original Rules</h3>
    <pre>${data.rulesData.rules_text}</pre>
  </div>
`;
    }

    if (data.promptData) {
      html += `
  <div class="section">
    <h2>Optimized Prompt</h2>
    <p><strong>Word Count:</strong> ${data.promptData.word_count}</p>

    <h3>Original Idea</h3>
    <p>${data.promptData.idea_text}</p>

    <h3>Optimized Prompt</h3>
    <pre>${data.promptData.optimized_prompt}</pre>
  </div>
`;
    }

    if (data.pitchScriptData) {
      html += `
  <div class="section">
    <h2>Pitch Script</h2>

    <h3>Original Idea</h3>
    <p>${data.pitchScriptData.idea_text}</p>

    <h3>Problem <span class="highlight">(60 seconds)</span></h3>
    <p>${data.pitchScriptData.problem}</p>

    <h3>Solution <span class="highlight">(90 seconds)</span></h3>
    <p>${data.pitchScriptData.solution}</p>

    <h3>Traction <span class="highlight">(30 seconds)</span></h3>
    <p>${data.pitchScriptData.traction}</p>
  </div>
`;
    }

    html += `
</body>
</html>
`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');

    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    }
  },

  exportAsText(data: ExportData): void {
    let text = `${data.project.name}\n`;
    text += `${'='.repeat(data.project.name.length)}\n\n`;
    text += `Exported: ${new Date().toLocaleString()}\n\n`;
    text += `${'-'.repeat(60)}\n\n`;

    if (data.rulesData) {
      text += `RULES ANALYSIS\n\n`;

      if (data.rulesData.deadline) {
        text += `Deadline:\n${data.rulesData.deadline}\n\n`;
      }

      if (data.rulesData.sponsors.length > 0) {
        text += `Sponsors (${data.rulesData.sponsors.length}):\n`;
        data.rulesData.sponsors.forEach(sponsor => {
          text += `  - ${sponsor}\n`;
        });
        text += `\n`;
      }

      if (data.rulesData.judging_criteria.length > 0) {
        text += `Judging Criteria (${data.rulesData.judging_criteria.length}):\n`;
        data.rulesData.judging_criteria.forEach(criteria => {
          text += `  - ${criteria}\n`;
        });
        text += `\n`;
      }

      text += `Original Rules:\n${data.rulesData.rules_text}\n\n`;
      text += `${'-'.repeat(60)}\n\n`;
    }

    if (data.promptData) {
      text += `OPTIMIZED PROMPT\n\n`;
      text += `Word Count: ${data.promptData.word_count}\n\n`;
      text += `Original Idea:\n${data.promptData.idea_text}\n\n`;
      text += `Optimized Prompt:\n${data.promptData.optimized_prompt}\n\n`;
      text += `${'-'.repeat(60)}\n\n`;
    }

    if (data.pitchScriptData) {
      text += `PITCH SCRIPT\n\n`;
      text += `Original Idea:\n${data.pitchScriptData.idea_text}\n\n`;
      text += `PROBLEM (60 seconds):\n${data.pitchScriptData.problem}\n\n`;
      text += `SOLUTION (90 seconds):\n${data.pitchScriptData.solution}\n\n`;
      text += `TRACTION (30 seconds):\n${data.pitchScriptData.traction}\n\n`;
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = data.ideaName
      ? `pitch-script-${data.ideaName.toLowerCase().replace(/\s+/g, '-')}.txt`
      : `${data.project.name.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  },

  exportAsDocx(data: ExportData): void {
    // Generate HTML similar to PDF but optimized for Word
    let html = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${data.project.name}</title>
  <style>
    body {
      font-family: Calibri, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
    }
    h1 {
      font-size: 24pt;
      font-weight: bold;
      border-bottom: 3px solid #d4ff00;
      padding-bottom: 10px;
    }
    h2 {
      font-size: 18pt;
      font-weight: bold;
      margin-top: 20pt;
      border-bottom: 1pt solid #e0e0e0;
      padding-bottom: 5pt;
    }
    h3 {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 12pt;
    }
    p {
      margin: 6pt 0;
    }
    ul {
      margin: 6pt 0;
    }
    .metadata {
      color: #666;
      font-size: 10pt;
    }
  </style>
</head>
<body>
  <h1>${data.project.name}</h1>
  <p class="metadata"><strong>Exported:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
  <hr>
`;

    if (data.rulesData) {
      html += `<h2>Rules Analysis</h2>`;

      if (data.rulesData.deadline) {
        html += `<h3>Deadline</h3><p>${data.rulesData.deadline}</p>`;
      }

      if (data.rulesData.sponsors.length > 0) {
        html += `<h3>Sponsors (${data.rulesData.sponsors.length})</h3><ul>`;
        data.rulesData.sponsors.forEach(sponsor => {
          html += `<li>${sponsor}</li>`;
        });
        html += `</ul>`;
      }

      if (data.rulesData.judging_criteria.length > 0) {
        html += `<h3>Judging Criteria (${data.rulesData.judging_criteria.length})</h3><ul>`;
        data.rulesData.judging_criteria.forEach(criteria => {
          html += `<li>${criteria}</li>`;
        });
        html += `</ul>`;
      }

      html += `<h3>Original Rules</h3><p>${data.rulesData.rules_text.replace(/\n/g, '<br>')}</p>`;
    }

    if (data.promptData) {
      html += `<h2>Optimized Prompt</h2>`;
      html += `<p><strong>Word Count:</strong> ${data.promptData.word_count}</p>`;
      html += `<h3>Original Idea</h3><p>${data.promptData.idea_text}</p>`;
      html += `<h3>Optimized Prompt</h3><p>${data.promptData.optimized_prompt.replace(/\n/g, '<br>')}</p>`;
    }

    if (data.pitchScriptData) {
      html += `<h2>Pitch Script</h2>`;
      html += `<h3>Original Idea</h3><p>${data.pitchScriptData.idea_text}</p>`;
      html += `<h3>Problem (60 seconds)</h3><p>${data.pitchScriptData.problem}</p>`;
      html += `<h3>Solution (90 seconds)</h3><p>${data.pitchScriptData.solution}</p>`;
      html += `<h3>Traction (30 seconds)</h3><p>${data.pitchScriptData.traction}</p>`;
    }

    html += `</body></html>`;

    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = data.ideaName
      ? `pitch-script-${data.ideaName.toLowerCase().replace(/\s+/g, '-')}.doc`
      : `${data.project.name.toLowerCase().replace(/\s+/g, '-')}.doc`;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  },
};
