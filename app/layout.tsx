import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import cx from "classnames";
import { sfPro, inter } from "./fonts";
import Nav from "@/components/layout/nav";
import Footer from "@/components/layout/footer";
import { Suspense } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { Providers } from "./providers";

export const metadata = {
  title: "GIBI 🎁",
  description: "GIBI is the ultimate solution to web3 giveaways embracing a more open and just way of running giveaways on the internet.",
  twitter: {
    card: "summary_large_image",
    title: "GIBI 🎁",
    description: "GIBI is the ultimate solution to web3 giveaways embracing a more open and just way of running giveaways on the internet.",
    creator: "@MaskedDAO",
  },
  metadataBase: new URL("https://gibi.app"),
  themeColor: "#FFF",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={cx(sfPro.variable, inter.variable)}>
        <Providers>
          <div className="fixed h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-cyan-100" />
          <Suspense fallback="...">
            <Nav />
          </Suspense>
          <main className="flex min-h-screen w-full flex-col items-center justify-center py-32">{children}</main>
          <Footer />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
