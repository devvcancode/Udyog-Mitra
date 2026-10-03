import { WorkspacePage } from '@/components/workspace-page';
import { notFound } from 'next/navigation';
import { knowledgeArticles, schemes } from '@/lib/demo-data';

const staticRoutes = new Set([
  'about', 'know-your-approvals', 'apply', 'applications', 'track', 'documents', 'inspections', 'incentives',
  'grievance', 'knowledge', 'dashboard', 'officer/dashboard', 'nodal/dashboard', 'admin', 'notifications', 'profile',
  'login', 'register', 'accessibility', 'privacy', 'terms', 'sitemap', 'contact', 'whatsapp',
]);

export default async function LocalizedWorkspacePage({ params }: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await params;
  const route = segments.join('/');
  const isKnownDetail = (segments[0] === 'applications' && segments.length === 2)
    || (segments[0] === 'officer' && segments[1] === 'applications' && segments.length === 3)
    || (segments[0] === 'checklist' && segments.length === 2)
    || (segments[0] === 'journey' && segments.length === 2)
    || (segments[0] === 'grievance' && segments.length === 2)
    || (segments[0] === 'verify' && segments.length === 2)
    || (segments[0] === 'knowledge' && segments.length === 2 && knowledgeArticles.some((article) => article.slug === segments[1]))
    || (segments[0] === 'schemes' && segments.length === 2 && schemes.some((scheme) => scheme.id === segments[1]));
  if (!staticRoutes.has(route) && !isKnownDetail) notFound();
  return <WorkspacePage segments={segments} />;
}