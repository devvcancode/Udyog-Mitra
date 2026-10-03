import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
export default withNextIntl({
	async headers() {
		return [{
			source: '/:path*',
			headers: [
				{ key: 'X-Content-Type-Options', value: 'nosniff' },
				{ key: 'X-Frame-Options', value: 'DENY' },
				{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
				{ key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(self)' },
				{ key: 'Content-Security-Policy', value: "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: blob: https://media.istockphoto.com; font-src 'self' data: https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://api.openai.com" },
			],
		}];
	},
});