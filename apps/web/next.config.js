import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This repo maintains its own CLAUDE.md/docs hierarchy (see root CLAUDE.md's
  // "Docs map") — don't let `next dev` overwrite apps/web/CLAUDE.md with a
  // generated AGENTS.md stub.
  agentRules: false,
};

export default withNextIntl(nextConfig);
