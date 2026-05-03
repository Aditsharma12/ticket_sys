import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EventPass – Event Ticket System",
  description: "Generate, distribute, and validate event tickets with QR code scanning",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="dark-overlay" />
        {children}
      </body>
    </html>
  );
}
