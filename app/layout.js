import "./globals.css";

export const metadata = {
  title: "TypeMaster — Stop-on-Error Typing Practice",
  description:
    "Train 100% typing accuracy with a stop-on-error mechanic inspired by Monkeytype. Practice typing precision with real-time feedback, audio cues, and detailed performance analytics.",
  keywords: ["typing", "practice", "accuracy", "monkeytype", "stop-on-error", "wpm"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
