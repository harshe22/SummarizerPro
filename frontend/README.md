# SummarizePro Frontend

Modern React-based frontend for the SummarizePro AI summarization platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

Application will start at: `http://localhost:3000`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── TextInput.tsx    # Text input component
│   │   ├── FileInput.tsx    # File upload component
│   │   ├── UrlInput.tsx     # URL input component
│   │   ├── SummaryDisplay.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts           # API client
│   │   └── utils.ts         # Utility functions
│   ├── store/
│   │   └── useAppStore.ts   # Zustand state management
│   ├── App.tsx              # Main application
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## ⚙️ Configuration

### Environment Variables (.env)

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=SummarizePro
```

## 🎨 Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **shadcn/ui** - UI components
- **Zustand** - State management
- **Axios** - HTTP client
- **Lucide React** - Icons

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Type check
npm run type-check
```

### Adding New Components

1. Create component file:
```tsx
// src/components/MyComponent.tsx
import React from 'react';

export const MyComponent: React.FC = () => {
  return <div>My Component</div>;
};
```

2. Import and use:
```tsx
import { MyComponent } from './components/MyComponent';
```

### Using shadcn/ui Components

```bash
# Add a new component
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
```

## 🎯 Features

### Text Summarization
- Direct text input
- Customizable summary styles
- Custom prompts
- Real-time processing

### Document Upload
- Drag & drop support
- PDF, DOCX, TXT formats
- File size validation
- Progress tracking

### URL Summarization
- Web page content extraction
- URL validation
- Loading states

### Summary Display
- Formatted output
- Copy to clipboard
- Export options
- Metadata display

### Q&A System
- Interactive question answering
- Suggested questions
- Context-aware responses

## 🎨 Styling

### TailwindCSS
Custom theme configuration in `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      primary: {...},
      secondary: {...},
    },
  },
}
```

### CSS Variables
Global CSS variables in `src/index.css`:

```css
:root {
  --primary: ...;
  --secondary: ...;
}
```

## 📱 Responsive Design

The application is fully responsive with breakpoints:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 🔧 API Integration

### API Client (`src/lib/api.ts`)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const summarizeText = async (data) => {
  const response = await api.post('/api/v1/summarize/text', data);
  return response.data;
};
```

### State Management (`src/store/useAppStore.ts`)

```typescript
import { create } from 'zustand';

export const useAppStore = create((set) => ({
  summary: null,
  setSummary: (summary) => set({ summary }),
}));
```

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### API Connection Issues
- Verify backend is running
- Check `VITE_API_URL` in .env
- Check browser console for CORS errors

### Type Errors
```bash
# Regenerate types
npm run type-check
```

## 📦 Building for Production

```bash
# Build
npm run build

# Preview build
npm run preview

# Build output in dist/
```

### Deployment

The `dist/` folder can be deployed to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

## 📝 License

MIT License - see LICENSE file for details
