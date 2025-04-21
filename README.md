# Lolita - Personal Finance Management Application

Lolita is a modern, user-friendly personal finance management application built with Next.js, Convex, and TypeScript. It helps users track expenses, manage budgets, set savings goals, and gain insights into their financial habits.

## Features

### 💰 Transaction Management
- Track income and expenses
- Categorize transactions
- Add notes and timestamps
- View transaction history

### 📊 Financial Dashboard
- Real-time financial overview
- Income vs. expenses visualization
- Category-wise spending breakdown
- Daily, weekly, and monthly trends

### 🎯 Budget Management
- Set monthly and daily budget limits
- Category-specific budgets
- Warning thresholds for overspending
- Budget vs. actual spending analysis

### 💸 Savings Goals
- Create and track savings targets
- Set deadlines for financial goals
- Monitor progress in real-time
- Get insights on required monthly savings

### 📈 Financial Reports
- Detailed spending analysis
- Budget adherence tracking
- Category-wise breakdowns
- Customizable reporting periods (weekly/monthly/yearly)

### 🔔 Smart Alerts
- Budget limit warnings
- Overspending notifications
- Goal progress updates
- Savings rate insights

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Convex
- **Authentication**: Clerk
- **Styling**: Tailwind CSS
- **Charts**: Chart.js
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Convex account
- Clerk account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/lolita.git
   cd lolita
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add:
   ```
   NEXT_PUBLIC_CONVEX_URL=your_convex_url
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. In a separate terminal, start the Convex development server:
   ```bash
   npx convex dev
   ```

### Database Setup

The application uses Convex for the database with the following schema:

- Users
- Transactions
- Budget Limits
- Savings Goals
- Budget Plans

The schema is automatically set up when you run the Convex development server.

## Usage

1. **Sign Up/Login**
   - Create an account or log in using Clerk authentication
   - Set up your profile

2. **Dashboard**
   - View your financial overview
   - Track daily spending
   - Monitor budget status

3. **Transactions**
   - Add new transactions
   - Categorize spending
   - View transaction history

4. **Budgets**
   - Set category-wise budgets
   - Define daily and monthly limits
   - Set warning thresholds

5. **Savings Goals**
   - Create new savings targets
   - Track progress
   - Get insights on saving rates

6. **Reports**
   - Generate financial reports
   - Analyze spending patterns
   - Track budget adherence

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Next.js team for the amazing framework
- Convex for the backend infrastructure
- Clerk for authentication services
- All contributors and users of Lolita

## Support

For support, email [your-email@example.com] or open an issue in the repository.

---

Made with ❤️ by [Your Name/Team]
