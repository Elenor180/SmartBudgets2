import React from 'react';

const cn = (...tokens: Array<string | false | null | undefined>) =>
  tokens.filter(Boolean).join(' ');

export const Button = ({
  children,
  className,
  tone = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) => (
  <button
    {...props}
    className={cn(
      'button',
      `button--${tone}`,
      props.disabled && 'button--disabled',
      className,
    )}
  >
    {children}
  </button>
);

export const Card = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <section className={cn('card', className)}>{children}</section>;

export const PageHeader = ({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <header className="page-header">
    <div className="stack-sm">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p className="page-description">{description}</p>
    </div>
    {action ? <div className="page-header__action">{action}</div> : null}
  </header>
);

export const SectionHeader = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="section-header">
    <div className="stack-xs">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
    {action ? <div>{action}</div> : null}
  </div>
);

export const MetricCard = ({
  label,
  value,
  detail,
  tone = 'teal',
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'teal' | 'amber' | 'rose' | 'sky';
}) => (
  <Card className={cn('metric-card', `metric-card--${tone}`)}>
    <span className="metric-card__label">{label}</span>
    <strong className="metric-card__value">{value}</strong>
    <span className="metric-card__detail">{detail}</span>
  </Card>
);

export const Tag = ({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode;
  tone?: 'slate' | 'teal' | 'amber' | 'rose' | 'sky';
}) => <span className={cn('tag', `tag--${tone}`)}>{children}</span>;

export const ProgressBar = ({
  value,
  tone = 'teal',
}: {
  value: number;
  tone?: 'teal' | 'amber' | 'rose' | 'sky';
}) => (
  <div className="progress">
    <span
      className={cn('progress__bar', `progress__bar--${tone}`)}
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    />
  </div>
);

export const EmptyState = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <Card className="empty-state">
    <div className="stack-sm">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
    {action}
  </Card>
);

export const AppLoader = () => (
  <div className="app-loader">
    <div className="app-loader__orb" />
    <p>Loading your workspace…</p>
  </div>
);

export const NoticeBanner = ({
  children,
  tone = 'info',
}: {
  children: React.ReactNode;
  tone?: 'info' | 'success' | 'danger';
}) => (
  <div className={cn('notice-banner', `notice-banner--${tone}`)}>
    {children}
  </div>
);
