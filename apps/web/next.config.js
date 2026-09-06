import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This repo maintains its own CLAUDE.md/docs hierarchy (see root CLAUDE.md's
  // "Docs map") — don't let `next dev` overwrite apps/web/CLAUDE.md with a
  // generated AGENTS.md stub.
  agentRules: false,
  // Workspace packages (packages/db, packages/auth-providers) ship raw TypeScript
  // with NodeNext-style `./foo.js` relative specifiers — required by tsc under
  // moduleResolution: NodeNext (see their tsconfig.json) and by `node --import tsx`
  // when those packages run standalone (db:migrate, their own test scripts). Without
  // transpilePackages, the bundler treats them as opaque node_modules and never looks
  // inside; with it, the specifier `.js` still needs mapping to the real `.ts` file.
  transpilePackages: ['@committee/db', '@committee/auth-providers'],
  webpack(config) {
    // webpack's own version of the same NodeNext .js-means-.ts mapping. This is why
    // apps/web's dev/build scripts (package.json) pass --webpack explicitly — as of
    // Next 16, Turbopack (the default) has no equivalent option and could not be made
    // to resolve these specifiers reliably (it also showed nondeterministic "Module
    // not found" errors across otherwise-identical requests in testing, not just a
    // one-time miss), so this repo pins apps/web to webpack rather than Turbopack
    // until Turbopack supports this.
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};

export default withNextIntl(nextConfig);
