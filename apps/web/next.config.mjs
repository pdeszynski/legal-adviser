import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {};

// Sentry configuration
const SentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are automatically set and shouldn't be overwritten:
  //   - org, project, authToken, configFile, release, deploy, urlPrefix,
  //     include, ignore, webpack, silent, validateBeforeBuild
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
};

export default withSentryConfig(withNextIntl(nextConfig), SentryWebpackPluginOptions);
