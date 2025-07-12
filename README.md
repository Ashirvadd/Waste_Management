# Waste Management System

A full-stack waste management application with AI-powered waste classification and analysis.

## 🚀 Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React** with TypeScript
- **Tailwind CSS** for styling
- **NextAuth.js** for authentication
- **SWR** for data fetching and caching

### Backend
- **Node.js** with Express
- **PostgreSQL** database
- **Prisma ORM** for database management
- **JWT** for authentication

### AI/ML
- **YOLOv8** (Ultralytics) for waste classification
- **Groq API** for advanced analysis
- **OpenCV** for image processing

## 📁 Project Structure

```
Waste_Samaritin_9pm/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # Reusable React components
│   │   ├── lib/            # Utilities and SWR hooks
│   │   └── styles/         # Tailwind CSS styles
│   └── package.json
├── backend/                 # Node.js Express backend
│   ├── routes/             # API route handlers
│   ├── ml_models/          # Python ML scripts
│   ├── server.js           # Main server file
│   └── package.json
├── prisma/                 # Database schema and migrations
│   └── schema.prisma
├── shared/                 # Shared assets and constants
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- PostgreSQL database
- Git

### 1. Clone and Setup

```bash
git clone <repository-url>
cd Waste_Samaritin_9pm
```

### 2. Environment Configuration

Copy the example environment file and configure your variables:

```bash
cp env.example .env
```

Edit `.env` with your configuration:
- Database URL
- JWT secrets
- API keys (Groq)
- Server ports

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 4. Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend API will be available at `http://localhost:5000`

### 5. Database Setup

```bash
# Install Prisma CLI globally
npm install -g prisma

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

### 6. ML Models Setup

```bash
cd backend/ml_models
pip install -r requirements.txt

# Download YOLOv8 models (optional)
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

## 🚀 Running the Application

### Development Mode

1. **Start the backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/health

### Production Mode

1. **Build the frontend:**
   ```bash
   cd frontend
   npm run build
   npm start
   ```

2. **Start the backend:**
   ```bash
   cd backend
   npm start
   ```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Waste Management
- `GET /api/waste/reports` - Get all waste reports
- `POST /api/waste/reports` - Create new waste report
- `GET /api/waste/reports/:id` - Get specific waste report
- `PATCH /api/waste/reports/:id/status` - Update report status
- `POST /api/waste/collection-requests` - Create collection request
- `GET /api/waste/collection-requests` - Get collection requests

### AI Services
- `POST /api/ai/classify-waste` - Classify waste using YOLOv8
- `POST /api/ai/analyze-waste` - Analyze waste using Groq API
- `POST /api/ai/batch-classify` - Batch classification
- `GET /api/ai/status` - Check AI model health

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `GROQ_API_KEY` | Groq API key for analysis | - |
| `PORT` | Backend server port | 5000 |
| `NODE_ENV` | Environment mode | development |

### Database Schema

The application uses the following main entities:
- **Users** - Authentication and user management
- **WasteReports** - Waste collection reports
- **CollectionRequests** - Waste collection scheduling
- **AIAnalysis** - AI analysis results

## 🤖 AI Features

### YOLOv8 Waste Classification
- Real-time waste type detection
- Confidence scoring
- Bounding box detection
- Support for multiple waste categories

### Groq API Analysis
- Advanced waste composition analysis
- Environmental impact assessment
- Disposal recommendations
- Safety considerations

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test

# ML model health check
cd backend/ml_models
python health_check.py
```

## 📦 Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
```

### Backend (Production)
```bash
cd backend
npm run build
npm start
```

### Database
- Use managed PostgreSQL service (AWS RDS, Supabase, etc.)
- Run Prisma migrations in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API health endpoint

## 🔄 Updates

Stay updated with the latest changes:
- Follow the repository
- Check the releases page
- Review the changelog 