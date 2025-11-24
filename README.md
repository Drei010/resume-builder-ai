# TalentEdge AI - Resume Builder

An intelligent, AI-powered resume builder that generates professional resumes based on job descriptions. Built with modern web technologies and deployed on Vercel.

## Features

✨ **AI-Powered Resume Generation**

- Generate tailored resumes from job descriptions using Google Gemini or OpenAI
- Automatic fallback between AI providers for reliability
- Editable preview with real-time updates
- Add more details to expand generated content

📄 **Multiple Export Formats**

- PDF export with professional styling
- DOCX (Word) export for easy editing
- TXT export for plain text submissions

🌐 **Internationalization**

- Support for multiple languages (English, Spanish, Tagalog)
- Language preference saved to browser storage
- Easy to add more languages

🎨 **Theme Support**

- Dark and light mode with smooth transitions
- Automatic theme selection based on time of day (light: 6 AM - 6 PM, dark: 6 PM - 6 AM)
- Manual toggle with persistent user preference

📱 **Responsive Design**

- Mobile-friendly interface
- Works seamlessly across all devices
- Optimized for both desktop and tablet

## Technology Stack

**Frontend:**

- React 18 with TypeScript
- Vite for build tooling and dev server
- Tailwind CSS for styling
- shadcn/ui component library
- Lucide React icons
- i18next for internationalization
- Sonner for toast notifications
- jsPDF, docx, file-saver for exports

**Backend:**

- Node.js with Express (local development)
- Vercel Serverless Functions (production)
- Support for Google Gemini 2.0 Flash and OpenAI GPT-4o
- Environment-based configuration

**Deployment:**

- Vercel for hosting and serverless functions
- Vercel Analytics integration

## Getting Started

### Prerequisites

- Node.js 16+ and npm (or bun)
- Git for version control

### Local Development

1. **Clone the repository:**

```bash
git clone <repository-url>
cd resume-builder-ai
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables:**

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

4. **Run development servers:**

To run both frontend and backend concurrently:

```bash
npm run dev:all
```

Or run them separately in different terminals:

- Frontend (Vite): `npm run dev` (http://localhost:8080)
- Backend (Express): `npm run server` (http://localhost:3001)

### Available Scripts

- `npm run dev` - Start Vite dev server
- `npm run server` - Start Express backend server
- `npm run dev:all` - Start both frontend and backend concurrently
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Project Structure

```
src/
├── pages/              # Main application pages
│   └── Index.tsx       # Resume builder UI
├── components/         # React components
│   ├── NavLink.tsx
│   └── ui/            # shadcn/ui components
├── contexts/          # React context providers
│   └── ThemeContext.tsx
├── hooks/             # Custom React hooks
├── integrations/      # Third-party integrations
├── i18n/              # Internationalization setup
│   └── locales/       # Translation files
├── lib/               # Utility functions and constants
│   ├── api-config.ts  # API endpoint configuration
│   ├── constants.ts   # App constants
│   └── utils.ts       # Helper utilities

api/
├── generate-resume.js # Unified API handler (Express + Vercel)

public/
└── favicon.svg       # Custom app icon
```

## Configuration

### Customizing Social Links

Edit `src/lib/constants.ts` to update social media links:

```typescript
export const SOCIAL_LINKS = {
  linkedin: "https://linkedin.com/in/yourprofile",
  github: "https://github.com/yourprofile",
  email: "your.email@example.com",
};
```

### Adding Languages

1. Create a new translation file in `src/i18n/locales/` (e.g., `de.json` for German)
2. Update `src/i18n/config.ts` to include the new language
3. Add the language option to the language selector in your component

## Deployment

### Deploy to Vercel

1. **Push to GitHub:**

```bash
git push origin main
```

2. **Connect to Vercel:**

   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect the project settings

3. **Set Environment Variables:**

   - In Vercel Dashboard → Settings → Environment Variables
   - Add `OPENAI_API_KEY` and `GEMINI_API_KEY`
   - Redeploy after adding variables

4. **Custom Domain (Optional):**
   - Navigate to Settings → Domains
   - Add your custom domain

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## How to Use

1. **Enter job description:** Paste the job description in the input field
2. **Select AI provider:** Choose between OpenAI or Gemini (OpenAI is default)
3. **Generate resume:** Click "Generate Resume" to create tailored content
4. **Edit preview:** Modify the generated resume directly in the preview area
5. **Export:** Choose your preferred format (PDF, DOCX, or TXT) and download
6. **Add details:** Use "Add More Details" to expand sections as needed

## API

### POST `/api/generate-resume`

Generates a resume based on job description.

**Request Body:**

```json
{
  "jobDescription": "string",
  "provider": "openai" | "gemini"
}
```

**Response:**

```json
{
  "resume": "string",
  "provider": "string"
}
```

## Troubleshooting

### API calls failing locally?

- Ensure the Express server is running: `npm run server`
- Check that the Vite proxy is configured in `vite.config.ts`
- Verify environment variables are set in `.env`

### Build errors?

- Clear node_modules: `rm -r node_modules && npm install`
- Clear build cache: `npm run build` with a fresh node_modules

### Vercel deployment issues?

- Verify environment variables are set in Vercel dashboard
- Check deployment logs in Vercel dashboard
- Ensure all required API keys are configured

## Contributing

Contributions are welcome! Feel free to open issues and submit pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions, please open a GitHub issue or contact the maintainers.

---

**Note:** Make sure to customize the social links and contact information in `src/lib/constants.ts` before deploying to production.
