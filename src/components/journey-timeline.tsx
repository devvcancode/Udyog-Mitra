'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { approvals } from '@/lib/demo-data';
import type { ProjectProfile } from '@/lib/engines';
import type { JourneyTimeline } from '@/services/ai/l2-rulecore/timeline-engine';
import { ArrowRight, CalendarDays, CircleAlert, Clock3, FileCheck2 } from 'lucide-react';

type Props = { approvalIds: string[]; profile: ProjectProfile; applicationId?: string };

export function JourneyTimeline({ approvalIds, profile, applicationId }: Props) {
  const t = useTranslations('Timeline');
  const locale = useLocale() as 'en' | 'mr' | 'hi';
  const [timeline, setTimeline] = useState<JourneyTimeline | null>(null);
  const [documentsReady, setDocumentsReady] = useState(false);
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadTimeline() {
      setLoading(true);
      setError(false);
      try {
        const endpoint = applicationId ? `/api/applications/${encodeURIComponent(applicationId)}/timeline` : '/api/timeline/estimate';
        const selectedApprovals = approvals.filter((approval) => approvalIds.includes(approval.id));
        const allDocuments = [...new Set(selectedApprovals.flatMap((approval) => approval.documents.map((document) => document.en)))];
        const target = targetDate ? new Date(`${targetDate}T00:00:00.000Z`).toISOString() : undefined;
        const response = applicationId
          ? await fetch(endpoint, { signal: controller.signal, cache: 'no-store' })
          : await fetch(endpoint, {
              method: 'POST', signal: controller.signal, headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                approvalIds, profile,
                documents: documentsReady ? allDocuments.map((docType) => ({ docType, status: 'have/verified', source: 'DigiLocker' })) : [],
                ...(target ? { targetDate: target } : {}),
              }),
            });
        if (!response.ok) throw new Error('Timeline unavailable');
        const result = await response.json() as { data: JourneyTimeline | { timeline: JourneyTimeline } };
        const data = 'timeline' in result.data ? result.data.timeline : result.data;
        if (!controller.signal.aborted) setTimeline(data);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadTimeline();
    return () => controller.abort();
  }, [approvalIds.join(','), applicationId, documentsReady, profile, targetDate]);

  const number = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(value));
  if (loading) return <section className="panel timeline-loading" aria-live="polite"><span className="section-kicker">{t('title')}</span><div className="progress-track"><span style={{ width: '65%' }} /></div></section>;
  if (error || !timeline) return <section className="panel timeline-error" role="alert"><CircleAlert /><span>{t('notReady')}</span><button className="button-quiet" onClick={() => setTargetDate((value) => value)}>{t('retry')}</button></section>;

  const critical = new Set(timeline.criticalPath);
  const maxDays = Math.max(1, timeline.conservativeDays);
  const startsAt = Math.min(...timeline.approvals.map((item) => Date.parse(item.earliestStart)));
  const speedUps = timeline.approvals.flatMap((item) => item.speedUpTips.map((tip) => ({ approvalId: item.approvalId, tip })));
  const stageNames: Record<string, string> = {
    'pre-establishment': locale === 'mr' ? 'स्थापनेपूर्व' : locale === 'hi' ? 'स्थापना-पूर्व' : 'Pre-establishment',
    'pre-operation': locale === 'mr' ? 'कार्यपूर्व' : locale === 'hi' ? 'संचालन-पूर्व' : 'Pre-operation',
    operational: locale === 'mr' ? 'कार्यरत' : locale === 'hi' ? 'संचालित' : 'Operational',
    planning: locale === 'mr' ? 'नियोजन' : locale === 'hi' ? 'योजना' : 'Planning',
  };
  return <section className="journey-timeline" aria-labelledby="journey-timeline-title">
    <div className="panel timeline-summary">
      <div className="timeline-heading"><div><span className="section-kicker">{t('title')}</span><h2 id="journey-timeline-title">{t('intro')}</h2></div><span className="estimate-pill">{Math.round(timeline.confidence * 100)}% {t('confidence')}</span></div>
      <div className="timeline-metrics">
        <Metric icon={<Clock3 />} label={t('fastest')} value={`${number(timeline.fastestPossibleDays)} ${t('days')}`} />
        <Metric icon={<Clock3 />} label={t('p50')} value={`${number(timeline.expectedDays)} ${t('days')}`} />
        <Metric icon={<Clock3 />} label={t('p80')} value={`${number(timeline.p80Days)} ${t('days')}`} />
        <Metric icon={<Clock3 />} label={t('p90')} value={`${number(timeline.conservativeDays)} ${t('days')}`} />
      </div>
      <div className="timeline-critical"><strong>{t('criticalPath')}:</strong> {timeline.criticalPath.join(' → ') || t('noCriticalPath')}<span>{t('statutory')}: {number(timeline.statutoryTotalDays)} {t('days')}</span></div>
      <div className="timeline-stages">{Object.entries(timeline.stageSplit).map(([stage, days]) => <span key={stage}>{stageNames[stage.toLowerCase()] ?? stage}: {number(days)} {t('days')}</span>)}</div>
      {timeline.bottleneckApprovalId && <p className="timeline-bottleneck"><CircleAlert size={15} />{t('bottleneck')}: {timeline.bottleneckApprovalId}</p>}
      <p className="timeline-note">{t('methodNote')}</p>
    </div>

    <div className="panel gantt-panel"><div className="timeline-heading"><h2>{t('breakdown')}</h2><span className="gantt-legend"><i className="gantt-p50" /> P50 <i className="gantt-p90" /> P90</span></div>
      <div className="gantt-list" role="list">{timeline.approvals.map((item) => {
        const approval = approvals.find((candidate) => candidate.id === item.approvalId);
        const offsetDays = Math.max(0, (Date.parse(item.earliestStart) - startsAt) / 86_400_000);
        const left = Math.min(96, offsetDays / maxDays * 100);
        const p50 = Math.max(1, item.totalDays.p50 / maxDays * 100);
        const p90 = Math.max(p50, item.totalDays.p90 / maxDays * 100);
        return <article className="gantt-row" role="listitem" key={item.approvalId}>
          <div className="gantt-row-head"><strong>{approval?.name[locale] ?? item.approvalId}</strong><span>{item.totalDays.p50.toFixed(0)} / {item.totalDays.p90.toFixed(0)} {t('days')}</span></div>
          <div className={`gantt-track ${critical.has(item.approvalId) ? 'critical' : ''}`}><span className="gantt-range" style={{ left: `${left}%`, width: `${p90}%` }} /><span className="gantt-likely" style={{ left: `${left}%`, width: `${p50}%` }} /></div>
          <div className="gantt-meta"><span>{t('slack')}: {number(timeline.slackDays[item.approvalId] ?? 0)}</span><span>{t('prepDays')}: {number(item.applicantPrepDays)}</span><span>{t('procurementDays')}: {number(item.documentProcurementDays)}</span><span>{t('verificationDays')}: {number(item.verificationDays)}</span><span>{t('scrutinyP50')}: {number(item.scrutinyDays.p50)}/{number(item.scrutinyDays.p90)}</span><span>{t('queryExpected')}: {number(item.queryLoopDays.expected)}</span>{item.inspectionWaitDays > 0 && <span>{t('inspectionWait')}: {number(item.inspectionWaitDays)}</span>}</div>
        </article>;
      })}</div>
    </div>

    <div className="two-column timeline-lower">
      <section className="panel"><h2><FileCheck2 size={18} />{t('perDocuments')}</h2><label className="check-row"><input type="checkbox" checked={documentsReady} disabled={Boolean(applicationId)} onChange={(event) => setDocumentsReady(event.target.checked)} />{t('markDocsReady')}</label><p className="muted small">{t('hypotheticalDocs')}</p><div className="timeline-doc-list">{timeline.approvals.flatMap((item) => item.documents.map((document) => <div className="timeline-doc" key={`${item.approvalId}-${document.docType}`}><span>{document.docType}</span><span className={`status-pill ${document.status === 'have/verified' ? 'success' : 'warning'}`}>{document.status}</span><span>{number(document.procurementDays)} {t('days')}</span></div>))}</div></section>
      <section className="panel timeline-what-if"><h2><CalendarDays size={18} />{t('targetDate')}</h2><input type="date" value={targetDate} disabled={Boolean(applicationId)} onChange={(event) => setTargetDate(event.target.value)} />{timeline.probabilityMeetingTarget !== null && <strong>{t('probabilityTarget')}: {new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(timeline.probabilityMeetingTarget)}</strong>}<h3>{t('speedUps')}</h3>{speedUps.length ? <ul>{speedUps.slice(0, 6).map((item, index) => <li key={`${item.approvalId}-${index}`}>{item.approvalId}: {item.tip}</li>)}</ul> : <p className="muted small">{t('hypotheticalDocs')}</p>}</section>
    </div>
  </section>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="timeline-metric"><span>{icon}</span><small>{label}</small><strong>{value}</strong></div>;
}