# JBRC - Jodhpur Bombay Road Carrier Management System

A modern Next.js application for managing bilty documents, built with Firebase and TypeScript.

## 🚀 Features

- **Firebase Authentication** - Secure login system
- **Firestore Database** - Real-time document storage
- **Bilty Management** - Create, view, edit, and delete bilties
- **Payment Reminders** - WhatsApp integration for payment notifications
- **Excel Export** - Generate GST reports and export data
- **Modern UI** - Built with Tailwind CSS and shadcn/ui
- **Responsive Design** - Works on all devices
- **TypeScript** - Type-safe development

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Firebase (Firestore, Auth, Storage)
- **UI**: Tailwind CSS, shadcn/ui, Lucide Icons
- **Export**: ExcelJS for report generation

## 📦 Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd jbrc-nextjs-firebase
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up Firebase:
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Firestore Database
   - Enable Authentication (Email/Password)
   - Update Firebase config in `lib/firebase.ts` (already configured)

4. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔐 Authentication

Create a user account in Firebase Console:
1. Go to Authentication > Users
2. Add a new user with email and password
3. Use these credentials to login

## 📊 Database Structure

### Collections:
- **bilties** - Main bilty documents
- **counters** - Auto-incrementing bilty numbers

### Bilty Document Structure:
\`\`\`typescript
{
  biltyNo: number,
  biltyDate: Date,
  truckNo: string,
  from: string,
  to: string,
  consignorName: string,
  consignorGst?: string,
  consigneeName: string,
  consigneeGst?: string,
  items: BiltyItem[],
  charges: BiltyCharges,
  status: string,
  createdAt: Date
}
\`\`\`

## 🚀 Deployment

Deploy to Vercel:
\`\`\`bash
npm run build
\`\`\`

The app is ready for deployment on Vercel, Netlify, or any other platform that supports Next.js.

## 📱 Features Overview

### Dashboard
- Real-time statistics
- Quick actions
- Recent bilties
- System status

### Bilty Management
- Create new bilties with auto-incrementing numbers
- View all bilties with search and filter
- Edit existing bilties
- Delete bilties with confirmation

### Payment Reminders
- Send WhatsApp reminders to customers
- Customizable message templates
- Direct WhatsApp integration

### Export & Reports
- Excel export with date range filtering
- GST reports
- Professional formatting

## 🔧 Configuration

### Firebase Rules
Set up Firestore security rules:
\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
\`\`\`

### Environment Variables
No environment variables needed - Firebase config is included in the code.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.
