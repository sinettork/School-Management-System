# School Management System

A modern React-based school management system built with TypeScript, Tailwind CSS, and shadcn/ui components.

## 🚀 Features

- **Dashboard**: Overview of school statistics and metrics
- **Student Management**: Add, edit, and manage student records
- **Teacher Management**: Staff administration and scheduling
- **Class Management**: Classroom organization and assignments
- **Subject Management**: Course catalog and curriculum
- **Authentication**: Secure login and role-based access control
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **UI Components**: shadcn/ui, Radix UI, Tailwind CSS
- **Routing**: React Router v7
- **Forms**: React Hook Form with Zod validation
- **Data Fetching**: TanStack Query (React Query)
- **Database**: Supabase
- **Styling**: Tailwind CSS with CSS variables
- **Icons**: Lucide React

## 📁 Project Structure

```
src/
├── app/                    # Application core
│   ├── layouts/           # Layout components
│   ├── providers/         # Context providers
│   └── router/            # Routing configuration
├── components/            # Reusable UI components
│   ├── shared/           # Shared components
│   └── ui/               # shadcn/ui components
├── features/             # Feature modules
│   ├── dashboard/        # Dashboard feature
│   ├── students/         # Student management
│   ├── teachers/         # Teacher management
│   ├── classes/          # Class management
│   └── subjects/         # Subject management
├── lib/                  # Utilities and helpers
├── pages/                # Page components
└── types/                # TypeScript type definitions
```

## 🚀 Getting Started

**Prerequisites:**
- Node.js 18+ 
- npm or yarn

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Update `.env.local` with your configuration:
   - `GEMINI_API_KEY`: Your Gemini API key
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous key

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run TypeScript type checking
- `npm run type-check` - Alias for lint
- `npm run clean` - Clean build artifacts

## 🎨 UI Components

This project uses shadcn/ui components for a consistent and beautiful design system. All components are located in `src/components/ui/` and can be easily customized.

## 🔧 Configuration

- **Vite**: Configuration in `vite.config.ts`
- **TypeScript**: Configuration in `tsconfig.json`
- **Tailwind CSS**: Configuration in `tailwind.config.js`
- **shadcn/ui**: Configuration in `components.json`

## 📝 Environment Variables

Create a `.env.local` file with the following variables:

```env
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the Apache License 2.0.
