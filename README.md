# SnapCut AI

AI-powered background removal in seconds. Remove image backgrounds instantly with high accuracy.

## Features

- **Lightning Fast**: Remove backgrounds in under 5 seconds.
- **Pixel Perfect**: High-quality results preserving fine details.
- **Bulk Processing**: Upload and process multiple images.
- **Secure & Private**: Your data stays private and images are processed securely.
- **Developer API**: Easy integration into your own applications.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or bun

### Installation

1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd snapcut-ai
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Start the development server:
   ```sh
   npm run dev
   ```

4. **Optional**: To run serverless functions (Cashfree API) locally:
   ```sh
   # Install Vercel CLI
   npm i -g vercel
   # Run with Vercel Dev
   npm run dev:vercel
   ```

## Technologies Used

- **Vite**: Next-generation frontend tooling.
- **TypeScript**: Static typing for JavaScript.
- **React**: A JavaScript library for building user interfaces.
- **shadcn/ui**: Reusable components built with Radix UI and Tailwind CSS.
- **Tailwind CSS**: Utility-first CSS framework.
- **Framer Motion**: Production-ready motion library for React.

## Deployment

To build the project for production:

```sh
npm run build
```

The output will be in the `dist` directory.

## License

All rights reserved.
