# KRONOS-OUTREACH ENGINE 🚀

**Automated outreach that actually converts.**

KRONOS is a powerful N8N-based outreach automation engine designed to help you scale personalized outreach campaigns without losing the human touch.

## 🎯 What It Does

- **Automated Email Outreach** - Send personalized emails at scale
- **Smart Follow-ups** - Automatically follow up with prospects after X days
- **Multi-Source Contact Import** - Webhook, Google Sheets, or CSV
- **Personalization Engine** - Dynamic templates with custom fields
- **Response Tracking** - Log all interactions in Google Sheets
- **Rate Limiting** - Stay within email provider limits
- **Scheduled Execution** - Daily automation for follow-ups

## 🚀 Quick Start

### Option 1: N8N Workflow (Start Here)

1. **Install N8N**
   ```bash
   docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
   ```

2. **Import the Workflow**
   - Open N8N at `http://localhost:5678`
   - Import `kronos-outreach-workflow.json`

3. **Configure Credentials**
   - Add SMTP credentials (Gmail, SendGrid, etc.)
   - Add Google Sheets credentials (optional)

4. **Customize Templates**
   - Edit the Personalization Engine node
   - Add your email templates
   - Set your signature

5. **Start Outreaching!**
   - Upload contacts via CSV or Google Sheets
   - Or use the webhook API

📖 **Full Setup Guide:** [N8N-SETUP-GUIDE.md](./N8N-SETUP-GUIDE.md)

### Option 2: Web App (Coming Soon)

After we perfect the N8N workflow, we'll build a full web app with:
- Dashboard for campaign management
- Contact list management
- Analytics and reporting
- Response tracking
- Team collaboration

## 📁 Files

- `kronos-outreach-workflow.json` - N8N workflow configuration
- `N8N-SETUP-GUIDE.md` - Complete setup instructions
- `contacts-template.csv` - Sample contact list format
- `.env.template` - Configuration template

## 🎨 Features

### Personalization Engine
- Dynamic subject lines
- Custom email body templates
- Contact-specific data injection
- Randomized templates to avoid spam

### Follow-up Automation
- Configurable follow-up delays
- Multiple follow-up sequences
- Automatic status tracking
- Smart scheduling (weekdays only)

### Rate Limiting
- Prevent spam flags
- Stay within provider limits
- Configurable delays
- Batch processing

### Contact Management
- Import from multiple sources
- Data validation
- Duplicate detection
- Status tracking

## 🔧 Configuration

Copy `.env.template` to `.env` and configure:

```bash
cp .env.template .env
nano .env
```

Key settings:
- SMTP credentials
- Google Sheets IDs
- Rate limits
- Follow-up timing
- Personalization variables

## 📊 Contact Data Format

Your contacts should include:
- `email` - Contact email (required)
- `firstName` - First name (required)
- `lastName` - Last name
- `company` - Company name
- `position` - Job title
- `industry` - Industry/sector
- `customField1` - Custom data for personalization
- `fromEmail` - Sender email address

See `contacts-template.csv` for examples.

## 🧪 Testing

1. Start with test data (your own email)
2. Verify personalization works
3. Check Google Sheets logging
4. Test follow-up logic
5. Scale gradually (10-20 emails/day initially)

## 📈 Best Practices

1. **Warm up your domain** - Start slow, increase gradually
2. **Personalize everything** - Use real research in customField1
3. **Test templates** - A/B test subject lines and content
4. **Monitor metrics** - Track open rates and responses
5. **Follow regulations** - CAN-SPAM, GDPR compliance
6. **Quality over quantity** - Better to send 10 great emails than 100 generic ones

## 🚨 Important Notes

- Gmail limit: ~500 emails/day
- Use App Passwords for Gmail (not your main password)
- Include unsubscribe option for compliance
- Only contact B2B prospects
- Monitor spam rates

## 🛣️ Roadmap

### Phase 1: N8N Workflow (Current)
- [x] Basic outreach automation
- [x] Personalization engine
- [x] Follow-up automation
- [x] Google Sheets integration
- [ ] Testing and iteration

### Phase 2: Web App (Next)
- [ ] User authentication
- [ ] Campaign dashboard
- [ ] Contact list manager
- [ ] Analytics and reporting
- [ ] Team collaboration
- [ ] Response tracking
- [ ] A/B testing framework

### Phase 3: Advanced Features
- [ ] AI-powered personalization
- [ ] LinkedIn integration
- [ ] Multi-channel outreach
- [ ] CRM integrations
- [ ] Email warmup automation
- [ ] Deliverability optimization

## 🆘 Troubleshooting

**Emails not sending?**
- Check SMTP credentials
- Verify email provider limits
- Check spam folder

**Follow-ups not working?**
- Activate the Daily Trigger
- Check Google Sheets connection
- Verify status column values

**Personalization broken?**
- Check contact data format
- Review JavaScript in Personalization Engine
- Test with simple template first

## 📝 License

MIT License - Do whatever you want with it!

## 🤝 Contributing

This is a personal project, but feel free to fork and customize for your needs.

---

**Ready to scale your outreach? Start with the N8N workflow and let's crush it!** 💪
