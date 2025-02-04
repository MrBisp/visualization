import Link from "next/link";
import Image from "next/image";
import config from "@/config";
import logo from "@/app/icon.png";

// Add the Footer to the bottom of your landing page and more.
// The support link is connected to the config.js file. If there's no config.mailgun.supportEmail, the link won't be displayed.

const Footer = () => {
	return (
		<footer className="bg-base-200 py-8">
			<div className="container mx-auto px-4">
				<div className="flex flex-col items-center justify-center space-y-4">
					<div className="text-center">
						<p className="text-sm text-gray-600">
							Featured on{' '}
							<a 
								href="https://sprunked.dev/" 
								target="_blank" 
								rel="noopener noreferrer"
								className="text-primary hover:text-primary-focus underline"
							>
								Sprunked
							</a>
							{' '}and{' '}
							<a 
								href="https://aistage.net" 
								target="_blank" 
								rel="noopener noreferrer"
								title="AIStage"
								className="text-primary hover:text-primary-focus underline"
							>
								AIStage
							</a>
						</p>
					</div>
					<div className="text-sm text-gray-500">
						© {new Date().getFullYear()} All rights reserved.
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
