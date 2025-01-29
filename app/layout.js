import { Inter } from "next/font/google";
import { getSEOTags } from "@/libs/seo";
import ClientLayout from "@/components/LayoutClient";
import config from "@/config";
import "./globals.css";
import Head from "next/head";
import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';

const font = Inter({ subsets: ["latin"] });
const MapNavBar = dynamic(() => import('@/components/MapNavBar'), {
	ssr: false
});

export const viewport = {
	// Will use the primary color of your theme to show a nice theme color in the URL bar of supported browsers
	themeColor: config.colors.main,
	width: "device-width",
	initialScale: 1,
};

// This adds default SEO tags to all pages in our app.
// You can override them in each page passing params to getSOTags() function.
export const metadata = getSEOTags();

export default function RootLayout({ children }) {
	return (
		<html
			lang="en"
			data-theme={config.colors.theme}
			className={font.className}
		>
			<Head>
				<link rel="manifest" href="/manifest.json" />
				<meta name="theme-color" content="#000000" />
				<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
			</Head>
			<body>
				<ClientLayout>
					{children}
					<MapNavBar />
				</ClientLayout>
			</body>
		</html>
	);
}
