import { Locale } from '@/shared/types/enums';
import type { ClinicReport, ReportMetric } from '@/shared/types/models/admin';

function pick(arabic: boolean, english: string, arabicText?: string) {
  return arabic && arabicText ? arabicText : english;
}

export function reportCopy(report: ClinicReport, locale: string) {
  const arabic = locale === Locale.AR;

  return {
    title: pick(arabic, report.title, report.titleAr),
    description: pick(arabic, report.description, report.descriptionAr),
    period: pick(arabic, report.period, report.periodAr),
    summary: report.summary ? pick(arabic, report.summary, report.summaryAr) : undefined,
    metrics: report.metrics?.map(
      (metric): ReportMetric => ({
        ...metric,
        label: pick(arabic, metric.label, metric.labelAr),
        value: pick(arabic, metric.value, metric.valueAr),
      }),
    ),
    highlights: arabic && report.highlightsAr?.length ? report.highlightsAr : report.highlights,
  };
}
