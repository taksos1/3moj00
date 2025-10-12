# 🚀 GitHub Auto-Deploy Setup Guide

## Overview
Your developer panel now supports automatic GitHub commits! When you make changes, they'll automatically commit to GitHub and trigger Vercel deployment.

## Setup Steps

### 1. Create GitHub Personal Access Token
1. Go to [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens/new)
2. Click "Generate new token (classic)"
3. Give it a name like "3mojoo-website-deploy"
4. Select **"repo"** permission (full control of private repositories)
5. Click "Generate token"
6. **Copy the token** (starts with `ghp_`)

### 2. Configure in Developer Panel
1. Open your website
2. Press `Ctrl + 15987530` to access developer panel
3. Click "Configure GitHub" button
4. Enter:
   - **GitHub Token**: Your personal access token
   - **GitHub Username**: Your GitHub username
   - **Repository Name**: Your repository name (e.g., `3mojoo-website`)
5. Click "Save Configuration"

### 3. Test the System
1. Add a new portfolio item or client
2. You should see: "Changes committed to GitHub! Vercel will auto-deploy in ~2 minutes"
3. Check your GitHub repository - you'll see the commit
4. Wait ~2 minutes and refresh your live site - changes should appear!

## How It Works

```
Developer Panel → GitHub API → GitHub Repository → Vercel → Live Site
     ↓              ↓              ↓              ↓         ↓
  Make Changes → Auto Commit → Push to Repo → Auto Deploy → Updated Site
```

## Benefits
- ✅ **No manual file replacement**
- ✅ **No manual deployment**
- ✅ **Automatic Vercel deployment**
- ✅ **Version history in GitHub**
- ✅ **Fallback to download if GitHub fails**

## Security Notes
- Your GitHub token is stored locally in your browser
- Only you can access the developer panel
- Token has minimal required permissions
- You can revoke the token anytime in GitHub settings

## Troubleshooting

### "GitHub token not configured"
- Make sure you've completed the setup steps above
- Check that the token has "repo" permission

### "GitHub API error"
- Verify your username and repository name are correct
- Check that the repository exists and you have write access
- Ensure your token hasn't expired

### Changes not appearing on live site
- Check Vercel dashboard for deployment status
- Verify the commit was successful in GitHub
- Wait a few minutes for Vercel to process the deployment

## Alternative: Manual Method
If you prefer the old method:
1. Make changes in developer panel
2. Download the generated `data.json` file
3. Replace `data/data.json` in your project
4. Commit and push to GitHub manually
5. Vercel will auto-deploy

---

**Need help?** Check the browser console for detailed error messages.
