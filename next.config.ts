import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // React Compiler disabled - requires babel-plugin-react-compiler
};

export default withNextIntl(nextConfig);
