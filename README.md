# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://127.0.0.1:3000](http://127.0.0.1:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Deployment (Vercel + Railway)

**Frontend (Vercel)**  
Set the backend URL so the app talks to your Railway server:

1. In Vercel: Project → **Settings** → **Environment Variables**
2. Add: **Name** `REACT_APP_API_URL`, **Value** your Railway backend URL (e.g. `https://your-app-name.up.railway.app`)
3. Use **Production** (and optionally Preview) and save
4. **Redeploy** the project so the new variable is used in the build

If `REACT_APP_API_URL` is not set, the frontend falls back to `http://127.0.0.1:4000`, so API calls go to localhost and fail in production (or you may see 405 if the request hits the wrong host).

**Backend (Railway)**  
- Ensure `MONGO_URI`, `JWT_SECRET`, and any other env vars are set in Railway.
- The backend CORS is set to allow your Vercel origin; if you use a custom domain, you may need to allow it explicitly in `backend/index.js` (e.g. add your Vercel URL to `origin`).

## Testing locally without AWS (avoid S3 storage usage)

To test uploads and media locally **without using AWS S3** (so you don’t run out of storage or incur usage):

1. **Don’t set AWS env vars**  
   In your local `backend/.env`, omit (or comment out) `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_S3_BUCKET`.  
   The backend will use **local disk storage** under `backend/uploads/photos` and `backend/uploads/videos`. Uploaded files are served at `/uploads/...` and are already in `.gitignore`.

2. **Or force local storage**  
   If your `.env` has AWS credentials for production but you want local runs to skip S3, set:
   ```bash
   USE_LOCAL_STORAGE=true
   ```
   in `backend/.env`. The backend will then use local disk even when AWS vars are present.

3. **Check usage in production**  
   In the [AWS S3 console](https://s3.console.aws.amazon.com/) → your bucket → **Metrics**, or [Billing](https://console.aws.amazon.com/billing/) → **Bills** → **S3**, you can monitor storage and requests.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
