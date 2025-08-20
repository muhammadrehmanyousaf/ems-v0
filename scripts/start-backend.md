# Backend Server Setup Guide

## Quick Start

If you're experiencing network errors or slow API calls, the backend server might not be running.

### 1. Check if the server is running

Open your browser and go to: `http://localhost:3000`

If you see a "Cannot connect" error, the server is not running.

### 2. Start the backend server

Navigate to your backend project directory and run:

```bash
# If using npm
npm start

# If using yarn
yarn start

# If using pnpm
pnpm start

# If using nodemon for development
nodemon server.js
```

### 3. Verify the server is running

Once started, you should see output like:
```
Server running on port 3000
Database connected
```

### 4. Test the API

Visit: `http://localhost:3000/api/v1/businesses`

You should see a JSON response with vendor data.

## Troubleshooting

### Port 3000 is already in use

If you get an error that port 3000 is already in use:

1. Find what's using the port:
   ```bash
   # On Windows
   netstat -ano | findstr :3000
   
   # On Mac/Linux
   lsof -i :3000
   ```

2. Kill the process or change the port in your backend configuration.

### Database connection issues

Make sure your database (MongoDB/PostgreSQL) is running and the connection string is correct.

### Environment variables

Ensure your `.env` file has the correct configuration:
```
PORT=3000
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_jwt_secret
```

## Development Tips

- Use `nodemon` for automatic server restart on file changes
- Check the server logs for detailed error messages
- The frontend will automatically retry failed requests
- Cached data will be used when the server is unavailable
