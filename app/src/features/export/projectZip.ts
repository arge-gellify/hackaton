import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import type { Project, Report, Retro, User } from '../../domain/types';
import { useAppStore } from '../../stores/useAppStore';
import { buildReportPdf } from './reportPdf';
import { slugify } from '../../lib/cn';
import { ROLE_LABEL } from '../../domain/permissions';

export async function downloadProjectZip(
  project: Project,
  retros: Retro[],
  allReports: Report[],
  exporter: User
) {
  const zip = new JSZip();
  const users = useAppStore.getState().users;
  const exporterRole = project.members.find((m) => m.userId === exporter.id)?.role;
  const dateStr = format(new Date(), 'yyyy-MM-dd');

  const reports = allReports.filter((r) => retros.some((re) => re.id === r.retroId));

  zip.file(
    'project.json',
    JSON.stringify({ project, retros, reports, users }, null, 2)
  );

  const reportsFolder = zip.folder('reports');
  for (const rep of reports) {
    const retro = retros.find((r) => r.id === rep.retroId);
    if (!retro) continue;
    const doc = buildReportPdf(rep, retro, users);
    const blob = doc.output('blob');
    reportsFolder?.file(`${slugify(retro.title)}.pdf`, blob);
  }

  const readme = `# ${project.name}

Exported on ${format(new Date(), 'PPP')} by ${exporter.name}${exporterRole ? ` (${ROLE_LABEL[exporterRole]})` : ''}.

## Contents

- \`project.json\` — full project state (members, retros, cards, votes, action items, reports)
- \`reports/*.pdf\` — one PDF per closed retro report
- \`README.md\` — this file

## Format notes

JSON shape mirrors the application's domain model. Authorship of cards is preserved internally but never rendered in the UI (cards display as Anonymous).
`;
  zip.file('README.md', readme);

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${slugify(project.name)}-${dateStr}.zip`);
}
