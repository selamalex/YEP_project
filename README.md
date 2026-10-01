# YEP Initiative | Yael Educational Pathway

YEP Initiative is a youth-led educational platform helping Ethiopian students navigate international education opportunities through guidance, practical resources, training, mentorship, and community support.

## Technology

- React 19
- TanStack Start and TanStack Router
- Vite
- TypeScript
- Tailwind CSS
- Radix UI and Lucide React

## Local Development

Requirements: Node.js and npm.

```sh
git clone <repository-url>
cd yepproject
npm install
npm run dev
```

The development server runs the site locally with Vite.

## Build

Create a production build with:

```sh
npm run build
```

To preview the production build locally:

```sh
npm run preview
```

## Deployment

Run the production build in the deployment environment and publish the generated output using the hosting provider's TanStack Start or Vite deployment configuration. Configure any environment variables required by the deployment platform outside the repository.

## Project Structure

- `src/routes/` contains the application routes.
- `src/components/` contains shared site and UI components.
- `src/lib/` contains shared application utilities and site data.
- `src/assets/` contains images used by the website.
- `public/` contains static public assets such as the favicon and robots file.
