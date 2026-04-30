import "./globals.css";

export const metadata = {
  title: "Finova",
  description: "Finova financial decision assistant for intelligent budgeting",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
