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
  WidthType,
  BorderStyle,
} from 'docx';
import { getEffectiveTargets } from './reportTargets';

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

  const targets = getEffectiveTargets(data);
  children.push(heading('6. Sustainability Roadmap'));

  // A4 with 1-inch margins = ~9072 twips usable width
  // Column widths: Area 25%, Goal 50%, Status 25%
  const COL_WIDTHS = [2268, 4536, 2268]; // twips
  const cellBorders = {
    top: { style: BorderStyle.SINGLE, size: 4, color: '334761' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '334761' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '334761' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '334761' },
  };

  const makeCell = (text, colIdx, isHeader = false) =>
    new TableCell({
      width: { size: COL_WIDTHS[colIdx], type: WidthType.DXA },
      borders: cellBorders,
      shading: isHeader ? { fill: '334761' } : undefined,
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: text || '',
              bold: isHeader,
              color: isHeader ? 'FFFFFF' : '000000',
            }),
          ],
          spacing: { before: 80, after: 80 },
        }),
      ],
    });

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      makeCell('Area', 0, true),
      makeCell('Goal', 1, true),
      makeCell('Status', 2, true),
    ],
  });

  const bodyRows = targets.map(
    (t) =>
      new TableRow({
        children: [
          makeCell(t.area, 0),
          makeCell(t.goal, 1),
          makeCell(t.status, 2),
        ],
      })
  );

  children.push(
    new Table({
      rows: [headerRow, ...bodyRows],
      width: { size: 9072, type: WidthType.DXA },
    })
  );

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
