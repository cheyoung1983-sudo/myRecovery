<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# myRecovery: A Bridge Between Struggle and Solution

A recovery support application built with Google AI Studio and deployed on Netlify.

**Live App:** https://my-recovery-spokane.vercel.app

View your app in AI Studio: https://ai.studio/apps/405a29ce-e558-4918-b3f2-01fa8cf1292a

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/cheyoung1983-sudo/myRecovery.git
   cd myRecovery
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   
   Create a `.env.local` file in the project root and add your Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

   For Firebase integration (Netlify deployment), set these environment variables in your Netlify site settings:
   ```
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   VITE_FIREBASE_MEASUREMENT_ID=
   VITE_FIREBASE_FIRESTORE_DATABASE_ID=
   ```

4. **Run locally**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

---

## 📦 Project Structure

```
myRecovery/
├── src/
│   ├── components/        # Reusable UI components
│   ├── lib/              # Utilities and configurations
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Entry point
├── public/               # Static assets
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore rules
└── vite.config.ts        # Vite configuration
```

---

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run linting checks (if configured)

---

## 🔐 Security & Environment Variables

**Important:** Never commit `.env.local` or any sensitive credentials to the repository. The `.gitignore` file is configured to prevent this.

### Local Development
Use `.env.local` for local development. This file is ignored by git.

### Production (Netlify)
Set environment variables in Netlify's Site Settings:
1. Go to your Netlify site dashboard
2. Navigate to **Site Settings > Build & Deploy > Environment**
3. Add each `VITE_FIREBASE_*` variable

---

## 🐛 Troubleshooting

### Build fails with "Could not resolve firebase-applet-config.json"
**Solution:** Ensure all `VITE_FIREBASE_*` environment variables are set in your Netlify site settings. See [Configure Environment Variables](#configure-environment-variables) above.

### Port 5173 already in use
**Solution:** Stop other processes using that port, or specify a different port:
```bash
npm run dev -- --port 3000
```

### Module not found errors
**Solution:** Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Commit your changes: `git commit -m "feat: describe your changes"`
3. Push to the branch: `git push origin feature/your-feature-name`
4. Open a Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.

---

## 📄 License

This project is open source and available under the MIT License.

---

## 📞 Support

For issues or questions:
- Open an [issue](https://github.com/cheyoung1983-sudo/myRecovery/issues)
- Check existing documentation
- Contact the maintainers

---

**Built with ❤️ for recovery and resilience**
