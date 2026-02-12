/**
 * Build a Word document from report fullData for .docx download.
 * Uses the same structure as the web view (board statement, profile, pillars, targets).
 */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
} from 'docx';

function para(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text: text || '', ...opts })],
    ...opts,
  });
}

function heading(text, level = HeadingLevel.HEADING_2) {
  return new Paragraph({
    text: text || '',
    heading: level,
    spacing: { before: 400, after: 200 },
  });
}

export function buildReportDoc(data) {
  if (!data || !data.boardStatement) {
    throw new Error('Report data is required');
  }

  const children = [];

  children.push(heading('Sustainability Report', HeadingLevel.HEADING_1));
  children.push(para(`Scope: ${data.productName || 'Report'}`));
  children.push(para(''));
  children.push(heading('1. Board Statement'));
  children.push(para(data.boardStatement));
  children.push(para(''));

  if (data.companyProfile) {
    const aboutTitle = `2. About ${data.companyName || data.productName || 'the Company'}`;
    children.push(heading(aboutTitle));
    children.push(para(data.companyProfile));
    if (data.sustainabilityApproach || data.stakeholderEngagement) {
      if (data.sustainabilityApproach) children.push(para(data.sustainabilityApproach));
      if (data.stakeholderEngagement) children.push(para(data.stakeholderEngagement));
    }
    children.push(para(''));
  }

  const section = (title, items) => {
    if (!items || !items.length) return;
    children.push(heading(title));
    items.forEach((item) => {
      children.push(para(item.title, { bold: true }));
      if (item.keyData) children.push(para(`Key data: ${item.keyData}`));
      if (item.strategy) children.push(para(`Strategy: ${item.strategy}`));
      if (item.performance) children.push(para(`Performance: ${item.performance}`));
      if (item.outlook) children.push(para(`Outlook: ${item.outlook}`));
      children.push(para(''));
    });
  };

  section('3. Environmental Stewardship', data.environmentalAnalysis);
  section('4. Social Responsibility', data.socialAnalysis);
  section('5. Governance & Ethics', data.governanceAnalysis);

  if (data.futureTargets && data.futureTargets.length > 0) {
    children.push(heading('6. Sustainability Roadmap'));
    const headerRow = new TableRow({
      children: [
        new TableCell({ children: [para('Area', { bold: true })] }),
        new TableCell({ children: [para('Goal', { bold: true })] }),
        new TableCell({ children: [para('Status', { bold: true })] }),
      ],
    });
    const bodyRows = data.futureTargets.map(
      (t) =>
        new TableRow({
          children: [
            new TableCell({ children: [para(t.area)] }),
            new TableCell({ children: [para(t.goal)] }),
            new TableCell({ children: [para(t.status)] }),
          ],
        })
    );
    children.push(
      new Table({
        rows: [headerRow, ...bodyRows],
        width: { size: 100, type: 'PERCENTAGE' },
      })
    );
  }

  return new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
}

export async function exportReportToDocxBlob(data) {
  const doc = buildReportDoc(data);
  return Packer.toBlob(doc);
}
