# Memo Maker User Guide

Welcome to Memo Maker - your AI-powered meeting memo generator that transforms audio recordings into structured, actionable meeting summaries.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating Your Account](#creating-your-account)
3. [Creating Your First Memo](#creating-your-first-memo)
4. [Understanding Your Memos](#understanding-your-memos)
5. [Managing Memos](#managing-memos)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

---

## Getting Started

### What is Memo Maker?

Memo Maker is an intelligent application that:
- **Transcribes** your meeting audio using OpenAI Whisper
- **Analyzes** the conversation to extract key information
- **Generates** structured memos with summaries, action items, and decisions
- **Organizes** all your meeting memos in one place

### What You'll Need

- A web browser (Chrome, Firefox, Safari, or Edge)
- Meeting audio files (MP3, WAV, or M4A format)
- An internet connection
- An account (free to create)

### Supported Audio Formats

- **MP3** - Most common format
- **WAV** - High quality, larger file size
- **M4A** - Apple/iPhone recordings
- **Maximum file size**: 100MB
- **Recommended length**: 5 minutes to 2 hours

---

## Creating Your Account

### Step 1: Register

1. Navigate to the Memo Maker website
2. Click **"Sign Up"** or **"Create Account"**
3. Fill in the registration form:
   - **Full Name**: Your name (e.g., "John Smith")
   - **Email**: Your email address
   - **Password**: At least 8 characters with:
     - One uppercase letter (A-Z)
     - One lowercase letter (a-z)
     - One number (0-9)
   - **Confirm Password**: Re-enter your password

4. Click **"Create Account"**
5. You'll be automatically logged in and redirected to your dashboard

### Step 2: Verify Your Account

After registration, you'll receive a welcome email with:
- Login instructions
- Account information
- Quick start guide link

### Security Tips

- Use a strong, unique password
- Don't share your account credentials
- Log out when using shared computers
- Enable two-factor authentication (coming soon)

---

## Creating Your First Memo

### Step 1: Navigate to Create Memo

1. From your dashboard, click **"New Memo"** button (top right)
2. Or navigate to the Memos page and click **"+ Create Memo"**

### Step 2: Fill in Memo Details

You'll see a form with the following fields:

#### Meeting Title (Required)
- Give your meeting a descriptive name
- Example: "Q1 Product Planning Meeting"
- Tip: Include the team or project name for easy searching

#### Meeting Date (Optional)
- Defaults to today's date
- You can change it to the actual meeting date
- Format: MM/DD/YYYY or use the date picker

#### Participants (Optional)
- Enter names of meeting attendees
- Separate names with commas: "Alice, Bob, Charlie"
- Tip: This helps the AI identify speakers in the transcript

#### Audio File (Required)
- Click **"Choose File"** or drag and drop your audio file
- Accepted formats: MP3, WAV, M4A
- Maximum size: 100MB
- You'll see the file name and size after selection

### Step 3: Upload and Process

1. Review your information
2. Click **"Create Memo"**
3. You'll see a progress indicator showing:
   - ⏳ **Uploading** - Sending audio to server
   - 🎤 **Transcribing** - Converting speech to text (2-5 minutes)
   - 🤖 **Generating** - AI creating structured memo (30-60 seconds)
   - ✅ **Completed** - Memo is ready!

### What Happens Next?

The system processes your memo in three stages:

1. **Upload** (a few seconds)
   - Your audio file is securely uploaded to cloud storage

2. **Transcription** (2-5 minutes per hour of audio)
   - OpenAI Whisper transcribes the audio
   - Identifies speakers when possible
   - Creates timestamped segments

3. **Memo Generation** (30-60 seconds)
   - GPT-4 analyzes the transcript
   - Extracts key information
   - Generates structured memo

**Total Time**: Usually 3-6 minutes for a 1-hour meeting

---

## Understanding Your Memos

Once processing is complete, your memo will contain:

### Summary

A concise 2-3 sentence overview of the meeting:

```
The team discussed Q1 product roadmap priorities, deciding to focus on
performance improvements over new features. Key blockers were identified
around AWS credentials and database migration timeline.
```

### Key Points

Main topics and discussions from the meeting:

- ✓ Decided to prioritize performance over new features in Q1
- ✓ Database migration completed successfully
- ✓ S3 integration blocked pending AWS credentials
- ✓ API documentation needs to be updated

### Action Items

Tasks assigned during the meeting with owners and due dates:

| Task | Owner | Due Date | Priority |
|------|-------|----------|----------|
| Provide AWS credentials to Charlie | Alice | End of day | High |
| Review database migration PR | Bob | This afternoon | Medium |
| Update API documentation | Bob | This week | Medium |
| Design performance metrics dashboard | Lisa | Next Friday | Low |

### Decisions

Important decisions made during the meeting:

- ✅ Q1 roadmap focus: Performance improvements
- ✅ Q2 roadmap focus: Onboarding redesign
- ✅ Use REST API with OpenAPI documentation

### Next Steps

Follow-up actions and future plans:

- Bob will review PR this afternoon
- Alice to work on frontend features
- Schedule follow-up meeting for next week
- Lisa to prepare mockups for performance dashboard

### Attendees

People who participated in the meeting:

- Alice (Project Manager)
- Bob (Engineer)
- Charlie (Engineer)

### Transcript

Full transcription with timestamps:

```
[00:00:15] Alice: Good morning everyone. Let's start with our daily standup.
[00:00:22] Bob: I finished the authentication module yesterday...
[00:00:45] Charlie: I completed the database migration...
```

**Tip**: Use timestamps to jump to specific parts of the recording

---

## Managing Memos

### Viewing Your Memos

**Dashboard View**:
- Shows all your memos in a list
- Each memo card displays:
  - Title
  - Date
  - Status (Completed, Processing, Failed)
  - Participants
  - Quick summary
  - Duration

**Sorting and Filtering**:
- **All** - Show all memos
- **Completed** - Only finished memos
- **Processing** - Memos currently being processed
- **Failed** - Memos with errors

### Opening a Memo

1. Click on any memo card
2. View the full detailed memo
3. See complete transcript with timestamps
4. Read summary, action items, decisions

### Downloading Memos

1. Open the memo you want to download
2. Click the **"Download"** or **"Export"** button
3. Choose format:
   - **PDF** - Formatted document
   - **Markdown** - Plain text with formatting
   - **JSON** - Raw data for integrations

### Deleting Memos

1. Open the memo
2. Click **"Delete"** button (usually in top-right or bottom)
3. Confirm deletion
4. **Warning**: This action cannot be undone

**When to Delete**:
- Test recordings
- Duplicate memos
- Memos with errors you can't fix

---

## Best Practices

### Recording Tips

**For Best Results**:

✅ **DO**:
- Use a good quality microphone
- Record in a quiet environment
- Speak clearly and at a moderate pace
- State your name when speaking ("This is Alice...")
- Mention action items explicitly
- State decisions clearly
- Include dates and deadlines when assigning tasks

❌ **AVOID**:
- Background noise (music, traffic, construction)
- Multiple people talking simultaneously
- Extremely fast or whispered speech
- Very long meetings (split into segments)
- Low-quality phone recordings

### Meeting Structure

To get the most accurate memos:

1. **Start with introductions**
   - "This is Alice, Project Manager"
   - Helps AI identify speakers

2. **Clearly state agenda items**
   - "Let's discuss three topics today..."
   - Improves key points extraction

3. **Explicitly mention action items**
   - "Bob, can you review the PR by Friday?"
   - AI extracts owner and deadline

4. **Summarize decisions**
   - "So we've decided to go with Option A"
   - Makes decisions obvious to AI

5. **End with next steps**
   - "Our next meeting is Monday at 10am"
   - Captured in "Next Steps" section

### Memo Organization

**Naming Convention**:
- Use consistent naming: `[Team] - [Topic] - [Date]`
- Example: "Engineering - Sprint Planning - 2025-01-15"

**Participants**:
- Always list all attendees
- Use full names or consistent nicknames
- Helps with transcript accuracy

**Regular Reviews**:
- Check memos after processing
- Verify action items are correct
- Download important memos for backup

---

## Troubleshooting

### Upload Issues

**Problem**: File upload fails or stalls

**Solutions**:
- Check your internet connection
- Verify file size is under 100MB
- Try a different audio format
- Refresh the page and try again
- Clear browser cache

### Transcription Errors

**Problem**: Transcript is inaccurate

**Common Causes**:
- Poor audio quality
- Strong accents
- Technical jargon
- Multiple speakers at once

**Solutions**:
- Use higher quality recordings
- Speak more clearly
- Define technical terms at start
- Avoid overlapping speech

### Missing Information

**Problem**: Action items or decisions not extracted

**Why This Happens**:
- Information stated implicitly
- Vague language
- Decisions made offline

**How to Fix**:
- State action items explicitly
- Use clear language: "Alice will do X by Friday"
- Record follow-up discussions

### Processing Stuck

**Problem**: Memo stuck in "Processing" status

**Steps**:
1. Wait 10 minutes (processing can be slow)
2. Refresh the page
3. If still stuck after 15 minutes:
   - Check status filters
   - Try a different browser
   - Contact support with memo ID

### Failed Memos

**Problem**: Memo shows "Failed" status

**Common Reasons**:
- Audio file corrupted
- Unsupported audio format
- Very poor audio quality
- Server error

**What to Do**:
1. Check error message (hover over status or view details)
2. Try re-uploading with different file
3. Verify audio plays correctly on your device
4. Contact support if problem persists

---

## FAQ

### General Questions

**Q: How long does it take to process a memo?**
A: Typically 3-6 minutes for a 1-hour meeting. Longer meetings take proportionally longer. Transcription is the longest step (2-5 minutes per hour of audio).

**Q: What languages are supported?**
A: Currently, English is fully supported. Other languages may work but with reduced accuracy. We're working on expanding language support.

**Q: Can I edit the generated memo?**
A: The current version doesn't support editing. This feature is coming soon. For now, you can download the memo and edit it locally.

**Q: How accurate is the transcription?**
A: Accuracy depends on audio quality. With clear audio and minimal background noise, accuracy is typically 90-95%. Technical jargon or heavy accents may reduce accuracy.

**Q: Is my data secure?**
A: Yes! All audio files and memos are:
- Encrypted in transit (HTTPS)
- Stored securely in the cloud
- Only accessible to you
- Never shared with third parties (except OpenAI for processing)

### Audio and Upload

**Q: Why is there a 100MB file size limit?**
A: This is to ensure reasonable processing times and server costs. A 100MB audio file is approximately 2-3 hours of recording, which should cover most meetings.

**Q: Can I upload video files?**
A: No, only audio files are currently supported. You can extract audio from video using free tools before uploading.

**Q: What if my meeting recording is split into multiple files?**
A: Create a separate memo for each file, or use audio editing software to combine them first.

**Q: Can I upload a recording from my phone?**
A: Yes! Most phone recordings (iPhone voice memos, Android recordings) work perfectly. Just transfer the file to your computer first.

### Features and Capabilities

**Q: Can I share memos with teammates?**
A: Sharing is not currently available but is planned for a future release. For now, use the download feature to share PDFs.

**Q: Can I integrate Memo Maker with other tools?**
A: API access is coming soon, which will allow integrations with tools like Slack, Notion, and calendar apps.

**Q: Does the AI understand different accents?**
A: OpenAI Whisper is trained on diverse accents and usually performs well. However, very strong accents may affect accuracy.

**Q: Can I customize the memo format?**
A: Not currently, but customization options are planned. All memos currently use the standard format with Summary, Key Points, Action Items, Decisions, and Next Steps.

**Q: What about phone numbers, dates, and email addresses in the conversation?**
A: The AI generally captures these accurately if spoken clearly. For best results, spell out email addresses and state dates in full format.

### Pricing and Limits

**Q: How many memos can I create?**
A: Your subscription plan determines your monthly memo limit. Check your account settings for details.

**Q: What happens if I reach my limit?**
A: You'll receive a notification. You can either wait until next month or upgrade your plan for more memos.

**Q: Can I delete old memos to free up space?**
A: Deleting memos doesn't affect your monthly creation limit. The limit resets at the start of each billing cycle.

### Technical Issues

**Q: Which browsers are supported?**
A: Memo Maker works best on:
- Chrome (latest version)
- Firefox (latest version)
- Safari (latest version)
- Edge (latest version)

**Q: Do I need to install any software?**
A: No! Memo Maker is entirely web-based. Just use your browser.

**Q: Can I use Memo Maker on mobile?**
A: The website is mobile-responsive, but uploading large audio files is recommended from a desktop for better reliability.

**Q: Why is my audio file upload slow?**
A: Upload speed depends on your internet connection and file size. A 50MB file typically takes 1-2 minutes on a standard connection.

---

## Tips and Tricks

### Pro Tips

1. **Use Consistent Naming**
   - Create a naming convention for your team
   - Makes searching and organizing easier

2. **Review Immediately**
   - Check memos right after processing
   - Catch and report any issues while meeting is fresh

3. **Download Important Memos**
   - Keep local backups of critical meetings
   - Useful for offline access

4. **State Names Clearly**
   - "This is Bob speaking"
   - Improves speaker identification

5. **Mention Due Dates Explicitly**
   - "Please complete this by next Friday, January 20th"
   - AI extracts exact dates

6. **Summarize at End**
   - Quick recap of decisions and action items
   - Reinforces AI's extraction

7. **Split Long Meetings**
   - If meeting exceeds 2 hours, split into segments
   - Faster processing, easier to review

### Keyboard Shortcuts

- `Ctrl/Cmd + N` - New Memo
- `Ctrl/Cmd + S` - Download/Save current memo
- `Ctrl/Cmd + F` - Search memos
- `Esc` - Close modal/dialog

---

## Getting Help

### Support Resources

**Documentation**:
- This User Guide
- [API Documentation](/docs/API.md)
- [Architecture Guide](/docs/ARCHITECTURE.md)

**Contact Support**:
- Email: support@memomaker.com
- Response time: 24-48 hours
- Include memo ID for faster assistance

**Community**:
- Join our Slack community
- Share tips and best practices
- Get help from other users

**Feature Requests**:
- Submit via GitHub Issues
- Vote on existing requests
- See roadmap for upcoming features

---

## What's Next?

Congratulations! You now know how to use Memo Maker effectively. Here's what to do next:

1. ✅ Create your first memo
2. ✅ Explore the different sections
3. ✅ Download a memo to try the export feature
4. ✅ Share this guide with your team
5. ✅ Set up a naming convention for your organization

**Ready to transform your meetings?**
Start creating memos today and never miss important action items or decisions again!

---

## Appendix

### Audio Recording Recommendations

**Equipment**:
- Built-in laptop mic: Acceptable for small meetings
- External USB mic: Better quality
- Conference room systems: Best for large meetings
- Phone recordings: Works well for 1-on-1s

**Software**:
- **Mac**: QuickTime, GarageBand, Voice Memos
- **Windows**: Voice Recorder, Audacity
- **iOS**: Voice Memos app
- **Android**: Voice Recorder, Easy Voice Recorder

**Settings**:
- Sample rate: 16kHz or higher
- Format: MP3 (for smaller files) or WAV (for best quality)
- Mono vs Stereo: Mono is fine for meetings

### Privacy and Security

**Data Handling**:
- Audio files stored encrypted in AWS S3
- Transcripts and memos in secure PostgreSQL database
- Processed via OpenAI API (see their privacy policy)
- Deleted data is permanently removed within 30 days

**Access Control**:
- Only you can access your memos
- Passwords are hashed (never stored in plain text)
- JWT tokens expire after 7 days
- No sharing of data with third parties

**GDPR Compliance**:
- Right to access your data
- Right to delete your data
- Data export available
- Contact privacy@memomaker.com for requests

---

*Last Updated: January 2025*
*Version: 1.0*
*For questions or feedback: support@memomaker.com*
