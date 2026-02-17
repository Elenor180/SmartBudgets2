# SmartBudgets2

Status: Active
License: MIT

SmartBudgets2 is a comprehensive personal finance management application designed to help users track expenses, establish budgets, and gain insights into their financial health. This version improves upon the original logic to provide more robust tracking and visualization of spending habits.

---

## Features

* Transaction Tracking: Log daily income and expenses with detailed categorization.
* Budget Management: Set monthly or category-specific limits to control spending.
* Data Visualization: Integrated charts to monitor spending trends over time.
* Financial Goals: Track progress toward savings targets or debt repayment.
* Report Generation: View summaries of monthly financial activity.

---

## Tech Stack

* Frontend: React.js
* Backend: Node.js / Express
* Database: PostgreSQL
* Styling: Tailwind CSS

---

## Installation and Setup

### 1. Prerequisites
* Node.js (v18.x or higher)
* Git
* A package manager (npm or yarn)

### 2. Clone the Repository
git clone https://github.com/Elenor180/SmartBudgets2.git
cd SmartBudgets2

### 3. Install Dependencies
npm install

### 4. Environment Configuration
Create a .env file in the root directory and add the following variables:
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key

### 5. Run the Application
# For development
npm run dev

# For production
npm run build
npm start

---

## Project Structure

SmartBudgets2/
├── public/          # Static assets
├── src/
│   ├── components/  # Reusable UI elements
│   ├── hooks/       # Custom application hooks
│   ├── pages/       # Main view components
│   ├── services/    # API and external service logic
│   ├── utils/       # Formatting and helper utilities
│   └── App.js       # Root application component
├── .env.example     # Environment variable template
├── package.json     # Scripts and dependencies
└── README.md        # Project documentation

---

## Usage (locally)

1. Start the server and navigate to the local host address (usually http://localhost:5000).
2. Create an account or log in.
3. Use the Dashboard to add your initial balance and recurring expenses.
4. Categorize your transactions to generate accurate spending charts.

---

## Contributing

1. Fork the repository.
2. Create a feature branch (git checkout -b feature/NewFeature).
3. Commit your changes (git commit -m 'Add NewFeature').
4. Push to the branch (git push origin feature/NewFeature).
5. Open a Pull Request.

---

## License

This project is licensed under the MIT License.

---

## Contact

Project Link: https://github.com/Elenor180/SmartBudgets2
